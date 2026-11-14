import asyncio
import json
import logging
import time
from typing import Optional, Tuple
import httpx

from app.core.config import settings
from app.schemas.ai import SuggestionRequest, SuggestionResponse

logger = logging.getLogger(__name__)

# Patterns indicating hard rejection or request to cease contact
DO_NOT_CALL_KEYWORDS = [
    "do not call",
    "don't call",
    "stop calling",
    "never call",
    "remove my number",
    "remove from list",
    "punha naka pathvu",
    "naka pathvu",
    "nahi chahiye",
    "don't contact",
    "do not contact",
    "wrong number don't call",
    "take me off",
]


class AiService:
    """
    AI Response Suggestion Service.
    Generates contextual spoken-sentence guidance for callers using Google Gemini
    with configurable HTTP timeouts, controlled single retry for transient failures,
    ethical guardrails, and intelligent transcript-backed rule engine fallbacks.
    """

    def __init__(self):
        self.api_key = settings.llm_api_key.strip() if settings.llm_api_key else ""
        self.model = settings.llm_model.strip() if settings.llm_model else "gemini-2.5-flash"

    def _get_httpx_timeout(self) -> httpx.Timeout:
        """Constructs HTTPX timeout from configured application settings."""
        return httpx.Timeout(
            connect=settings.llm_connect_timeout_seconds,
            read=settings.llm_read_timeout_seconds,
            write=settings.llm_write_timeout_seconds,
            pool=settings.llm_pool_timeout_seconds,
        )

    def _is_do_not_call(self, payload: SuggestionRequest) -> bool:
        """Determines if prospect has requested no further contact."""
        if payload.selected_outcome in ["do_not_call", "polite_exit"]:
            return payload.selected_outcome == "do_not_call"

        words_lower = (payload.prospect_words or "").lower().strip()
        return any(phrase in words_lower for phrase in DO_NOT_CALL_KEYWORDS)

    async def generate_suggestion(self, payload: SuggestionRequest) -> SuggestionResponse:
        """
        Generates contextual call response guidance based on stage, outcome, and prospect words.
        Strictly prioritizes ethical guardrails, then live Gemini with retry, then transcript fallback.
        """
        # 1. Guardrail: If prospect requested no contact, strictly enforce respectful exit
        if self._is_do_not_call(payload):
            return SuggestionResponse(
                suggestion=(
                    "I completely understand and respect your decision. I will update our records "
                    "immediately so you are not contacted again. Thank you for your time, and have a good day."
                ),
                stage_number=payload.stage_number,
                alternative=(
                    "Understood. We will remove your number from our contact list right away. "
                    "Thank you, and take care."
                ),
                rationale=(
                    "Prospect requested no contact. Ethical cold-calling principles strictly prohibit "
                    "objection-handling, persuasion, or continued selling in this scenario."
                ),
                is_fallback=False,
                provider="guardrail",
                fallback_reason=None,
            )

        # 2. Attempt live Gemini generation if API key is configured
        fallback_reason: Optional[str] = None
        if self.api_key:
            llm_response, reason = await self._execute_gemini_request(payload)
            if llm_response:
                return llm_response
            fallback_reason = reason or "Gemini API unavailable"
        else:
            fallback_reason = "No LLM API key configured"

        # 3. Deterministic transcript-grounded rule engine fallback
        return self._generate_transcript_fallback(payload, reason=fallback_reason)

    async def _execute_gemini_request(
        self, payload: SuggestionRequest
    ) -> Tuple[Optional[SuggestionResponse], Optional[str]]:
        """
        Calls Google Gemini REST API with configurable timeouts and at most ONE retry for transient errors.
        Never logs credentials or full API keys.
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }
        body = {
            "contents": [
                {
                    "parts": [
                        {"text": self._build_prompt(payload)}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "topP": 0.9,
                "maxOutputTokens": 300,
                "responseMimeType": "application/json",
            },
        }

        timeout = self._get_httpx_timeout()
        max_attempts = 2  # 1 initial call + at most 1 retry for transient issues
        last_error_reason = "Unknown error"

        for attempt in range(1, max_attempts + 1):
            start_time = time.perf_counter()
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(url, json=body, headers=headers)
                    elapsed = time.perf_counter() - start_time

                    if resp.status_code == 200:
                        parsed = self._parse_gemini_response(resp, payload.stage_number)
                        if parsed:
                            logger.info(
                                f"Gemini API request succeeded (attempt: {attempt}, elapsed: {elapsed:.2f}s)"
                            )
                            return parsed, None
                        else:
                            last_error_reason = f"Unexpected response structure from Gemini API (elapsed: {elapsed:.2f}s)"
                            logger.warning(
                                f"Unexpected response structure from Gemini API (attempt: {attempt}, elapsed: {elapsed:.2f}s)"
                            )
                            # Do not retry unparseable responses
                            break

                    status = resp.status_code
                    # Non-retriable client / auth errors
                    if status in (401, 403) or (status == 400 and "API_KEY_INVALID" in resp.text):
                        last_error_reason = f"Authentication failure (HTTP {status})"
                        logger.error(
                            f"Gemini API authentication failed (HTTP {status}, elapsed: {elapsed:.2f}s). Not retrying."
                        )
                        break

                    if status == 404:
                        last_error_reason = f"Model '{self.model}' not found (HTTP 404)"
                        logger.error(
                            f"Gemini API model '{self.model}' not found (HTTP 404, elapsed: {elapsed:.2f}s). Not retrying."
                        )
                        break

                    if 400 <= status < 500 and status != 429:
                        last_error_reason = f"Client request error (HTTP {status})"
                        logger.error(
                            f"Gemini API client request error (HTTP {status}, elapsed: {elapsed:.2f}s). Not retrying."
                        )
                        break

                    # Retriable transient errors: HTTP 429 (Rate limit) or HTTP 5xx (Server error)
                    if status == 429:
                        last_error_reason = f"Rate limit exceeded (HTTP 429, elapsed: {elapsed:.2f}s)"
                        logger.warning(
                            f"Gemini API rate limited (attempt: {attempt}, elapsed: {elapsed:.2f}s)"
                        )
                    elif status >= 500:
                        last_error_reason = f"Provider server error (HTTP {status}, elapsed: {elapsed:.2f}s)"
                        logger.warning(
                            f"Gemini API provider server error (HTTP {status}, attempt: {attempt}, elapsed: {elapsed:.2f}s)"
                        )

                    if attempt < max_attempts:
                        logger.info("Retrying Gemini API request once for transient error...")
                        await asyncio.sleep(1.0)
                        continue
                    else:
                        break

            except httpx.ConnectTimeout:
                elapsed = time.perf_counter() - start_time
                last_error_reason = (
                    f"Connection timeout after {settings.llm_connect_timeout_seconds}s"
                )
                logger.warning(
                    f"Gemini API connection timed out (attempt: {attempt}, elapsed: {elapsed:.2f}s)"
                )
                if attempt < max_attempts:
                    logger.info("Retrying Gemini API request once for connection timeout...")
                    await asyncio.sleep(0.5)
                    continue
                break

            except (httpx.ConnectError, httpx.NetworkError) as e:
                elapsed = time.perf_counter() - start_time
                last_error_reason = f"Connection failure: {e.__class__.__name__}"
                logger.warning(
                    f"Gemini API network connection failure (attempt: {attempt}, elapsed: {elapsed:.2f}s): {e.__class__.__name__}"
                )
                if attempt < max_attempts:
                    logger.info("Retrying Gemini API request once for connection failure...")
                    await asyncio.sleep(0.5)
                    continue
                break

            except httpx.ReadTimeout:
                elapsed = time.perf_counter() - start_time
                last_error_reason = (
                    f"Response read timeout after {settings.llm_read_timeout_seconds}s"
                )
                logger.warning(
                    f"Gemini API read timed out after {settings.llm_read_timeout_seconds}s (elapsed: {elapsed:.2f}s). Not retrying to avoid caller delay."
                )
                # Do NOT retry read timeout; live calls cannot tolerate an additional 20s delay
                break

            except Exception as e:
                elapsed = time.perf_counter() - start_time
                last_error_reason = f"Unexpected error: {e.__class__.__name__}"
                logger.error(
                    f"Gemini API unexpected error (attempt: {attempt}, elapsed: {elapsed:.2f}s): {e.__class__.__name__}"
                )
                break

        return None, last_error_reason

    def _parse_gemini_response(
        self, resp: httpx.Response, stage_number: int
    ) -> Optional[SuggestionResponse]:
        """Parses Gemini JSON candidate text into SuggestionResponse model."""
        try:
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None

            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                return None

            raw_text = parts[0].get("text", "").strip()
            if not raw_text:
                return None

            try:
                parsed = json.loads(raw_text)
            except Exception:
                clean = raw_text.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean)

            suggestion = parsed.get("suggestion", "").strip()
            if not suggestion:
                return None

            return SuggestionResponse(
                suggestion=suggestion,
                stage_number=stage_number,
                alternative=parsed.get("alternative", "").strip() or None,
                rationale=parsed.get("rationale", "").strip() or None,
                is_fallback=False,
                provider="gemini",
                fallback_reason=None,
            )
        except Exception:
            return None

    def _build_prompt(self, payload: SuggestionRequest) -> str:
        prospect = payload.prospect_name or "the prospect"
        company = payload.company_name or "their company"
        words = payload.prospect_words or "[No words entered yet]"
        outcome = payload.selected_outcome or "[None]"

        return f"""You are an elite, respectful B2B cold-calling coach assisting an outbound caller in real time.
The caller is speaking with {prospect} at {company}.

Current Call Context:
- Stage Number: {payload.stage_number}
- Stage Name: {payload.stage_name or 'Current Stage'}
- Stage Purpose: {payload.stage_purpose or 'Cold call progression'}
- Selected Stage Outcome: {outcome}
- Prospect's Verbatim Words: "{words}"

CRITICAL RULES:
1. Provide ONE concise, natural response (1-2 sentences maximum) that sounds authentic when spoken out loud.
2. Address the prospect's actual words and concerns directly without being defensive or manipulative.
3. Suggest a practical next question or sentence to keep the conversation flowing smoothly.
4. NEVER fabricate company facts, false guarantees, fake customer case studies, or pricing.
5. NEVER present suggestions as something the prospect said.
6. If the prospect is hesitant or objecting, empathize first, then pivot smoothly.
7. If the prospect asks not to be called, immediately generate a courteous exit.

Return ONLY a JSON object with this exact structure:
{{
  "suggestion": "Primary 1-2 spoken sentences for caller",
  "alternative": "One alternative phrasing or angle",
  "rationale": "One brief sentence explaining why this works"
}}"""

    def _generate_transcript_fallback(
        self, payload: SuggestionRequest, reason: Optional[str] = None
    ) -> SuggestionResponse:
        """
        Deterministic, transcript-backed fallback rules derived from the 100-transcript dataset.
        Ensures high utility even when offline, unauthenticated, or on timeout.
        """
        prospect = payload.prospect_name.strip() if payload.prospect_name else "there"
        company = payload.company_name.strip() if payload.company_name else "your company"
        words = (payload.prospect_words or "").lower().strip()
        outcome = payload.selected_outcome or ""
        stage = payload.stage_number

        if stage == 1:  # Opening
            suggestion = (
                f"Hi {prospect}, this is calling from Meridian Growth Partners. "
                f"I'm reaching out regarding {company}. Am I speaking with the right person?"
            )
            alt = f"Hello {prospect}, I'm following up briefly regarding operational growth at {company}. Do you have 60 seconds?"
            rationale = "Quickly identifies the caller, targets the company, and checks decision-maker identity."

        elif stage == 2:  # Purpose
            if "where" in words or "source" in outcome:
                suggestion = (
                    f"We track leading enterprises in your sector through industry registries and public filings, "
                    f"and we wanted to connect directly with operational leadership at {company}."
                )
                alt = f"We monitor growth patterns across mid-market manufacturers, and {company} stood out in our recent sector review."
                rationale = "Transparently explains contact sourcing without defensiveness."
            elif "what do you do" in words or "asked_company_purpose" in outcome:
                suggestion = (
                    f"We work with leadership teams at growing companies like {company} to identify operational bottlenecks "
                    f"and share short, actionable growth briefs."
                )
                alt = f"We specialize in supply chain, capacity, and operational efficiency for manufacturing leaders."
                rationale = "Delivers a crisp, 1-sentence value proposition without buzzwords."
            else:
                suggestion = (
                    f"The reason for my call is to briefly share how we assist companies like {company} "
                    f"with capacity and operational bottlenecks as you scale."
                )
                alt = f"We've prepared a brief operational growth review for {company} and wanted to see if this aligns with your current focus."
                rationale = "Focuses immediately on relevance to the prospect's operating realities."

        elif stage == 3:  # Permission
            if any(w in words for w in ["meeting", "busy", "call later", "driving", "customer"]) or outcome == "not_available_now":
                suggestion = (
                    "I completely understand you're busy right now. When would be a convenient 5-minute window "
                    "to reconnect—perhaps later this afternoon or tomorrow morning?"
                )
                alt = "No problem at all. I can call you back at 2:30 PM, or would tomorrow morning suit you better?"
                rationale = "Respects immediate time pressure and proposes two concrete callback windows."
            elif any(w in words for w in ["whatsapp", "email", "mail"]) or outcome == "information_requested_first":
                suggestion = (
                    f"I would be glad to send a brief overview on WhatsApp. To ensure it's directly relevant to {company}, "
                    f"may I ask which operational area is your highest priority right now?"
                )
                alt = "Certainly, I'll send that across right away. What is the best WhatsApp number to reach you on?"
                rationale = "Honors the document request while qualifying operational relevance."
            else:
                suggestion = "Thank you. I'll keep this very brief—just two quick questions about your current operational focus."
                alt = "Appreciate the minute. We'll stick strictly to two minutes."
                rationale = "Reassures the prospect that the call will be concise and focused."

        elif stage == 4:  # Their business
            if "wrong_person" in outcome or any(w in words for w in ["not relevant", "wrong person", "not my role"]):
                suggestion = (
                    f"Thank you for clarifying. Who on the team at {company} oversees operational strategy or manufacturing capacity?"
                )
                alt = "Understood. Could you point me to the person who handles plant operations and production planning?"
                rationale = "Gracefully pivots to obtain the correct departmental contact."
            else:
                suggestion = (
                    f"Understood. How does {company} currently handle capacity planning and supplier lead times across your plants?"
                )
                alt = f"As you oversee operations at {company}, what is the main production or distribution focus this quarter?"
                rationale = "Asks an open-ended operational question grounded in manufacturing context."

        elif stage == 5:  # Their need in their words
            if "no_current_need" in outcome or any(w in words for w in ["no need", "everything fine", "internal", "no requirement"]):
                suggestion = (
                    "That's great to hear operations are running smoothly. As you plan for future growth, "
                    "are there any capacity or margin targets your leadership team is looking to unlock?"
                )
                alt = "Understood. When your team evaluates upcoming quarters, what is the single biggest growth hurdle?"
                rationale = "Explores latent objectives without invalidating their current satisfaction."
            else:
                suggestion = (
                    "You highlighted a key bottleneck. That's a challenge we frequently see with scaling teams. "
                    "How has that been impacting your delivery timelines?"
                )
                alt = "That's very helpful context. What internal steps has the team taken so far to address that?"
                rationale = "Validates the prospect's exact words and prompts deeper exploration."

        elif stage == 6:  # Objection
            if "existing_provider_or_team" in outcome or any(w in words for w in ["internal", "already have", "agency", "consultant"]):
                suggestion = (
                    "That makes complete sense—most established companies have strong internal capabilities. "
                    "We don't replace internal teams; we provide an external benchmark on growth and operational bottlenecks. "
                    "Would you be open to reviewing a short 2-page brief?"
                )
                alt = "Completely understand. We often collaborate with existing teams rather than replace them. May I share a one-page brief?"
                rationale = "Reframes from competition to complementary benchmarking."
            elif any(w in words for w in ["email", "mail", "whatsapp"]) or outcome == "requested_information":
                suggestion = (
                    f"I'll gladly share the executive summary on WhatsApp. "
                    f"Could we schedule a 10-minute check-in next Tuesday afternoon after you've had a chance to glance through it?"
                )
                alt = "Sending it right away. What specific operational metrics would you like us to highlight in it?"
                rationale = "Ties document delivery directly to a follow-up commitment."
            elif any(w in words for w in ["not interested", "not for me", "no point"]) or outcome == "declined_not_interested":
                suggestion = (
                    "I appreciate your candor. If timing isn't right today, may I leave our contact details on WhatsApp "
                    "in case your priorities shift next quarter?"
                )
                alt = "Understood, and thank you for being upfront. Would it be alright if we touch base in a few months?"
                rationale = "Respects disinterest while leaving the door open politely without pressure."
            else:
                suggestion = (
                    "I hear your hesitation. Many directors we speak with felt the same initially until seeing our operational breakdown. "
                    "Would a brief 5-minute review with our founder be worth a look?"
                )
                alt = "Fair point. If we could show you how peer manufacturers solved that exact issue, would that be worth a 5-minute conversation?"
                rationale = "Empathizes with concern and proposes low-friction review."

        elif stage == 7:  # Next step
            if outcome == "agreed_to_receive_report":
                suggestion = (
                    f"Perfect. I'll send the report to your WhatsApp right away. "
                    f"How does next Wednesday afternoon sound for a quick 10-minute follow-up call?"
                )
                alt = "Excellent, sending it now. Let's touch base next week once you've had a chance to review."
                rationale = "Confirms delivery and pairs it with a clear follow-up window."
            else:
                suggestion = (
                    "Would next Tuesday afternoon—say after 2 PM—work for a brief 15-minute Google Meet with our founder?"
                )
                alt = "How does your calendar look for Thursday at 11 AM for a brief working session?"
                rationale = "Proposes a concrete day, time, and channel based on top transcript patterns (T001)."

        else:  # Stage 8: Close
            suggestion = (
                f"Thank you very much for your time today, {prospect}. I'll send those details across as discussed, "
                f"and we look forward to connecting. Have a wonderful day!"
            )
            alt = f"Great speaking with you, {prospect}. Have a great rest of your week!"
            rationale = "Warm, professional conclusion recapping the agreed action."

        return SuggestionResponse(
            suggestion=suggestion,
            stage_number=stage,
            alternative=alt,
            rationale=rationale,
            is_fallback=True,
            provider="rule_engine",
            fallback_reason=reason or "Generated from transcript heuristics",
        )


_ai_service: Optional[AiService] = None


def get_ai_service() -> AiService:
    global _ai_service
    if _ai_service is None:
        _ai_service = AiService()
    return _ai_service
