# CallGuide AI — Backend Application

This directory contains the FastAPI backend for **CallGuide AI**, an AI-assisted cold-call companion for B2B sales professionals.

The single source of truth for all product requirements, conversational stages, data models, and acceptance criteria is [`../doc/PRODUCT_SPEC.md`](../doc/PRODUCT_SPEC.md).

---

## 1. Architecture & Features

The backend provides a high-performance asynchronous REST API powered by FastAPI, Pydantic v2, and Supabase PostgreSQL:

* **Call Lifecycle & Stage Tracking (`app/services/call_service.py`):**
  * `POST /api/calls`: Starts a new call session, storing prospect name, company, role, and phone number.
  * `GET /api/calls`: Paginated list of past calls with search, status, and outcome filtering.
  * `GET /api/calls/{id}`: Returns call details and stage-by-stage results.
  * `GET /api/calls/{id}/details`: Returns detailed breakdown of call metrics and all 8 stages.
  * `PUT /api/calls/{id}/stages/{stage_number}`: Idempotently upserts stage results, saves verbatim prospect notes, and monotonically advances `furthest_stage_reached`.
  * `POST /api/calls/{id}/close`: Concludes a call session, computes call duration, and records the canonical outcome.
  * `GET /api/calls/prospects`: Returns deduplicated historical prospects with their most recent role, phone number, and last call date.
* **Dual-Provider LLM Integration (`app/services/ai_service.py`):**
  * Lightweight asynchronous REST implementations for **Google Gemini** (`gemini-3.5-flash-lite`) and **Groq** (`openai/gpt-oss-20b`) via direct `httpx` connection pooling (no heavy SDK dependencies).
  * **Bounded Transient Retry:** Retries transient connection drops and HTTP 500/503 errors up to 2 times with backoff.
  * **No Retry on Hard Failures:** HTTP 401/403 authorization failures or LLM read timeouts fail immediately without retry.
  * **Rule-Engine Fallback:** If the LLM is unconfigured, slow, or unavailable, the backend seamlessly generates transcript-grounded guidance with `is_fallback: true` and `provider: "fallback"`.
  * **Ethical Guardrail:** Automatically short-circuits LLM generation when prospects decline contact (`do_not_call`), generating an immediate respectful departure statement (`provider: "guardrail"`).
* **System Health & Readiness (`GET /health`):**
  * Inspects service status and executes a live probe against Supabase PostgreSQL to report real database connectivity.

---

## 2. Technology & Dependencies

* **Framework:** FastAPI 0.162.6
* **Server:** Uvicorn 0.38.0
* **Validation & Settings:** Pydantic 2.14.3 & Pydantic-Settings 2.16.3
* **HTTP Client:** HTTPX 0.28.1 (async client with connection pooling)
* **Database Client:** Supabase Python Client (`supabase>=2.10.0`)
* **Testing:** Pytest 9.2.0 & AnyIO 4.16.0
* **Python Runtime:** Python **3.11+** (tested on Python 3.13.3)

---

## 3. Directory Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── calls.py          # REST endpoints for calls, stages, suggestions, prospects
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py             # Settings validation, CORS parsing, timeout settings
│   ├── db/
│   │   ├── __init__.py
│   │   └── supabase.py           # Supabase client singleton using service-role key
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── ai.py                 # SuggestionRequest, SuggestionResponse, Guardrail schemas
│   │   └── call.py               # CallCreate, CallResponse, StageResult schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_service.py         # AI suggestion orchestration, retries & rule fallback
│   │   ├── call_service.py       # Call CRUD, stage upserts, monotonic stage advance
│   │   └── providers/
│   │       ├── __init__.py
│   │       ├── base.py           # Abstract BaseLlmProvider & shared httpx connection pool
│   │       ├── gemini.py         # Google Gemini Generative Language REST API provider
│   │       └── groq.py           # Groq OpenAI-compatible Chat Completions REST provider
│   ├── __init__.py
│   └── main.py                   # FastAPI application, CORS middleware, /health route
├── scripts/
│   ├── analyze_transcripts.py    # Transcript turn and dialogue pattern analyzer
│   ├── dataset_stats.py          # Transcript duration and outcome statistics extractor
│   └── extract_examples.py       # Stage guidance phrase extraction utility
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Idempotent schema, tables, triggers, indexes, and RLS
├── tests/
│   ├── __init__.py
│   ├── test_ai.py                # AI suggestions, timeout, retry, fallback unit tests
│   ├── test_calls.py             # Call lifecycle, stage upserts, prospect search tests
│   └── test_health.py            # Root metadata and health check tests
├── .env.example                  # Environment variable documentation template
├── .env                          # Local environment secrets (gitignored)
├── requirements.txt              # Production Python package dependencies
└── README.md                     # Backend documentation
```

---

## 4. Environment Variables

Create `.env` inside the `backend/` directory:

```bash
cp .env.example .env
```

| Variable | Required in Prod | Default | Purpose |
|---|---|---|---|
| `PORT` | Optional (Auto on Render) | `8000` | HTTP port on which Uvicorn binds |
| `ENVIRONMENT` | Optional | `development` | Environment mode (`development` / `production`) |
| `CORS_ORIGINS` | Optional | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated allowed browser origins |
| `FRONTEND_ORIGIN` | **Required in Prod** | `""` | Production frontend domain (e.g. `https://callguide-ai.vercel.app`) |
| `SUPABASE_URL` | **Required in Prod** | `""` | Supabase project REST URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required in Prod** | `""` | Supabase service-role secret key (backend only) |
| `LLM_PROVIDER` | Optional | `gemini` | Active LLM provider (`gemini` or `groq`) |
| `LLM_API_KEY` | Optional / Recommended | `""` | Google Gemini API key (from Google AI Studio) |
| `LLM_MODEL` | Optional | `gemini-3.5-flash-lite` | Gemini model identifier |
| `GROQ_API_KEY` | Optional | `""` | Groq Cloud API key (from Groq Console) |
| `GROQ_MODEL` | Optional | `openai/gpt-oss-20b` | Groq model identifier |
| `LLM_CONNECT_TIMEOUT_SECONDS` | Optional | `5.0` | Socket connection timeout |
| `LLM_READ_TIMEOUT_SECONDS` | Optional | `20.0` | LLM inference generation timeout |
| `LLM_WRITE_TIMEOUT_SECONDS` | Optional | `10.0` | HTTP request transmission timeout |
| `LLM_POOL_TIMEOUT_SECONDS` | Optional | `5.0` | Connection pool acquisition timeout |

* **Zero-Crash Startup:** If `LLM_API_KEY` is not provided, the backend starts normally and falls back to the built-in rule engine. If `SUPABASE_URL` is omitted, `/health` reports database `"unconfigured"` without crashing.
* **Security:** Real credentials must never be committed to Git. `.env` is strictly gitignored.

---

## 5. Local Setup & Testing

```bash
# 1. Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run development server
uvicorn app.main:app --reload --port 8000

# 4. Run automated test suite (34/34 tests passing)
pytest -v
```

---

## 6. Database Migration (Supabase)

The database schema is defined in `supabase/migrations/001_initial_schema.sql`.

To apply:
1. Open the **SQL Editor** in your Supabase project dashboard.
2. Paste the contents of `001_initial_schema.sql`.
3. Click **Run**.

The migration is completely idempotent:
* Creates tables `calls` and `call_stage_results`.
* Installs `uuid-ossp` and `pgcrypto` extensions.
* Sets up automated `updated_at` triggers and column synchronization triggers (`outcome` <-> `final_outcome`).
* Creates 9 performance query indexes.
* Enables Row Level Security (RLS) with full access granted only to the `service_role`.

---

## 7. Deployment on Render

1. Log in to [Render](https://render.com) and click **New -> Web Service**.
2. Connect your Git repository.
3. Configure service:
   * **Root Directory:** `backend`
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   * `SUPABASE_URL`: (from Supabase dashboard)
   * `SUPABASE_SERVICE_ROLE_KEY`: (from Supabase dashboard)
   * `FRONTEND_ORIGIN`: `https://<your-app>.vercel.app`
   * `ENVIRONMENT`: `production`
   * `LLM_PROVIDER`: `gemini`
   * `LLM_API_KEY`: `<your-gemini-key>`
   * `LLM_MODEL`: `gemini-3.5-flash-lite`
5. Render uses `/health` as the automated health check probe.
