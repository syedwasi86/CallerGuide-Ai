# Phase 4 Pre-Test Consistency Audit Report

**Project:** CallGuide AI — Cold-Call Companion (MVP)  
**Date:** November 14, 2026  
**Audited Files:**
- `doc/PRODUCT_SPEC.md`
- `frontend/src/types/index.ts`
- `frontend/src/lib/api-client.ts`
- `backend/app/schemas/call.py`
- `backend/app/services/call_service.py`
- `backend/supabase/migrations/001_initial_schema.sql`

---

## 1. Executive Audit Summary

Before initiating live Supabase end-to-end testing, a comprehensive cross-file consistency audit was performed across the data models, API client, backend request/response schemas, service logic, and PostgreSQL migration DDL.

All 7 audit checkpoints were evaluated, and all discrepancies were harmonized across the frontend, backend, and database schema.

---

## 2. Checkpoint-by-Checkpoint Audit Results

### Check 1: Canonical Final Outcome Identifiers
**Question:** *Are the ten canonical final outcome identifiers identical across frontend, backend validation, and database constraints?*

* **Source of Truth:** `doc/PRODUCT_SPEC.md` Sections 4 (Dataset index), 5 (Stage 8 Close), and 9.1 (Constraints).
* **The 10 Identifiers:**
  1. `agreed_to_receive_report`
  2. `next_step_agreed`
  3. `interested`
  4. `follow_up`
  5. `call_again`
  6. `not_interested`
  7. `do_not_call`
  8. `wrong_person`
  9. `moved_company`
  10. `not_logged`
* **Verification Status:**
  - `frontend/src/types/index.ts`: Identical 10 string literals (`FinalOutcome`).
  - `frontend/src/config/stages.ts`: Identical 10 entries in `CANONICAL_OUTCOMES`.
  - `backend/app/schemas/call.py`: Identical 10 entries in `CANONICAL_OUTCOMES`.
  - `backend/app/services/call_service.py`: Strictly validates against `CANONICAL_OUTCOMES`.
  - `backend/supabase/migrations/001_initial_schema.sql`: CHECK constraint on both `final_outcome` and `outcome` enforces this exact 10-value set.
* **Finding:** **100% Consistent.**

---

### Check 2: Field Mapping to Database Schema
**Question:** *Does the frontend correctly map every field to the actual database schema?*

* **Audit Finding:**
  1. **Stage Outcome & Extra Data Naming:**
     - `doc/PRODUCT_SPEC.md` Section 9.2 specified `selected_outcome` and `extra_data`.
     - Code originally used `stage_outcome` and `additional_data`.
     - `frontend/src/types/index.ts` used `selectedOutcome` and `extraData`.
  2. **Harmonization Implemented:**
     - `001_initial_schema.sql`: Added bidirectional trigger synchronization so `selected_outcome` and `stage_outcome`, as well as `extra_data` and `additional_data`, are always synchronized.
     - `backend/app/schemas/call.py`: Pydantic models (`StageResultBase`, `StageResultUpdate`, `StageResultResponse`) accept and return both aliases.
     - `frontend/src/lib/api-client.ts`: Maps `selectedOutcome: s.selected_outcome || s.stage_outcome` and `extraData: s.extra_data || s.additional_data`.
* **Finding:** **Fully Resolved & Bidirectionally Mapped.**

---

### Check 3: Field Preservation
**Question:** *Are prospect name, company, role, phone number, start time, end time, duration, notes, stage outcomes, and prospect words preserved?*

* **Field Inventory & Audit:**
  - **Prospect Name:** `prospect_name` (DB/Backend) ↔ `prospectName` (Frontend) — Preserved.
  - **Company:** `company_name` (DB/Backend) ↔ `companyName` (Frontend) — Preserved.
  - **Role:** `prospect_role` (DB/Backend) ↔ `prospectRole` (Frontend) — Made nullable in SQL DDL per spec Section 9.1 (`prospect_role TEXT`).
  - **Phone Number:** Not defined in original `doc/PRODUCT_SPEC.md` Section 9.1 (phone dialers were out of scope in Section 13), but explicitly required for full companion consistency in this audit.
    - **Action Taken:** Added `phone_number TEXT` to `001_initial_schema.sql`, `phone_number: Optional[str] = None` to Pydantic schemas, and `phoneNumber?: string` to `CallSession` domain types and `api-client.ts`.
  - **Start Time:** `started_at` ↔ `startedAt` (ISO 8601 UTC) — Preserved.
  - **End Time:** `ended_at` ↔ `endedAt` — Preserved.
  - **Duration:** `duration_seconds` ↔ `durationSeconds` (non-negative integer) — Preserved.
  - **Notes:** `next_step_notes` (and `next_step_data` JSONB) ↔ `nextStepNotes` — Preserved.
  - **Stage Outcomes:** `stage_outcome` / `selected_outcome` ↔ `selectedOutcome` (per stage 1–8) — Preserved.
  - **Prospect Words:** `prospect_words` ↔ `prospectWords` (verbatim notes per stage 1–8) — Preserved.
* **Finding:** **100% Preserved across all 8 stages and session models.**

---

### Check 4: Close-Call Final Outcome Persistence
**Question:** *Does the close-call endpoint save the correct final outcome?*

* **Audit Finding:**
  - In `doc/PRODUCT_SPEC.md` Section 10.4, the sample close payload used `"outcome": "next_step_agreed"`, while `CallClose` in Pydantic originally expected `"final_outcome"`.
  - **Action Taken:**
    - `backend/app/schemas/call.py`: `CallClose` validator accepts either `"final_outcome"` or `"outcome"`, validates against `CANONICAL_OUTCOMES`, and populates both fields.
    - `001_initial_schema.sql`: Both `final_outcome` and `outcome` columns are populated and validated.
    - `backend/app/services/call_service.py`: Updates `status = "completed"`, `final_outcome = chosen_outcome`, `outcome = chosen_outcome`, `duration_seconds`, `next_step_notes`, and `ended_at`.
    - Duplicate close calls safely return the existing finalized record without re-mutating or duplicating.
* **Finding:** **Verified by automated test `test_close_call_with_outcome_alias`.**

---

### Check 5: Stage Upsert Preservation & Duplicate Prevention
**Question:** *Does stage upsert preserve existing data and prevent duplicates?*

* **Audit Finding:**
  - Originally, if a caller entered notes in one action and later selected an outcome in a separate request without resending the notes, a naive upsert could set `prospect_words` to `NULL`.
  - **Action Taken:**
    - `call_service.py` was updated to read existing stage data for `(call_id, stage_number)` before updating. If `prospect_words` or `stage_outcome` is omitted in the incoming request, the existing value is preserved rather than overwritten with `None`.
    - Merged `additional_data` / `extra_data` dictionaries.
    - Database unique constraint `CONSTRAINT uq_call_stage_result UNIQUE (call_id, stage_number)` prevents duplicate stage records.
* **Finding:** **Verified by automated test `test_stage_upsert_preserves_existing_data`.**

---

### Check 6: Frontend Fallback Accuracy (No False Success)
**Question:** *Does the frontend fallback to localStorage ever make a failed backend save look successful?*

* **Audit Finding:**
  - In `frontend/src/app/calls/[id]/page.tsx`, if the backend close API failed, the error handler fell back to saving locally in `localStorage`. However, the completed summary card previously displayed a static badge: `"FastAPI + Supabase PostgreSQL"` and `"Persisted to Supabase PostgreSQL database"`.
  - **Action Taken:**
    - Updated `calls/[id]/page.tsx` to dynamically check `syncStatus`.
    - When `syncStatus !== "synced"` (offline/error), it now displays:
      - Badge: `"Saved Locally in Browser Only"` and `"Backend Offline Fallback"`.
      - Description: `"Saved in browser local storage (FastAPI offline)."`.
      - Warning banner: Clearly informs the user that the call was saved locally because the backend is offline and can be migrated from Call History.
    - Only displays `"FastAPI + Supabase PostgreSQL"` when `syncStatus === "synced"`.
* **Finding:** **Resolved. Failed backend saves now clearly reflect local-only storage status.**

---

### Check 7: LocalStorage Migration Idempotency
**Question:** *Is the old localStorage migration idempotent?*

* **Audit Finding:**
  - In `call-storage.ts`, demo calls originally had IDs like `"demo-call-1"`. If migration was re-run (e.g. after resetting flags), non-UUID calls were assigned random UUIDs, causing duplicate records.
  - In `call_service.py`, `create_call` used a raw `insert()`, which would fail with a 500 duplicate key error if an existing call UUID was submitted.
  - **Action Taken:**
    - `toDeterministicUUID(rawId)` added to `call-storage.ts`: maps demo IDs (`demo-call-1` ... `demo-call-8`) to deterministic, stable RFC-compliant UUIDs.
    - `call_service.create_call`: converted to `upsert(..., on_conflict="id")`.
    - Re-running migration 1 time or 100 times updates existing records in place and never generates duplicate calls.
* **Finding:** **100% Idempotent.**

---

## 3. Verification Test Run Summary

### 3.1 Backend Pytest (18 Tests)
Command: `pytest tests -v`
```text
tests/test_calls.py::test_health_endpoint PASSED                         [  5%]
tests/test_calls.py::test_create_call_success PASSED                     [ 11%]
tests/test_calls.py::test_get_call_by_id PASSED                          [ 16%]
tests/test_calls.py::test_get_unknown_call_returns_404 PASSED            [ 22%]
tests/test_calls.py::test_update_stage_success PASSED                    [ 27%]
tests/test_calls.py::test_invalid_stage_number_validation PASSED         [ 33%]
tests/test_calls.py::test_stage_upsert_without_duplication PASSED        [ 38%]
tests/test_calls.py::test_stage_upsert_preserves_existing_data PASSED    [ 44%]
tests/test_calls.py::test_create_call_with_phone_number_and_idempotence PASSED [ 50%]
tests/test_calls.py::test_close_call_with_outcome_alias PASSED           [ 55%]
tests/test_calls.py::test_furthest_stage_monotonic_behavior PASSED       [ 61%]
tests/test_calls.py::test_close_call_success PASSED                      [ 66%]
tests/test_calls.py::test_close_call_invalid_outcome_rejected PASSED     [ 72%]
tests/test_calls.py::test_duplicate_close_handling PASSED                [ 77%]
tests/test_calls.py::test_list_calls_and_filtering PASSED                [ 83%]
tests/test_calls.py::test_database_failure_handling PASSED               [ 88%]
tests/test_health.py::test_root PASSED                                   [ 94%]
tests/test_health.py::test_health_check PASSED                           [100%]

======================== 18 passed, 1 warning in 1.39s ========================
```

### 3.2 Frontend Test Suites (24 Tests)
Command: `npm test`
- `test-phase2.mjs`: 8/8 tests PASSED (100%)
- `test-phase3.mjs`: 9/9 tests PASSED (100%)
- `test-phase4.mjs`: 7/7 tests PASSED (100%)

### 3.3 Production Build & Lint
- `npm run lint`: **0 errors**
- `npm run build`: **Exit Code 0** (All static and server-rendered routes generated cleanly)

---

## 4. Conclusion

CallGuide AI is fully verified and consistent across all specifications, domain types, API routes, service layers, and database migration scripts. The repository is ready for live Supabase testing.
