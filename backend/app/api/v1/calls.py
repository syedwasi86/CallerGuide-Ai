from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.schemas.call import (
    CallClose,
    CallCreate,
    CallListResponse,
    CallResponse,
    StageResultResponse,
    StageResultUpdate,
)
from app.services.call_service import CallService, get_call_service

router = APIRouter(prefix="/calls", tags=["Calls"])


@router.post(
    "",
    response_model=CallResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new in-progress call",
)
def create_call(
    payload: CallCreate,
    service: CallService = Depends(get_call_service),
) -> CallResponse:
    """Creates a new in-progress call session."""
    return service.create_call(payload)


@router.get(
    "",
    response_model=CallListResponse,
    summary="List calls with search, filter, and pagination",
)
def list_calls(
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    page_size: int = Query(20, ge=1, le=100, description="Page size up to 100"),
    search: Optional[str] = Query(None, description="Search prospect, company, or role"),
    outcome: Optional[str] = Query(None, description="Filter by final outcome"),
    stage: Optional[int] = Query(None, ge=1, le=8, description="Filter by furthest stage reached"),
    service: CallService = Depends(get_call_service),
) -> CallListResponse:
    """Lists completed and active calls with filtering and pagination."""
    return service.list_calls(
        page=page,
        page_size=page_size,
        search=search,
        outcome=outcome,
        stage=stage,
    )


@router.get(
    "/{call_id}",
    response_model=CallResponse,
    summary="Get call by ID with stage results",
)
def get_call(
    call_id: UUID,
    service: CallService = Depends(get_call_service),
) -> CallResponse:
    """Retrieves a call and its stage results. Returns 404 if not found."""
    return service.get_call(call_id)


@router.get(
    "/{call_id}/details",
    response_model=CallResponse,
    summary="Get complete call details and audit records",
)
def get_call_details(
    call_id: UUID,
    service: CallService = Depends(get_call_service),
) -> CallResponse:
    """Convenience alias for retrieving full call audit details."""
    return service.get_call(call_id)


@router.put(
    "/{call_id}/stages/{stage_number}",
    response_model=StageResultResponse,
    summary="Update or upsert stage outcome and verbatim prospect words",
)
def update_stage(
    call_id: UUID,
    stage_number: int,
    payload: StageResultUpdate,
    service: CallService = Depends(get_call_service),
) -> StageResultResponse:
    """
    Saves or updates stage outcome, prospect words, and additional captured attributes.
    Monotonically advances furthest_stage_reached.
    """
    return service.update_stage(call_id, stage_number, payload)


@router.post(
    "/{call_id}/close",
    response_model=CallResponse,
    summary="Close call with canonical outcome and final metrics",
)
def close_call(
    call_id: UUID,
    payload: CallClose,
    service: CallService = Depends(get_call_service),
) -> CallResponse:
    """
    Finalizes a call, validates canonical outcome, saves duration and next steps.
    Prevents duplicate close operations.
    """
    return service.close_call(call_id, payload)

