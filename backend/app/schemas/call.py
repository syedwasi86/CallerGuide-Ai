from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator

CANONICAL_OUTCOMES = [
    "agreed_to_receive_report",
    "next_step_agreed",
    "interested",
    "follow_up",
    "call_again",
    "not_interested",
    "do_not_call",
    "wrong_person",
    "moved_company",
    "not_logged",
]


class StageResultBase(BaseModel):
    stage_number: int = Field(..., ge=1, le=8, description="Stage number between 1 and 8")
    stage_outcome: Optional[str] = None
    prospect_words: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = Field(default_factory=dict)


class StageResultUpdate(BaseModel):
    stage_outcome: Optional[str] = None
    prospect_words: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None


class StageResultResponse(StageResultBase):
    id: UUID
    call_id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CallCreate(BaseModel):
    id: Optional[UUID] = None
    prospect_name: str = Field(..., min_length=1)
    company_name: str = Field(..., min_length=1)
    prospect_role: str = Field(..., min_length=1)
    started_at: Optional[datetime] = None


class CallClose(BaseModel):
    final_outcome: str = Field(..., description="Must be one of the 10 canonical outcomes")
    duration_seconds: int = Field(..., ge=0)
    next_step_notes: Optional[str] = None
    ended_at: Optional[datetime] = None

    @field_validator("final_outcome")
    @classmethod
    def validate_canonical_outcome(cls, v: str) -> str:
        if v not in CANONICAL_OUTCOMES:
            raise ValueError(
                f"Invalid final_outcome '{v}'. Must be one of: {', '.join(CANONICAL_OUTCOMES)}"
            )
        return v


class CallResponse(BaseModel):
    id: UUID
    prospect_name: str
    company_name: str
    prospect_role: str
    status: str
    current_stage: int
    furthest_stage_reached: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: int = 0
    final_outcome: Optional[str] = None
    next_step_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    stage_results: List[StageResultResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class CallListResponse(BaseModel):
    items: List[CallResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
