import math
from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.call import CANONICAL_OUTCOMES
from app.services.call_service import CallService, get_call_service


class MockPostgrestResponse:
    def __init__(self, data: List[Dict[str, Any]], count: int = None):
        self.data = data
        self.count = count if count is not None else len(data)


class MockTableQuery:
    def __init__(self, table_name: str, db: Dict[str, List[Dict[str, Any]]]):
        self.table_name = table_name
        self.db = db
        self.filters = []
        self._action = "select"
        self._insert_payload = None
        self._upsert_payload = None
        self._update_payload = None
        self._order_field = None
        self._order_desc = False
        self._range_from = 0
        self._range_to = None
        self._limit = None
        self._or_filter = None

    def select(self, columns: str = "*", count: str = None):
        self._action = "select"
        return self

    def eq(self, column: str, value: Any):
        self.filters.append((column, "eq", str(value)))
        return self

    def in_(self, column: str, values: List[Any]):
        str_values = [str(v) for v in values]
        self.filters.append((column, "in", str_values))
        return self

    def or_(self, filter_expr: str):
        self._or_filter = filter_expr
        return self

    def order(self, column: str, desc: bool = False):
        self._order_field = column
        self._order_desc = desc
        return self

    def range(self, from_idx: int, to_idx: int):
        self._range_from = from_idx
        self._range_to = to_idx
        return self

    def limit(self, count: int):
        self._limit = count
        return self

    def insert(self, payload: Dict[str, Any]):
        self._action = "insert"
        self._insert_payload = payload
        return self

    def upsert(self, payload: Dict[str, Any], on_conflict: str = ""):
        self._action = "upsert"
        self._upsert_payload = payload
        self._on_conflict = on_conflict
        return self

    def update(self, payload: Dict[str, Any]):
        self._action = "update"
        self._update_payload = payload
        return self

    def execute(self):
        now = datetime.now(timezone.utc).isoformat()

        if self._action == "insert":
            record = dict(self._insert_payload)
            if "id" not in record or not record["id"]:
                record["id"] = str(uuid4())
            record.setdefault("created_at", now)
            record.setdefault("updated_at", now)
            self.db[self.table_name].append(record)
            return MockPostgrestResponse([record])

        if self._action == "upsert":
            existing = None
            if self._on_conflict == "id" or (self.table_name == "calls" and "id" in self._upsert_payload):
                target_id = str(self._upsert_payload.get("id"))
                for r in self.db[self.table_name]:
                    if str(r.get("id")) == target_id:
                        existing = r
                        break
            elif "call_id" in self._upsert_payload and "stage_number" in self._upsert_payload:
                call_id = str(self._upsert_payload.get("call_id"))
                stage_number = self._upsert_payload.get("stage_number")
                for r in self.db[self.table_name]:
                    if str(r.get("call_id")) == call_id and r.get("stage_number") == stage_number:
                        existing = r
                        break

            if existing:
                existing.update(self._upsert_payload)
                existing["updated_at"] = now
                return MockPostgrestResponse([existing])
            else:
                record = dict(self._upsert_payload)
                if "id" not in record or not record["id"]:
                    record["id"] = str(uuid4())
                record["created_at"] = now
                record["updated_at"] = now
                self.db[self.table_name].append(record)
                return MockPostgrestResponse([record])

        if self._action == "update":
            updated = []
            for r in self.db[self.table_name]:
                match = True
                for col, op, val in self.filters:
                    if op == "eq" and str(r.get(col)) != str(val):
                        match = False
                        break
                if match:
                    r.update(self._update_payload)
                    r["updated_at"] = now
                    updated.append(r)
            return MockPostgrestResponse(updated)

        # Default action: select
        records = list(self.db[self.table_name])

        # Apply eq & in filters
        for col, op, val in self.filters:
            if op == "eq":
                records = [r for r in records if str(r.get(col)) == str(val)]
            elif op == "in":
                records = [r for r in records if str(r.get(col)) in val]

        # Apply or_ search filter
        if self._or_filter:
            # Format: "prospect_name.ilike.%term%,company_name.ilike.%term%,prospect_role.ilike.%term%"
            terms = [part.split(".ilike.%")[-1].rstrip("%") for part in self._or_filter.split(",")]
            term = terms[0].lower() if terms else ""
            if term:
                records = [
                    r
                    for r in records
                    if term in str(r.get("prospect_name", "")).lower()
                    or term in str(r.get("company_name", "")).lower()
                    or term in str(r.get("prospect_role", "")).lower()
                ]

        total_count = len(records)

        # Apply order
        if self._order_field:
            records.sort(
                key=lambda x: str(x.get(self._order_field, "")),
                reverse=self._order_desc,
            )

        # Apply range
        if self._range_to is not None:
            records = records[self._range_from : self._range_to + 1]
        elif self._limit is not None:
            records = records[: self._limit]

        return MockPostgrestResponse(records, count=total_count)


class MockSupabaseClient:
    def __init__(self):
        self.db = {
            "calls": [],
            "call_stage_results": [],
        }

    def table(self, name: str) -> MockTableQuery:
        if name not in self.db:
            self.db[name] = []
        return MockTableQuery(name, self.db)


@pytest.fixture
def mock_supabase():
    return MockSupabaseClient()


@pytest.fixture
def test_client(mock_supabase):
    service = CallService(client=mock_supabase)
    app.dependency_overrides[get_call_service] = lambda: service
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# ==================== TEST SUITE ====================


def test_health_endpoint(test_client):
    """Verify health check returns app and database status."""
    res = test_client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "database" in data


def test_create_call_success(test_client):
    """Verify creating a call returns 201 and initial in_progress status."""
    payload = {
        "prospect_name": "Rahul Sharma",
        "company_name": "Apex Industrial Solutions",
        "prospect_role": "VP of Operations",
    }
    res = test_client.post("/api/calls", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["prospect_name"] == "Rahul Sharma"
    assert data["company_name"] == "Apex Industrial Solutions"
    assert data["status"] == "in_progress"
    assert data["current_stage"] == 1
    assert data["furthest_stage_reached"] == 1
    assert data["id"] is not None


def test_get_call_by_id(test_client):
    """Verify retrieving an existing call by ID."""
    # 1. Create call
    create_res = test_client.post(
        "/api/calls",
        json={
            "prospect_name": "Priya Patel",
            "company_name": "Nexus Logistics",
            "prospect_role": "Fleet Director",
        },
    )
    call_id = create_res.json()["id"]

    # 2. Get call
    res = test_client.get(f"/api/calls/{call_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == call_id
    assert data["prospect_name"] == "Priya Patel"
    assert isinstance(data["stage_results"], list)


def test_get_unknown_call_returns_404(test_client):
    """Verify requesting an unknown call ID returns 404."""
    unknown_id = str(uuid4())
    res = test_client.get(f"/api/calls/{unknown_id}")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_update_stage_success(test_client):
    """Verify updating a stage logs verbatim words and stage outcome."""
    create_res = test_client.post(
        "/api/calls",
        json={
            "prospect_name": "Ananya Roy",
            "company_name": "Tech Corp",
            "prospect_role": "CTO",
        },
    )
    call_id = create_res.json()["id"]

    # Update Stage 3
    stage_payload = {
        "stage_outcome": "permission_granted",
        "prospect_words": "I have two minutes before my next sync.",
        "additional_data": {"time_limit_minutes": "2"},
    }
    res = test_client.put(f"/api/calls/{call_id}/stages/3", json=stage_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["stage_number"] == 3
    assert data["stage_outcome"] == "permission_granted"
    assert data["prospect_words"] == "I have two minutes before my next sync."


def test_invalid_stage_number_validation(test_client):
    """Verify stage numbers outside 1-8 are rejected with 422."""
    call_id = str(uuid4())
    res = test_client.put(
        f"/api/calls/{call_id}/stages/9",
        json={"stage_outcome": "done"},
    )
    assert res.status_code == 422

    res_zero = test_client.put(
        f"/api/calls/{call_id}/stages/0",
        json={"stage_outcome": "done"},
    )
    assert res_zero.status_code == 422


def test_stage_upsert_without_duplication(test_client):
    """Verify multiple updates to the same stage do not create duplicate records."""
    create_res = test_client.post(
        "/api/calls",
        json={
            "prospect_name": "Vikram Seth",
            "company_name": "Zenith Energy",
            "prospect_role": "Director",
        },
    )
    call_id = create_res.json()["id"]

    # First update
    test_client.put(
        f"/api/calls/{call_id}/stages/2",
        json={"stage_outcome": "purpose_understood", "prospect_words": "First note."},
    )
    # Second update to same stage
    test_client.put(
        f"/api/calls/{call_id}/stages/2",
        json={"stage_outcome": "purpose_understood", "prospect_words": "Updated note."},
    )

    # Check call results
    call_res = test_client.get(f"/api/calls/{call_id}")
    stage_2_results = [
        s for s in call_res.json()["stage_results"] if s["stage_number"] == 2
    ]
    assert len(stage_2_results) == 1
    assert stage_2_results[0]["prospect_words"] == "Updated note."


def test_stage_upsert_preserves_existing_data(test_client):
    """Verify that updating stage outcome preserves previously captured prospect words."""
    create_res = test_client.post(
        "/api/calls",
        json={
            "prospect_name": "Meera Nair",
            "company_name": "CloudWorks",
            "prospect_role": "Director",
        },
    )
    call_id = create_res.json()["id"]

    # Step 1: Caller enters verbatim words first
    test_client.put(
        f"/api/calls/{call_id}/stages/4",
        json={"prospect_words": "We are currently evaluating solutions."},
    )

    # Step 2: Later caller selects an outcome without re-entering words
    test_client.put(
        f"/api/calls/{call_id}/stages/4",
        json={"stage_outcome": "explained_business"},
    )

    # Check that BOTH outcome and words are preserved
    call_res = test_client.get(f"/api/calls/{call_id}")
    stage_4 = [s for s in call_res.json()["stage_results"] if s["stage_number"] == 4][0]
    assert stage_4["stage_outcome"] == "explained_business"
    assert stage_4["prospect_words"] == "We are currently evaluating solutions."


def test_create_call_with_phone_number_and_idempotence(test_client):
    """Verify phone_number preservation and idempotent re-creation with identical ID."""
    fixed_id = str(uuid4())
    payload = {
        "id": fixed_id,
        "prospect_name": "Arjun Kapoor",
        "company_name": "Atlas Freight",
        "prospect_role": "COO",
        "phone_number": "+1-555-0199",
    }
    # Initial creation
    res1 = test_client.post("/api/calls", json=payload)
    assert res1.status_code == 201
    assert res1.json()["id"] == fixed_id
    assert res1.json()["phone_number"] == "+1-555-0199"

    # Idempotent re-creation (simulating migration re-run)
    res2 = test_client.post("/api/calls", json=payload)
    assert res2.status_code == 201
    assert res2.json()["id"] == fixed_id


def test_close_call_with_outcome_alias(test_client):
    """Verify close endpoint accepts 'outcome' per PRODUCT_SPEC Section 10.4."""
    create_res = test_client.post(
        "/api/calls",
        json={
            "prospect_name": "Sanjay Dutt",
            "company_name": "Media Group",
            "prospect_role": "Producer",
        },
    )
    call_id = create_res.json()["id"]

    # Use 'outcome' instead of 'final_outcome'
    res = test_client.post(
        f"/api/calls/{call_id}/close",
        json={"outcome": "agreed_to_receive_report", "duration_seconds": 95},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert data["final_outcome"] == "agreed_to_receive_report"
    assert data["outcome"] == "agreed_to_receive_report"


def test_furthest_stage_monotonic_behavior(test_client):
    """Verify furthest_stage_reached never decreases when navigating backwards."""
    create_res = test_client.post(
        "/api/calls",
        json={
            "prospect_name": "Karan Johar",
            "company_name": "Dharma Inc",
            "prospect_role": "Lead",
        },
    )
    call_id = create_res.json()["id"]

    # Advance to Stage 5
    test_client.put(
        f"/api/calls/{call_id}/stages/5",
        json={"stage_outcome": "need_expressed", "prospect_words": "High latency."},
    )
    call_5 = test_client.get(f"/api/calls/{call_id}").json()
    assert call_5["furthest_stage_reached"] == 5

    # Navigate backward to Stage 2
    test_client.put(
        f"/api/calls/{call_id}/stages/2",
        json={"stage_outcome": "purpose_understood"},
    )
    call_back = test_client.get(f"/api/calls/{call_id}").json()
    assert call_back["current_stage"] == 2
    assert call_back["furthest_stage_reached"] == 5, "Furthest stage reached must not decrease!"


def test_close_call_success(test_client):
    """Verify closing a call records final outcome and marks completed."""
    create_res = test_client.post(
        "/api/calls",
        json={
            "prospect_name": "Siddharth Verma",
            "company_name": "Quant Systems",
            "prospect_role": "VP Eng",
        },
    )
    call_id = create_res.json()["id"]

    close_payload = {
        "final_outcome": "next_step_agreed",
        "duration_seconds": 185,
        "next_step_notes": "Demo scheduled for Friday 3 PM.",
    }
    res = test_client.post(f"/api/calls/{call_id}/close", json=close_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert data["final_outcome"] == "next_step_agreed"
    assert data["duration_seconds"] == 185
    assert data["next_step_notes"] == "Demo scheduled for Friday 3 PM."


def test_close_call_invalid_outcome_rejected(test_client):
    """Verify non-canonical outcome is rejected with 422."""
    call_id = str(uuid4())
    res = test_client.post(
        f"/api/calls/{call_id}/close",
        json={"final_outcome": "fake_outcome", "duration_seconds": 10},
    )
    assert res.status_code == 422


def test_duplicate_close_handling(test_client):
    """Verify closing an already-completed call does not duplicate or corrupt."""
    create_res = test_client.post(
        "/api/calls",
        json={
            "prospect_name": "Deepak Mehta",
            "company_name": "Fintech Solutions",
            "prospect_role": "CFO",
        },
    )
    call_id = create_res.json()["id"]

    # Close once
    test_client.post(
        f"/api/calls/{call_id}/close",
        json={"final_outcome": "interested", "duration_seconds": 120},
    )

    # Close second time
    res2 = test_client.post(
        f"/api/calls/{call_id}/close",
        json={"final_outcome": "interested", "duration_seconds": 120},
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "completed"


def test_list_calls_and_filtering(test_client):
    """Verify listing calls with search, outcome filter, and stage filter."""
    # Seed 2 calls
    c1 = test_client.post(
        "/api/calls",
        json={"prospect_name": "Aarav Gupta", "company_name": "Acme Tools", "prospect_role": "Manager"},
    ).json()
    test_client.post(
        f"/api/calls/{c1['id']}/close",
        json={"final_outcome": "follow_up", "duration_seconds": 60},
    )

    c2 = test_client.post(
        "/api/calls",
        json={"prospect_name": "Rohan Das", "company_name": "Beta Labs", "prospect_role": "Lead"},
    ).json()
    test_client.post(
        f"/api/calls/{c2['id']}/close",
        json={"final_outcome": "not_interested", "duration_seconds": 45},
    )

    # 1. Search by name
    search_res = test_client.get("/api/calls?search=Aarav")
    assert search_res.status_code == 200
    items = search_res.json()["items"]
    assert len(items) == 1
    assert items[0]["prospect_name"] == "Aarav Gupta"

    # 2. Filter by outcome
    outcome_res = test_client.get("/api/calls?outcome=not_interested")
    assert outcome_res.status_code == 200
    assert len(outcome_res.json()["items"]) == 1
    assert outcome_res.json()["items"][0]["final_outcome"] == "not_interested"

    # 3. Pagination
    list_all = test_client.get("/api/calls?page=1&page_size=1")
    assert list_all.status_code == 200
    data = list_all.json()
    assert len(data["items"]) == 1
    assert data["total"] >= 2
    assert data["page_size"] == 1


def test_database_failure_handling():
    """Verify clean 503 is returned when database is completely unconfigured."""
    unconfigured_service = CallService(client=None)
    app.dependency_overrides[get_call_service] = lambda: unconfigured_service
    client = TestClient(app)

    res = client.post(
        "/api/calls",
        json={"prospect_name": "Test", "company_name": "Test", "prospect_role": "Test"},
    )
    assert res.status_code == 503
    assert "not configured" in res.json()["detail"].lower()
    app.dependency_overrides.clear()
