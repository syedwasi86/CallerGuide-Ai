import abc
import json
import logging
from typing import Any, Dict, Optional, Tuple
import httpx

from app.schemas.ai import SuggestionResponse

logger = logging.getLogger(__name__)

# Shared HTTP client with connection pooling for low-latency keep-alive reuse
_SHARED_CLIENT: Optional[httpx.AsyncClient] = None


def get_shared_client() -> httpx.AsyncClient:
    """Returns or lazily creates a shared AsyncClient with connection pooling."""
    global _SHARED_CLIENT
    if _SHARED_CLIENT is None or _SHARED_CLIENT.is_closed:
        _SHARED_CLIENT = httpx.AsyncClient(
            limits=httpx.Limits(
                max_keepalive_connections=10,
                max_connections=20,
                keepalive_expiry=30.0,
            )
        )
    return _SHARED_CLIENT


class BaseLlmProvider(abc.ABC):
    """
    Abstract base provider for LLM completion services.
    Enforces unified response extraction, timeout handling, retry boundaries,
    and granular timing instrumentation.
    """

    def __init__(self, api_key: str, model: str):
        self.api_key = api_key.strip() if api_key else ""
        self.model = model.strip() if model else ""

    @property
    @abc.abstractmethod
    def provider_name(self) -> str:
        """Returns the canonical provider identifier, e.g. 'gemini' or 'groq'."""
        pass

    @abc.abstractmethod
    async def generate(
        self,
        prompt: str,
        stage_number: int,
        timeout: httpx.Timeout,
    ) -> Tuple[Optional[SuggestionResponse], Optional[str], Dict[str, Any]]:
        """
        Executes completion request against the provider.
        Returns:
            Tuple of (SuggestionResponse or None, fallback_reason or None, timing_metrics_dict)
        """
        pass

    def _parse_json_payload(
        self, raw_text: str, stage_number: int
    ) -> Optional[SuggestionResponse]:
        """
        Safely extracts and validates JSON fields from provider completion text.
        Handles possible markdown code fences (```json ... ```).
        """
        try:
            clean_text = raw_text.strip()
            if clean_text.startswith("```"):
                lines = clean_text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                clean_text = "\n".join(lines).strip()

            parsed = json.loads(clean_text)
            if not isinstance(parsed, dict):
                return None

            suggestion = parsed.get("suggestion")
            if not suggestion or not isinstance(suggestion, str) or not suggestion.strip():
                return None

            alternative = parsed.get("alternative")
            if alternative is not None and not isinstance(alternative, str):
                alternative = str(alternative)

            rationale = parsed.get("rationale")
            if rationale is not None and not isinstance(rationale, str):
                rationale = str(rationale)

            return SuggestionResponse(
                suggestion=suggestion.strip(),
                stage_number=stage_number,
                alternative=alternative.strip() if alternative else None,
                rationale=rationale.strip() if rationale else None,
                is_fallback=False,
                provider=self.provider_name,
                fallback_reason=None,
            )
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Failed to parse LLM JSON response from {self.provider_name}: {e}")
            return None
