from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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
    selected_outcome: Optional[str] = None
    prospect_words: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    extra_data: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def sync_outcome_and_data(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Sync stage_outcome and selected_outcome
            outcome_val = data.get("stage_outcome") or data.get("selected_outcome")
            if outcome_val:
                data.setdefault("stage_outcome", outcome_val)
                data.setdefault("selected_outcome", outcome_val)

            # Sync additional_data and extra_data
            extra_val = data.get("additional_data") or data.get("extra_data")
            if extra_val:
                data.setdefault("additional_data", extra_val)
                data.setdefault("extra_data", extra_val)
        return data


class StageResultUpdate(BaseModel):
    stage_outcome: Optional[str] = None
    selected_outcome: Optional[str] = None
    prospect_words: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None
    extra_data: Optional[Dict[str, Any]] = None

    @model_validator(mode="before")
    @classmethod
    def sync_outcome_and_data(cls, data: Any) -> Any:
        if isinstance(data, dict):
            outcome_val = data.get("stage_outcome") or data.get("selected_outcome")
            if outcome_val is not None:
                data["stage_outcome"] = outcome_val
                data["selected_outcome"] = outcome_val

            extra_val = data.get("additional_data") or data.get("extra_data")
            if extra_val is not None:
                data["additional_data"] = extra_val
                data["extra_data"] = extra_val
        return data


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
    prospect_role: Optional[str] = Field("Caller", min_length=1)
    phone_number: Optional[str] = None
    started_at: Optional[datetime] = None


class CallClose(BaseModel):
    final_outcome: Optional[str] = None
    outcome: Optional[str] = None
    duration_seconds: int = Field(0, ge=0)
    next_step_notes: Optional[str] = None
    next_step_data: Optional[Dict[str, Any]] = None
    ended_at: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def validate_and_sync_outcome(cls, data: Any) -> Any:
        if isinstance(data, dict):
            raw_outcome = data.get("final_outcome") or data.get("outcome")
            if not raw_outcome:
                raise ValueError("Must provide 'final_outcome' or 'outcome'")
            if raw_outcome not in CANONICAL_OUTCOMES:
                raise ValueError(
                    f"Invalid final_outcome '{raw_outcome}'. Must be one of: {', '.join(CANONICAL_OUTCOMES)}"
                )
            data["final_outcome"] = raw_outcome
            data["outcome"] = raw_outcome
        return data


class CallResponse(BaseModel):
    id: UUID
    prospect_name: str
    company_name: str
    prospect_role: Optional[str] = None
    phone_number: Optional[str] = None
    status: str
    current_stage: int
    furthest_stage_reached: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: int = 0
    final_outcome: Optional[str] = None
    outcome: Optional[str] = None
    next_step_notes: Optional[str] = None
    next_step_data: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    stage_results: List[StageResultResponse] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def sync_outcome_field(cls, data: Any) -> Any:
        if isinstance(data, dict):
            outcome_val = data.get("final_outcome") or data.get("outcome")
            if outcome_val:
                data.setdefault("final_outcome", outcome_val)
                data.setdefault("outcome", outcome_val)
        return data

    model_config = ConfigDict(from_attributes=True)


class CallListResponse(BaseModel):
    items: List[CallResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ProspectSummary(BaseModel):
    prospect_name: str
    company_name: str
    prospect_role: Optional[str] = None
    phone_number: Optional[str] = None
    last_call_id: UUID
    last_called_at: datetime
    total_calls: int = 1

    model_config = ConfigDict(from_attributes=True)
