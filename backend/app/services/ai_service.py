import asyncio
import json
import logging
import time
from typing import Optional, Tuple
import httpx

from app.core.config import settings
from app.schemas.ai import SuggestionRequest, SuggestionResponse
from app.services.providers import BaseLlmProvider, GeminiProvider, GroqProvider

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
    Generates contextual spoken-sentence guidance for callers using configured LLM providers
    (Google Gemini or Groq) with configurable HTTP timeouts, connection pooling, controlled single retry
    for transient failures, privacy-preserving prompts, ethical guardrails, and transcript-backed rule engine fallbacks.
    """

    def __init__(self, provider: Optional[BaseLlmProvider] = None):
        if provider:
            self.provider = provider
        else:
            provider_type = (settings.llm_provider or "gemini").lower().strip()
            if provider_type == "groq":
                self.provider = GroqProvider(
                    api_key=settings.groq_api_key or settings.llm_api_key,
                    model=settings.groq_model or settings.llm_model,
                )
            else:
                self.provider = GeminiProvider(
                    api_key=settings.llm_api_key,
                    model=settings.llm_model,
                )

    @property
    def api_key(self) -> str:
        return self.provider.api_key

    @api_key.setter
    def api_key(self, value: str):
        self.provider.api_key = value

    @property
    def model(self) -> str:
        return self.provider.model

    @model.setter
    def model(self, value: str):
        self.provider.model = value

    @property
    def provider_name(self) -> str:
        return self.provider.provider_name

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
        Strictly prioritizes ethical guardrails, then live provider (Gemini/Groq) with retry, then transcript fallback.
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

        # 2. Attempt live provider generation if API key is configured
        fallback_reason: Optional[str] = None
        if self.provider.api_key:
            llm_response, reason = await self._execute_gemini_request(payload)
            if llm_response:
                return llm_response
            fallback_reason = reason or f"{self.provider.provider_name.capitalize()} API unavailable"
        else:
            fallback_reason = "No LLM API key configured"

        # 3. Deterministic transcript-grounded rule engine fallback
        return self._generate_transcript_fallback(payload, reason=fallback_reason)

    async def _execute_gemini_request(
        self, payload: SuggestionRequest
    ) -> Tuple[Optional[SuggestionResponse], Optional[str]]:
        """
        Delegates prompt execution to the active provider with configurable timeouts and retries.
        """
        prompt = self._build_prompt(payload)
        timeout = self._get_httpx_timeout()
        resp, reason, metrics = await self.provider.generate(
            prompt=prompt,
            stage_number=payload.stage_number,
            timeout=timeout,
        )
        return resp, reason

    def _parse_gemini_response(
        self, resp: httpx.Response, stage_number: int
    ) -> Optional[SuggestionResponse]:
        """Backward-compatible response parser."""
        try:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    raw_text = parts[0].get("text", "")
                    return self.provider._parse_json_payload(raw_text, stage_number)
            choices = data.get("choices", [])
            if choices:
                raw_text = choices[0].get("message", {}).get("content", "")
                return self.provider._parse_json_payload(raw_text, stage_number)
            return None
        except Exception:
            return None

    def _build_prompt(self, payload: SuggestionRequest) -> str:
        """
        Builds a privacy-preserving cold-calling coaching prompt.
        Strictly omits prospect names, company names, and phone numbers.
        Sends only call stage, goal, selected outcome, and prospect's verbatim words.
        """
        stage_num = payload.stage_number
        stage_title = payload.stage_name or f"Stage {stage_num}"
        stage_goal = payload.stage_purpose or "Cold call progression"
        outcome = payload.selected_outcome or "[None]"
        words = payload.prospect_words or "[No words entered yet]"

        return f"""You are an elite, respectful B2B cold-calling coach assisting an outbound caller in real time.

Current Call Context:
- Stage Number: {stage_num}
- Stage Name: {stage_title}
- Stage Purpose: {stage_goal}
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
  "suggestion": "One or two natural spoken sentences",
  "alternative": "One concise alternative",
  "rationale": "One brief sentence"
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
                    f"I completely understand, {prospect}. What is the best day or time later this week "
                    f"for a quick 2-minute conversation?"
                )
                alt = f"No problem at all. Would Thursday morning around 11 AM work better for you?"
                rationale = "Respects immediate time constraints and pivots to scheduling a concrete follow-up."
            else:
                suggestion = (
                    f"I know you weren't expecting my call. Do you have 90 seconds for me to share "
                    f"why we reached out, and you can tell me if it's relevant?"
                )
                alt = "I'll be very brief—just 60 seconds to explain our focus, and you decide if it makes sense to continue."
                rationale = "Uses standard permission-based opener from transcript benchmark."

        elif stage == 4:  # Exploration
            suggestion = (
                f"From your perspective at {company}, what is the single biggest bottleneck "
                f"affecting throughput or fulfillment this quarter?"
            )
            alt = f"How are you currently handling capacity planning across your production lines at {company}?"
            rationale = "Opens diagnostic dialogue centered on the prospect's operational realities."

        elif stage == 5:  # Problem Identification
            suggestion = (
                f"When delays or capacity friction occur in that area, how does that typically "
                f"impact your delivery commitments and customer timelines?"
            )
            alt = "How much operational downtime or overtime does that issue typically create each month?"
            rationale = "Quantifies operational friction without assuming the solution."

        elif stage == 6:  # Objection Handling
            if any(w in words for w in ["internal team", "in house", "own team", "already have"]) or outcome == "existing_provider_or_team":
                suggestion = (
                    f"That makes complete sense—most established firms like {company} have strong internal teams. "
                    f"We don't replace internal capabilities; we provide an external benchmark on market bottlenecks. "
                    f"Would a short 2-page brief be useful to see?"
                )
                alt = "Understood. Many leaders we work with have great internal teams and use our research purely as a quarterly reference."
                rationale = "Validates the existing capability rather than competing, lowering friction."
            elif any(w in words for w in ["send email", "email me", "send info", "send details"]) or outcome == "send_information":
                suggestion = (
                    f"I'd be glad to send that over, {prospect}. So I send only the relevant 1-page executive summary, "
                    f"what is the main operational challenge leadership is evaluating right now?"
                )
                alt = f"Happy to email it across. What specific operational topic should I emphasize for {company}?"
                rationale = "Qualifies the email request to ensure purposeful follow-up rather than brush-off."
            elif any(w in words for w in ["not interested", "no need", "we are fine"]) or outcome == "not_interested":
                suggestion = (
                    f"I appreciate your directness, {prospect}. Before I let you go, is there any operational priority "
                    f"on your radar for next year, or is the team completely set?"
                )
                alt = "Fair enough. May I send a one-page overview to your email for future reference?"
                rationale = "Gracefully acknowledges disinterest while testing for long-term timing fit."
            else:
                suggestion = (
                    f"I completely understand where you're coming from, {prospect}. Many executives at {company} "
                    f"shared that exact concern before reviewing our benchmark data."
                )
                alt = "That is a very reasonable concern. May I share how peer manufacturers resolved that?"
                rationale = "Classic feel-felt-found framework adapted for B2B operational dialogue."

        elif stage == 7:  # Next Step / Agreement
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
