# CallGuide AI — Cold-Call Companion (MVP)

CallGuide AI is an AI-assisted cold-call companion designed for outbound B2B sales professionals. It keeps a structured 8-stage conversation methodology beside live phone calls, helps anticipate prospect objections and responses, captures verbatim prospect statements, and logs stage-by-stage results and canonical call outcomes to PostgreSQL.

> **Status:** Phase 4 (FastAPI Backend + Supabase Database Integration) complete. Database persistence, session recovery, and REST API synchronization are active. Phase 5 (LLM response generation) will follow.

---

## 1. System Architecture

```text
┌─────────────────────────────────┐
│   Next.js Frontend (React 19)   │
│  - Active 8-Stage Call Runner   │
│  - Call History & Metrics       │
│  - Stage-by-Stage Audit Detail  │
└────────────────┬────────────────┘
                 │ REST / JSON (api-client.ts)
                 ▼
┌─────────────────────────────────┐
│     FastAPI REST Backend        │
│  - Call Lifecycle & Stage Upsert│
│  - Monotonic Furthest Stage     │
│  - Canonical Outcome Validation │
└────────────────┬────────────────┘
                 │ supabase-py (Service Role)
                 ▼
┌─────────────────────────────────┐
│      Supabase PostgreSQL        │
│  - calls table                  │
│  - call_stage_results table     │
│  - Unique (call_id, stage_num)  │
└─────────────────────────────────┘
```

* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS v4, Webpack bundler.
* **Backend:** Python 3.13, FastAPI, Pydantic v2, Uvicorn, Supabase Python Client (`supabase>=2.10.0`).
* **Database:** Supabase PostgreSQL with relational tables (`calls`, `call_stage_results`), triggers, indexes, and RLS.
* **Specification Source of Truth:** `doc/PRODUCT_SPEC.md` defines product requirements, 8-stage call flows, data models, and acceptance criteria.

---

## 2. Directory Structure

```text
caller guide/
├── doc/
│   └── PRODUCT_SPEC.md              # Source of truth specification
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── calls/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── details/page.tsx # Stage audit view
│   │   │   │   │   └── page.tsx         # Active 8-stage call runner
│   │   │   │   └── page.tsx             # Call history & metrics dashboard
│   │   │   ├── globals.css          # Tailwind CSS styles
│   │   │   ├── layout.tsx           # Global shell & navigation
│   │   │   └── page.tsx             # Landing page
│   │   ├── data/
│   │   │   └── stages.ts            # 8-stage reference data & prospect examples
│   │   ├── lib/
│   │   │   ├── api-client.ts        # REST client with backend mapping & fallbacks
│   │   │   └── call-storage.ts      # Active call references & demo data migration
│   │   └── types/
│   │       └── index.ts             # Domain types, stages, outcomes, sessions
│   ├── .env.example                 # Frontend environment template
│   ├── package.json                 # Next.js scripts & dependencies
│   ├── test-phase2.mjs              # Phase 2 automated test suite
│   ├── test-phase3.mjs              # Phase 3 automated test suite
│   └── test-phase4.mjs              # Phase 4 automated test suite
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── calls.py         # REST endpoints for calls and stage results
│   │   ├── core/
│   │   │   └── config.py            # Pydantic Settings & Supabase validation
│   │   ├── db/
│   │   │   └── supabase.py          # Supabase client singleton
│   │   ├── schemas/
│   │   │   └── call.py              # Pydantic v2 request/response schemas
│   │   ├── services/
│   │   │   └── call_service.py      # Business logic, monotonic stages, CRUD
│   │   └── main.py                  # FastAPI app, CORS, /health route
│   ├── supabase/
│   │   └── migrations/
│   │       └── 001_initial_schema.sql # Database schema, indexes, and triggers
│   ├── tests/
│   │   ├── test_calls.py            # Comprehensive backend CRUD unit tests
│   │   └── test_health.py           # Health endpoint and DB connectivity tests
│   ├── .env.example                 # Backend environment template
│   └── requirements.txt             # FastAPI, uvicorn, pydantic, supabase, pytest
├── README.md
├── PHASE_2_COMPLETION_REPORT.md
├── PHASE_3_COMPLETION_REPORT.md
└── PHASE_4_COMPLETION_REPORT.md
```

---

## 3. Database Schema & Supabase Setup

### 3.1 Migration File
The complete schema definition is located at:
`backend/supabase/migrations/001_initial_schema.sql`

It provisions:
1. `calls` table: `id`, `prospect_name`, `company`, `phone_number`, `current_stage`, `furthest_stage_reached`, `status` (`in_progress`, `completed`), `final_outcome`, `notes`, `created_at`, `updated_at`, `closed_at`.
2. `call_stage_results` table: `id`, `call_id` (FK cascade), `stage_number` (1-8), `stage_name`, `target_met` (boolean), `notes`, `transcript_snippet`, `created_at`, `updated_at`.
3. Unique Constraint: `UNIQUE(call_id, stage_number)` ensuring idempotent stage upserts.
4. Auto-update trigger: `set_updated_at()` updates `updated_at` timestamps on row mutation.
5. Indexes: Optimized lookups by status, outcome, created timestamp, and stage number.
6. Row-Level Security: Default RLS policies configured.

### 3.2 Applying Migration to Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `backend/supabase/migrations/001_initial_schema.sql` and run.
4. Obtain your Project URL and `service_role` secret key from **Project Settings → API**.

---

## 4. Environment Configuration

### 4.1 Backend (`backend/.env`)
Create `backend/.env` based on `backend/.env.example`:
```ini
APP_NAME="CallGuide AI API"
ENVIRONMENT="development"
DEBUG=true

# Supabase Credentials (keep service_role key strictly on the backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

### 4.2 Frontend (`frontend/.env.local`)
Create `frontend/.env.local` based on `frontend/.env.example`:
```ini
# FastAPI Backend REST Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Security Rule:** Never put the Supabase service-role key or database password in `frontend/.env.local` or any client-side bundle.

---

## 5. API Reference

All call endpoints are mounted under `/api/calls`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/calls` | Create a new call session (`prospect_name`, `company`, `phone_number`) |
| `GET` | `/api/calls` | List calls with search (`search`), status filter (`status`), and pagination |
| `GET` | `/api/calls/{id}` | Get call summary and current progress |
| `GET` | `/api/calls/{id}/details`| Get call summary along with all 8 stage results sorted by stage number |
| `PUT` | `/api/calls/{id}/stages/{stage_number}` | Upsert stage result; automatically updates `furthest_stage_reached` monotonically |
| `POST` | `/api/calls/{id}/close` | Finalize call with one of the 10 canonical outcomes; prevents duplicate closure |
| `GET` | `/health` | Health check returning service status, environment, and Supabase DB connection state |

### 10 Canonical Final Outcomes
Validated by backend schema and frontend types:
* `meeting_booked`
* `follow_up_scheduled`
* `referral_obtained`
* `gatekeeper_blocked`
* `not_interested`
* `bad_timing`
* `no_budget`
* `wrong_contact`
* `competitor_lock_in`
* `do_not_call`

---

## 6. Running Locally

### 6.1 Backend (FastAPI)
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

### 6.2 Frontend (Next.js)
```powershell
cd frontend
npm run dev
```
- Web Application: `http://localhost:3000`
- Call History: `http://localhost:3000/calls`

---

## 7. Testing & Verification

### 7.1 Backend Automated Tests (Pytest)
```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests -v
```
Runs 15 automated tests covering:
* `/health` and root endpoints.
* Call lifecycle: Creation, listing, filtering, search.
* Monotonic `furthest_stage_reached` progression (advancing and back-navigation).
* Stage result upserts (create vs update with notes and snippets).
* Close validation with canonical outcomes and duplicate closure prevention.
* 404 and 422 error handling.

### 7.2 Frontend Automated Tests (Node / ES Modules)
```powershell
cd frontend
npm test
```
Runs 3 test suites:
* `test-phase2.mjs`: 8-stage active call runner, state transitions, prompt guides.
* `test-phase3.mjs`: Call metrics, search, sorting, filtering, outcome badges.
* `test-phase4.mjs`: REST API client mapping, error handling, localStorage migration, schema validation.

### 7.3 Code Quality & Build Checks
```powershell
cd frontend
npm run lint
npm run build
```
Production build uses Webpack (`--webpack`) for 100% deterministic compilation and static pre-rendering across all pages.
