from typing import Optional
from pydantic import BaseModel, Field


class SuggestionRequest(BaseModel):
    call_id: Optional[str] = None
    stage_number: int = Field(..., ge=1, le=8, description="Current cold-call stage number (1 to 8)")
    stage_name: Optional[str] = Field(None, description="Stage title, e.g. Objection or Their business")
    stage_purpose: Optional[str] = Field(None, description="Stage purpose/guidance context")
    selected_outcome: Optional[str] = Field(None, description="Current stage outcome or objection code")
    prospect_words: Optional[str] = Field("", description="Verbatim words uttered by prospect")
    prospect_name: Optional[str] = Field("", description="Prospect contact name")
    company_name: Optional[str] = Field("", description="Target company name")


class SuggestionResponse(BaseModel):
    suggestion: str = Field(..., description="Primary response phrased for spoken conversation")
    stage_number: int = Field(..., ge=1, le=8)
    alternative: Optional[str] = Field(None, description="Alternative phrasing or delivery angle")
    rationale: Optional[str] = Field(None, description="Brief rationale explaining why this phrasing works")
    is_fallback: bool = Field(False, description="True if response generated via local fallback heuristics")
    provider: str = Field("ai", description="Source provider (gemini, rule_engine, or fallback)")
