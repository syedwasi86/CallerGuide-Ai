import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from supabase import Client

from app.db.supabase import get_supabase_client
from app.schemas.call import (
    CANONICAL_OUTCOMES,
    CallClose,
    CallCreate,
    CallListResponse,
    CallResponse,
    StageResultResponse,
    StageResultUpdate,
)


class CallService:
    def __init__(self, client: Optional[Client] = None):
        self._client = client

    @property
    def client(self) -> Client:
        if self._client is not None:
            return self._client

        client = get_supabase_client()
        if client is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not configured. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
            )
        return client

    def check_db_health(self) -> Dict[str, str]:
        """Check database connectivity without exposing credentials."""
        client = get_supabase_client()
        if client is None:
            return {"database": "unconfigured"}
        try:
            # Query single record with limit 1 to verify connectivity
            client.table("calls").select("id").limit(1).execute()
            return {"database": "connected"}
        except Exception:
            return {"database": "error"}

    def create_call(self, data: CallCreate) -> CallResponse:
        """Create a new in-progress call session."""
        call_id = str(data.id) if data.id else str(uuid4())
        started_at = (
            data.started_at.isoformat()
            if data.started_at
            else datetime.now(timezone.utc).isoformat()
        )

        call_data = {
            "id": call_id,
            "prospect_name": data.prospect_name,
            "company_name": data.company_name,
            "prospect_role": data.prospect_role,
            "status": "in_progress",
            "current_stage": 1,
            "furthest_stage_reached": 1,
            "started_at": started_at,
            "duration_seconds": 0,
        }

        try:
            res = self.client.table("calls").insert(call_data).execute()
            if not res.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create call record"
                )
            created = res.data[0]
            created["stage_results"] = []
            return CallResponse.model_validate(created)
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error creating call: {str(e)}"
            )

    def get_call(self, call_id: UUID) -> CallResponse:
        """Retrieve a call and its stage results."""
        try:
            res = self.client.table("calls").select("*").eq("id", str(call_id)).execute()
            if not res.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Call with ID {call_id} not found"
                )
            call_record = res.data[0]

            # Fetch stage results ordered by stage_number
            stages_res = (
                self.client.table("call_stage_results")
                .select("*")
                .eq("call_id", str(call_id))
                .order("stage_number")
                .execute()
            )
            call_record["stage_results"] = stages_res.data or []

            return CallResponse.model_validate(call_record)
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error fetching call: {str(e)}"
            )

    def update_stage(
        self, call_id: UUID, stage_number: int, data: StageResultUpdate
    ) -> StageResultResponse:
        """Upsert a stage result and monotonically advance furthest_stage_reached."""
        if stage_number < 1 or stage_number > 8:
            raise HTTPException(
                status_code=422,
                detail="stage_number must be between 1 and 8"
            )

        # 1. Verify call exists and get current furthest_stage_reached
        call_res = self.client.table("calls").select("id, furthest_stage_reached, current_stage").eq("id", str(call_id)).execute()
        if not call_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Call with ID {call_id} not found"
            )
        call = call_res.data[0]

        # 2. Upsert stage result
        stage_payload = {
            "call_id": str(call_id),
            "stage_number": stage_number,
            "stage_outcome": data.stage_outcome,
            "prospect_words": data.prospect_words,
            "additional_data": data.additional_data or {},
        }

        try:
            upsert_res = (
                self.client.table("call_stage_results")
                .upsert(stage_payload, on_conflict="call_id,stage_number")
                .execute()
            )
            if not upsert_res.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update stage result"
                )
            result = upsert_res.data[0]

            # 3. Monotonically update furthest_stage_reached
            current_furthest = call.get("furthest_stage_reached") or 1
            new_furthest = max(current_furthest, stage_number)
            self.client.table("calls").update({
                "current_stage": stage_number,
                "furthest_stage_reached": new_furthest,
            }).eq("id", str(call_id)).execute()

            return StageResultResponse.model_validate(result)
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error updating stage: {str(e)}"
            )

    def close_call(self, call_id: UUID, data: CallClose) -> CallResponse:
        """Close an active call, validating canonical outcome and preventing duplicates."""
        if data.final_outcome not in CANONICAL_OUTCOMES:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid final outcome '{data.final_outcome}'. Must be one of: {', '.join(CANONICAL_OUTCOMES)}"
            )

        # 1. Fetch current call
        call_res = self.client.table("calls").select("*").eq("id", str(call_id)).execute()
        if not call_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Call with ID {call_id} not found"
            )
        call = call_res.data[0]

        # 2. Check if already completed (prevent accidental duplicate creation/mutation)
        if call.get("status") == "completed":
            # Return current completed call without duplicating
            return self.get_call(call_id)

        # 3. Mark completed
        ended_at = (
            data.ended_at.isoformat()
            if data.ended_at
            else datetime.now(timezone.utc).isoformat()
        )

        update_payload = {
            "status": "completed",
            "final_outcome": data.final_outcome,
            "duration_seconds": data.duration_seconds,
            "next_step_notes": data.next_step_notes,
            "ended_at": ended_at,
        }

        try:
            self.client.table("calls").update(update_payload).eq("id", str(call_id)).execute()
            return self.get_call(call_id)
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error closing call: {str(e)}"
            )

    def list_calls(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        outcome: Optional[str] = None,
        stage: Optional[int] = None,
    ) -> CallListResponse:
        """List calls with filtering, search, pagination, and stage results."""
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset = (page - 1) * page_size

        try:
            query = self.client.table("calls").select("*", count="exact")

            # Filters
            if search and search.strip():
                term = search.strip()
                # Supabase or-filter syntax: "prospect_name.ilike.%term%,company_name.ilike.%term%,prospect_role.ilike.%term%"
                query = query.or_(
                    f"prospect_name.ilike.%{term}%,company_name.ilike.%{term}%,prospect_role.ilike.%{term}%"
                )

            if outcome and outcome != "all":
                query = query.eq("final_outcome", outcome)

            if stage and stage > 0:
                query = query.eq("furthest_stage_reached", stage)

            # Order and pagination
            res = query.order("started_at", desc=True).range(offset, offset + page_size - 1).execute()

            items = res.data or []
            total = res.count if res.count is not None else len(items)
            total_pages = math.ceil(total / page_size) if total > 0 else 0

            # Attach stage results for each call
            call_ids = [c["id"] for c in items]
            if call_ids:
                stages_res = (
                    self.client.table("call_stage_results")
                    .select("*")
                    .in_("call_id", call_ids)
                    .order("stage_number")
                    .execute()
                )
                stages_by_call: Dict[str, List[Any]] = {}
                for s in stages_res.data or []:
                    stages_by_call.setdefault(str(s["call_id"]), []).append(s)

                for c in items:
                    c["stage_results"] = stages_by_call.get(str(c["id"]), [])
            else:
                for c in items:
                    c["stage_results"] = []

            call_responses = [CallResponse.model_validate(c) for c in items]

            return CallListResponse(
                items=call_responses,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error listing calls: {str(e)}"
            )


def get_call_service() -> CallService:
    """Dependency injector for FastAPI endpoints."""
    return CallService()
