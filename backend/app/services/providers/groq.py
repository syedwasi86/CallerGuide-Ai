import asyncio
import logging
import time
from typing import Any, Dict, Optional, Tuple
import httpx

from app.schemas.ai import SuggestionResponse
from .base import BaseLlmProvider, get_shared_client

logger = logging.getLogger(__name__)


class GroqProvider(BaseLlmProvider):
    """
    Groq OpenAI-compatible Chat Completions API implementation.
    Targets ultra-low-latency inference using OpenAI-compatible JSON mode.
    """

    @property
    def provider_name(self) -> str:
        return "groq"

    async def generate(
        self,
        prompt: str,
        stage_number: int,
        timeout: httpx.Timeout,
    ) -> Tuple[Optional[SuggestionResponse], Optional[str], Dict[str, Any]]:
        if not self.api_key:
            return None, "No Groq API key configured", {"status": 0, "total_time": 0.0}

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 120,
            "response_format": {"type": "json_object"},
        }

        client = get_shared_client()
        max_attempts = 2  # 1 initial call + at most 1 retry for transient issues
        last_error_reason = "Unknown error"
        metrics: Dict[str, Any] = {
            "provider": self.provider_name,
            "model": self.model,
            "status": 0,
            "attempts": 0,
            "provider_time": 0.0,
            "parse_time": 0.0,
            "total_time": 0.0,
        }

        overall_start = time.perf_counter()

        for attempt in range(1, max_attempts + 1):
            metrics["attempts"] = attempt
            attempt_start = time.perf_counter()
            try:
                resp = await client.post(url, json=body, headers=headers, timeout=timeout)
                provider_elapsed = time.perf_counter() - attempt_start
                metrics["provider_time"] = provider_elapsed
                metrics["status"] = resp.status_code

                if resp.status_code == 200:
                    parse_start = time.perf_counter()
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        raw_text = choices[0].get("message", {}).get("content", "")
                        parsed = self._parse_json_payload(raw_text, stage_number)
                        parse_elapsed = time.perf_counter() - parse_start
                        metrics["parse_time"] = parse_elapsed
                        metrics["total_time"] = time.perf_counter() - overall_start

                        if parsed:
                            logger.info(
                                f"Groq API succeeded: model={self.model}, attempt={attempt}, "
                                f"provider_time={provider_elapsed:.3f}s, parse_time={parse_elapsed:.3f}s, "
                                f"total_time={metrics['total_time']:.3f}s"
                            )
                            return parsed, None, metrics

                    last_error_reason = f"Unexpected response structure from Groq API (elapsed: {provider_elapsed:.2f}s)"
                    logger.warning(
                        f"Unexpected response structure from Groq API (model: {self.model}, attempt: {attempt}, elapsed: {provider_elapsed:.2f}s)"
                    )
                    break

                status = resp.status_code
                # Non-retriable auth errors
                if status in (401, 403):
                    last_error_reason = f"Authentication failure (HTTP {status})"
                    logger.error(
                        f"Groq authentication failed (HTTP {status}, elapsed: {provider_elapsed:.2f}s). Not retrying."
                    )
                    break

                # Non-retriable model error
                if status == 404:
                    last_error_reason = f"Model '{self.model}' not found (HTTP 404)"
                    logger.error(
                        f"Groq model '{self.model}' not found (HTTP 404, elapsed: {provider_elapsed:.2f}s). Not retrying."
                    )
                    break

                # Non-retriable client errors
                if 400 <= status < 500 and status != 429:
                    last_error_reason = f"Client request error (HTTP {status})"
                    logger.error(
                        f"Groq client request error (HTTP {status}, elapsed: {provider_elapsed:.2f}s). Not retrying."
                    )
                    break

                # Retriable transient errors: HTTP 429 or HTTP 5xx
                if status == 429:
                    last_error_reason = f"Rate limit exceeded (HTTP 429, elapsed: {provider_elapsed:.2f}s)"
                    logger.warning(f"Groq rate limited (attempt: {attempt}, elapsed: {provider_elapsed:.2f}s)")
                elif status >= 500:
                    last_error_reason = f"Provider server error (HTTP {status}, elapsed: {provider_elapsed:.2f}s)"
                    logger.warning(f"Groq server error (HTTP {status}, attempt: {attempt}, elapsed: {provider_elapsed:.2f}s)")

                if attempt < max_attempts:
                    logger.info("Retrying Groq request once for transient error...")
                    await asyncio.sleep(1.0)
                    continue
                break

            except httpx.ConnectTimeout:
                elapsed = time.perf_counter() - attempt_start
                last_error_reason = f"Connection timeout after {timeout.connect}s"
                logger.warning(f"Groq connection timed out (attempt: {attempt}, elapsed: {elapsed:.2f}s)")
                if attempt < max_attempts:
                    logger.info("Retrying Groq request once for connection timeout...")
                    await asyncio.sleep(0.5)
                    continue
                break

            except (httpx.ConnectError, httpx.NetworkError) as e:
                elapsed = time.perf_counter() - attempt_start
                last_error_reason = f"Connection failure: {e.__class__.__name__}"
                logger.warning(f"Groq network failure (attempt: {attempt}, elapsed: {elapsed:.2f}s): {e.__class__.__name__}")
                if attempt < max_attempts:
                    logger.info("Retrying Groq request once for network failure...")
                    await asyncio.sleep(0.5)
                    continue
                break

            except httpx.ReadTimeout:
                elapsed = time.perf_counter() - attempt_start
                last_error_reason = f"Response read timeout after {timeout.read}s"
                logger.warning(f"Groq read timed out after {timeout.read}s (elapsed: {elapsed:.2f}s). Not retrying.")
                # Read timeout is never retried to avoid caller stall
                break

            except Exception as e:
                elapsed = time.perf_counter() - attempt_start
                last_error_reason = f"Unexpected error: {e.__class__.__name__}"
                logger.error(f"Groq unexpected error (attempt: {attempt}, elapsed: {elapsed:.2f}s): {e.__class__.__name__}")
                break

        metrics["total_time"] = time.perf_counter() - overall_start
        return None, last_error_reason, metrics
