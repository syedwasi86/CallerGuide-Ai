# CallGuide AI — Comprehensive Pre-Deployment Readiness Audit Report

**Date of Audit:** 2026-11-15  
**Audit Target:** CallGuide AI MVP (`C:\Users\syed wasi uddin\OneDrive\Desktop\caller guide`)  
**Product Specification:** `doc/PRODUCT_SPEC.md` (Version 1.0)  
**Status:** Pre-Deployment Audit, Cleanup & Corrections Complete  

---

## 1. Executive Summary

A comprehensive pre-deployment audit, workspace cleanup, and resolution of deployment-readiness issues has been conducted on the CallGuide AI application. The application is an AI-assisted cold-call companion featuring an eight-stage structured conversational workflow, prospect selection, stage-level result capture, Supabase database persistence, call history analysis, and dual LLM integration (Google Gemini and Groq) with intelligent fallback to a rule-based engine.

### Key Corrections & Findings Completed in this Turn

1. **API Base URL Resolution Resolved:** `getApiBaseUrl()` in `frontend/src/lib/api-client.ts` was refactored. Access to `process.env.NEXT_PUBLIC_API_BASE_URL` is no longer gated behind `typeof window !== "undefined"`. In production (`NODE_ENV === "production"`), missing or invalid URLs fail explicitly and immediately with informative errors, preventing accidental localhost fallback. Trailing slashes are stripped cleanly. Five automated test scenarios were added to `test-phase4.mjs`.
2. **Node.js Compatibility Corrected:** Corrected the erroneous "Node.js 18+" documentation. Next.js 16 requires Node.js **>= 20.9.0**. Added `"engines": { "node": ">=20.9.0" }` to `frontend/package.json`, and documented Node.js **22.x LTS** as the recommended deployment runtime for Vercel.
3. **Hydration Warning Verified & Documented:** Empirical testing in an Incognito browser window with all extensions disabled eliminated the hydration warning. The warning was traced to an external browser extension injecting the attribute `data-qb-installed="true"` into the DOM. No application hydration mismatch exists; no artificial code workarounds (`suppressHydrationWarning`) or HTML alterations were made.
4. **Complete README Audit:** Every README in the workspace was inspected, audited, and updated. Created `backend/README.md`, completely rewrote `frontend/README.md` from the stock boilerplate, and updated the root `README.md` to reflect all implemented capabilities, correct Node/Python versions, and deployment instructions.

### Readiness Status Overview

* **Overall Deployment Readiness:** **READY TO DEPLOY**
* **Frontend Readiness:** **READY** — Next.js 16.4.6 production build passed (`next build --webpack`), TypeScript typecheck passed with 0 errors, ESLint passed with 0 errors, and all 5 automated frontend test suites passed (100%).
* **Backend Readiness:** **READY** — FastAPI application passed all 34 pytest test cases covering AI suggestions, bounded retries, timeout fallbacks, ethical guardrails, call lifecycle, stage upserts, prospect search, and health checks.
* **Supabase Readiness:** **READY** — Complete, idempotent SQL migration (`001_initial_schema.sql`) defines required tables (`calls`, `call_stage_results`), triggers, performance indexes, and Row Level Security (RLS) policies.
* **LLM Integration Readiness:** **READY** — Dual provider architecture (Gemini REST and Groq API) via connection-pooled `httpx` with bounded transient retry (2 retries for 500/503/connect timeout), strict read timeout without retry, JSON parsing resilience, and seamless rule-engine fallback.
* **Critical Blockers:** **NONE.**

---

## 2. Project Architecture

The CallGuide AI system is architected as a decoupled modern web application designed for cloud hosting on free/managed tiers:

```
+-------------------------------------------------------------------------+
|                              USER BROWSER                               |
|       Next.js 16 Client App (React 19, Tailwind CSS 4, TypeScript 5)    |
|       - Active Call Interface (8-Stage Stepper & Response Guidance)     |
|       - Prospect Search, Modal Dialog & Auto-Fill                       |
|       - Call History Dashboard, Summary Metrics & Detail Drawer         |
+------------------------------------+------------------------------------+
                                     | HTTPS REST (15s Timeout)
                                     v
+-------------------------------------------------------------------------+
|                            RENDER WEB SERVICE                           |
|                    FastAPI Backend (Python 3.13 / Uvicorn)              |
|   - API Routers: /health, /api/calls, /api/calls/suggestions, /prospects|
|   - CallService (CRUD, Stage Upsert, Idempotence, Furthest Stage)       |
|   - AiService (Gemini REST + Groq REST with Connection Pooling)         |
|   - Resilient Fallback Engine & Ethical Guardrails                      |
+-------------------+--------------------------------+--------------------+
                    |                                |
       HTTPS Supabase REST API           HTTPS Generative AI REST APIs
                    |                                |
                    v                                v
+------------------------------------+   +--------------------------------+
|       SUPABASE POSTGRESQL          |   |     LLM PROVIDERS (Configurable)|
| - calls (sessions, outcomes)       |   | - Google Gemini Generative API |
| - call_stage_results (verbatim)    |   | - Groq Low-Latency API         |
| - Row Level Security (RLS)         |   | - Rule-Based Fallback Engine   |
| - Automated Triggers & Sync        |   +--------------------------------+
+------------------------------------+
```

* **Frontend:** Next.js 16.4.6, React 19.3.0, Tailwind CSS 4.3.3, TypeScript 5. Target host: **Vercel**.
* **Backend:** FastAPI 0.162.6, Pydantic 2.14.3, Uvicorn 0.38.0, HTTPX 0.28.1. Target host: **Render**.
* **Database:** Supabase PostgreSQL with `uuid-ossp`, `pgcrypto`, and Row Level Security.
* **LLM Providers:** Google Gemini (`gemini-3.5-flash-lite`) and Groq (`openai/gpt-oss-20b`) via direct REST API integration with connection pooling and rule-engine fallback.

---

## 3. Workspace Cleanup Summary

The workspace file audit inspected all files across root, `doc/`, `backend/`, `data/`, and `frontend/`. Unnecessary historical development artifacts and duplicate documents were safely relocated into a structured holding folder (`WORKSPACE_CLEANUP_REVIEW/`) and subsequently reviewed by the project owner and moved outside the active repository to ensure the production workspace remains clean, focused, and easily maintainable.

### 3.1 Holding Folder Structure & Post-Review Relocation

```
WORKSPACE_CLEANUP_REVIEW/ (Reviewed and relocated outside workspace)
├── CLEANUP_INVENTORY.md
├── reports/
│   ├── PHASE_1_COMPLETION_REPORT.md
│   ├── PHASE_2_1_STYLING_FIX_REPORT.md
│   ├── PHASE_2_COMPLETION_REPORT.md
│   ├── PHASE_3_COMPLETION_REPORT.md
│   ├── PHASE_4_COMPLETION_REPORT.md
│   ├── PHASE_4_PRETEST_AUDIT.md
│   └── PHASE_5_1_REPORT.md
├── historical_docs/
│   └── PHASE_5_REPORT.md
├── duplicate_files/
│   └── PHASE_5_1_REPORT.md (duplicate copy from doc/)
└── temporary_scripts/
    └── benchmark_providers.py
```

* **Total Files Inspected:** 248 individual files (excluding `node_modules`, `.next`, `.venv`, and `.git`).
* **Total Files Moved to Holding Folder:** 10 files (7 historical phase reports, 1 technical report, 1 duplicate documentation file, 1 temporary benchmarking script).
* **Owner Action:** Following review, the project owner relocated the holding folder outside the active repository directory.
* **Source Code Modified for Cleanup:** **ZERO.** No source code was altered, renamed, or deleted for cleanup.

### 3.2 Files Deliberately Retained in Place

1. **`doc/PRODUCT_SPEC.md`:** Retained at original path as mandated. Single source of truth.
2. **`doc/DATASET_ANALYSIS.md`:** Retained in `doc/`. Verified that `frontend/test-phase5.mjs` directly asserts its presence and content. Moving it breaks automated tests.
3. **`cold-call-transcripts-100/` & `data/cold-call-transcripts-100/`:** Retained. Verified that `test-phase5.mjs` checks `../cold-call-transcripts-100/cold-call-transcripts-100/transcripts` as fallback when running from `frontend/`, and `backend/scripts/*.py` use this path.
4. **`frontend/test-phase*.mjs` (5 files):** Retained in `frontend/`. These form the core test suite executed by `npm test`.
5. **`frontend/AGENTS.md`:** Retained in `frontend/`. Automatically generated and required by Next.js 16 development environment.
6. **`backend/scripts/analyze_transcripts.py`, `dataset_stats.py`, `extract_examples.py`:** Retained in `backend/scripts/` for data processing and transcript verification.

---

## 4. Frontend Audit & Corrections

### 4.1 Framework & Dependencies
* **Framework:** Next.js 16.4.6 running in Webpack mode (`next build --webpack`), React 19.3.0, TypeScript 5.9.3.
* **Styling:** Tailwind CSS 4.3.3 via `@tailwindcss/postcss`.
* **Lock File:** `frontend/package-lock.json` present, consistent, and validated against `package.json`.
* **Node Compatibility (Corrected):** Next.js 16 requires Node.js **>= 20.9.0**. Added `"engines": { "node": ">=20.9.0" }` in `frontend/package.json`. Documented Node.js **22.x LTS** as the recommended Vercel deployment runtime. Corrected all outdated documentation referencing Node.js 18+.

### 4.2 API Integration (Corrected)
* **Base URL Resolution:** Refactored `getApiBaseUrl()` in `frontend/src/lib/api-client.ts`:
  ```typescript
  export function getApiBaseUrl(): string {
    const rawUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
    const isProduction = process.env.NODE_ENV === "production";

    if (rawUrl && typeof rawUrl === "string" && rawUrl.trim().length > 0) {
      const trimmed = rawUrl.trim().replace(/\/+$/, "");
      if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
      }
      if (isProduction) {
        throw new Error(
          `Invalid NEXT_PUBLIC_API_BASE_URL configured for production: "${rawUrl}". URL must begin with http:// or https://.`
        );
      }
      return trimmed;
    }

    if (isProduction) {
      throw new Error(
        "NEXT_PUBLIC_API_BASE_URL is not configured for production environment. " +
        "Configure NEXT_PUBLIC_API_BASE_URL in your deployment environment variables (e.g., in Vercel project settings)."
      );
    }

    return "http://localhost:8000";
  }
  ```
* **Consistent Server & Browser Execution:** The function no longer checks `typeof window !== "undefined"` before reading the environment variable. It behaves identically whether executing in Node.js server SSR or in a client browser.
* **No Silent Localhost in Production:** If `NEXT_PUBLIC_API_BASE_URL` is omitted or contains an invalid scheme in production, it throws an immediate, descriptive error rather than silently firing requests to `localhost:8000`.
* **Trailing Slashes:** Trailing slashes are stripped automatically.
* **Timeout & Failure Handling:** Fetch requests enforce a 15-second timeout using `AbortController` to accommodate Render free-tier cold starts. When the backend fails during call start, the UI displays a clear error banner and blocks navigation, preventing false success states.

### 4.3 Security Observations
* **API Secrets:** Zero Gemini, Groq, or Supabase service-role keys are present in frontend source code.
* **Public Environment Variables:** Only `NEXT_PUBLIC_API_BASE_URL` is exposed, strictly containing the public backend URL.
* **XSS & Content Safety:** Verbatim prospect input and AI suggestions are escaped through React JSX DOM binding.

### 4.4 User Experience & Hydration Warning Verification
* **Verified Extension Root Cause:** Manual testing in an Incognito browser window with all extensions disabled eliminated the hydration warning. The warning was caused by a browser extension injecting the attribute `data-qb-installed="true"` into the DOM.
* **No Application Code Mismatch:** The frontend HTML layout is clean and free of hydration mismatches. No artificial suppressions (`suppressHydrationWarning`) or HTML structure changes were introduced.
* **Interface Readiness:** Active Call 8-stage stepper, caller guidance, real transcript quotations, selectable stage outcomes, verbatim prospect text capture, and AiAssistant all operate smoothly.

### 4.5 Validation Results
* **`npm run lint`:** **PASSED** (0 errors, 1 non-blocking font warning in `layout.tsx`).
* **`npx tsc -p tsconfig.json --noEmit`:** **PASSED** (0 TypeScript errors).
* **`npm test`:** **PASSED** (All 5 test suites passed, including 5 new automated scenarios for `getApiBaseUrl`).
* **`npm run build`:** **PASSED** (Compiled successfully, generated static pages and partial prerender bundles).

---

## 5. Backend Audit

### 5.1 Application Configuration
* **Framework:** FastAPI 0.162.6 with Uvicorn 0.38.0.
* **Application Entry Point:** `backend/app/main.py` (`app = FastAPI(...)`).
* **Production Startup Command:**
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
* **Dependency File:** `backend/requirements.txt` contains clean, pinned production packages:
  `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`, `python-dotenv`, `httpx`, `pytest`, `supabase`.
* **Zero Bloat:** Provider integrations use standard `httpx` async clients directly without requiring proprietary Google GenAI or Groq SDKs.
* **Documentation Added:** Created `backend/README.md` detailing FastAPI architecture, environment variables, startup commands, tests, database migration, and Render deployment.

### 5.2 Environment Variables

| Variable Name | Required / Optional | Default Value | Purpose |
|---|---|---|---|
| `PORT` | Optional (Auto by Render) | `8000` | HTTP port on which Uvicorn binds |
| `ENVIRONMENT` | Optional | `development` | Environment mode (`development` / `production`) |
| `CORS_ORIGINS` | Optional | `http://localhost:3000,http://127.0.0.1:3000` | Allowed origins for web browsers |
| `FRONTEND_ORIGIN` | **Required in Prod** | `""` | Production frontend URL (e.g. `https://callguide-ai.vercel.app`) |
| `SUPABASE_URL` | **Required in Prod** | `""` | Supabase project REST URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required in Prod** | `""` | Supabase service-role secret key (backend only) |
| `LLM_PROVIDER` | Optional | `gemini` | Active LLM provider (`gemini` or `groq`) |
| `LLM_API_KEY` | Optional / Recommended | `""` | Google Gemini API key (from Google AI Studio) |
| `LLM_MODEL` | Optional | `gemini-3.5-flash-lite` | Gemini model identifier |
| `GROQ_API_KEY` | Optional | `""` | Groq Cloud API key (from Groq Console) |
| `GROQ_MODEL` | Optional | `openai/gpt-oss-20b` | Groq model identifier |
| `LLM_CONNECT_TIMEOUT_SECONDS`| Optional | `5.0` | Socket connection timeout |
| `LLM_READ_TIMEOUT_SECONDS` | Optional | `20.0` | LLM response generation timeout |
| `LLM_WRITE_TIMEOUT_SECONDS`| Optional | `10.0` | Request transmission timeout |
| `LLM_POOL_TIMEOUT_SECONDS` | Optional | `5.0` | Connection pool acquisition timeout |

* **Secret Protection:** `.env` is listed in `.gitignore` and has never been committed to Git history.
* **Resilient Startup:** If `LLM_API_KEY` or `GROQ_API_KEY` is missing, the backend starts normally and gracefully falls back to the built-in rule engine (`is_fallback: true`, `provider: "fallback"`).
* **Database Readiness:** If Supabase credentials are missing, the backend returns `"unconfigured"` on `GET /` and `GET /health` without crashing.

### 5.3 API Endpoints Contract Verification

* `GET /health` — Health check returning backend status and live Supabase database connectivity state.
* `GET /` — Root endpoint returning application metadata and database configuration status.
* `POST /api/calls` — Starts a call session with prospect details (`prospect_name`, `company_name`, `prospect_role`, `phone_number`).
* `GET /api/calls` — Lists calls with pagination (`page`, `page_size`), search, status, and outcome filtering.
* `GET /api/calls/{id}` — Fetches call session and stage-level results.
* `GET /api/calls/{id}/details` — Returns detailed call breakdown and stage metrics.
* `PUT /api/calls/{id}/stages/{stage_number}` — Idempotently upserts stage result and updates furthest stage monotonically.
* `POST /api/calls/{id}/close` — Completes call session, computes duration, records final outcome.
* `POST /api/calls/suggestions` — Generates contextual AI response suggestions with timeout and retry protection.
* `GET /api/calls/prospects` — Returns unique historical prospects with most recent contact details for auto-fill.

### 5.4 LLM Integration & Fallback Engine
* **Provider Support:** Fully functional implementations for Google Gemini REST API and Groq OpenAI-compatible REST API.
* **Bounded Retries:** Automatic 2-retry policy for transient network glitches (500, 503, connection timeouts).
* **Zero Retry on Permanent Errors:** Immediate fallback on HTTP 401/403 authorization failures or LLM read timeouts.
* **Ethical Guardrail:** If the prospect requests not to be called (`selected_outcome == "do_not_call"` or text indicates "do not call" / "remove my number"), the AI immediately generates a respectful exit statement and sets `provider: "guardrail"`.
* **Rule Engine:** Built-in rule engine provides transcript-informed suggestions when the external LLM is unconfigured, timed out, or unavailable.

### 5.5 Validation Results
* **`backend\.venv\Scripts\pytest -v`:** **PASSED** (34/34 tests passed in 7.30s).

---

## 6. Supabase Audit

### 6.1 Database Schema & Tables
The database schema is defined in `backend/supabase/migrations/001_initial_schema.sql`:

1. **`calls` Table:**
   * Primary Key: `id UUID DEFAULT gen_random_uuid()`
   * Prospect Fields: `prospect_name TEXT NOT NULL`, `company_name TEXT NOT NULL`, `prospect_role TEXT`, `phone_number TEXT`
   * Progress Fields: `status TEXT NOT NULL DEFAULT 'in_progress'`, `current_stage INTEGER DEFAULT 1`, `furthest_stage_reached INTEGER DEFAULT 1`
   * Timestamps: `started_at TIMESTAMPTZ`, `ended_at TIMESTAMPTZ`, `duration_seconds INTEGER DEFAULT 0`
   * Outcome: `final_outcome TEXT` / `outcome TEXT` (validated by CHECK constraints against the 10 approved outcomes)
   * Triggers: Automatic `updated_at` refresh and bidirectional column synchronization (`outcome` <-> `final_outcome`).

2. **`call_stage_results` Table:**
   * Primary Key: `id UUID DEFAULT gen_random_uuid()`
   * Foreign Key: `call_id UUID REFERENCES calls(id) ON DELETE CASCADE`
   * Stage Number: `stage_number INTEGER NOT NULL CHECK (stage_number >= 1 AND stage_number <= 8)`
   * Verbatim Capture: `prospect_words TEXT`
   * Outcome: `stage_outcome TEXT` / `selected_outcome TEXT`
   * Metadata: `additional_data JSONB`, `extra_data JSONB`
   * Constraint: `UNIQUE (call_id, stage_number)` ensuring idempotent stage upserts.

3. **Performance Indexes (9 Indexes):**
   * `idx_calls_started_at`, `idx_calls_status`, `idx_calls_final_outcome`, `idx_calls_outcome`, `idx_calls_furthest_stage`, `idx_calls_prospect_name`, `idx_calls_company_name`, `idx_call_stage_results_call_id`, `idx_call_stage_results_stage_number`.

4. **Row Level Security (RLS):**
   * RLS enabled on both tables.
   * Policies restrict full access to `auth.role() = 'service_role'`. Anonymous and unauthenticated direct client access is locked down.

---

## 7. Render Deployment Requirements (Backend)

* **Service Type:** Web Service
* **Environment:** Python 3 (Python 3.11, 3.12, or 3.13)
* **Root Directory:** `backend`
* **Build Command:**
  ```bash
  pip install -r requirements.txt
  ```
* **Start Command:**
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
* **Health Check Path:** `/health`
* **Environment Variables to Configure in Render Dashboard:**
  * `SUPABASE_URL` = `https://<your-project>.supabase.co` (Required)
  * `SUPABASE_SERVICE_ROLE_KEY` = `<service_role_secret>` (Required, backend-only)
  * `FRONTEND_ORIGIN` = `https://<your-frontend>.vercel.app` (Required for CORS)
  * `ENVIRONMENT` = `production` (Recommended)
  * `LLM_PROVIDER` = `gemini` (or `groq`)
  * `LLM_API_KEY` = `<your-gemini-key>` (Required if using Gemini)
  * `LLM_MODEL` = `gemini-3.5-flash-lite` (Optional override)
  * `GROQ_API_KEY` = `<your-groq-key>` (Required if using Groq)
  * `GROQ_MODEL` = `openai/gpt-oss-20b` (Optional override)
* **Render Free-Tier Considerations:** Render spins down free web services after 15 minutes of inactivity. The first request after idle can experience a 30-50 second cold-start latency. The frontend UI displays connection retry states cleanly and enforces a 15-second timeout with abort recovery.

---

## 8. Vercel Deployment Requirements (Frontend)

* **Framework Preset:** Next.js
* **Root Directory:** `frontend`
* **Build Command:**
  ```bash
  next build --webpack
  ```
* **Output Directory:** `.next` (default)
* **Node.js Version:** `22.x` (recommended; `engines` specifies `>=20.9.0`)
* **Environment Variables to Configure in Vercel Dashboard:**
  * `NEXT_PUBLIC_API_BASE_URL` = `https://<your-backend-app>.onrender.com`
* **Deployment Considerations:** Client components make asynchronous fetch requests directly to the Render backend URL. Ensure `NEXT_PUBLIC_API_BASE_URL` contains the HTTPS URL of the Render deployment without trailing slashes.

---

## 9. README Audit & Update Summary

Every README in the workspace was inspected, audited, and updated to reflect the actual project architecture:

| README File Location | Status | Key Updates Performed |
|---|---|---|
| `README.md` (root) | **UPDATED** | Rewritten to cover full MVP (8 call stages, prospect modal, dual LLM, Supabase, Render/Vercel guides, Node >=20.9/22.x, Python 3.11+, and test commands). |
| `frontend/README.md` | **UPDATED** | Replaced stock `create-next-app` boilerplate with complete Next.js 16 app documentation, component map, environment variables, Node 22.x requirements, and test suites. |
| `backend/README.md` | **CREATED** | Created comprehensive FastAPI backend guide detailing architecture, endpoints, dual LLM providers, bounded retries, Supabase schema migration, and Render setup. |
| `data/cold-call-transcripts-100/README.md` | **AUDITED / VERIFIED** | Verified accurate. Explains 100 fictionalized transcript formats, outcome labels, duration definitions, and ethical use restrictions. |
| `cold-call-transcripts-100/cold-call-transcripts-100/README.md` | **AUDITED / VERIFIED** | Verified accurate secondary copy used by test suites and analysis scripts. |
| `backend/.pytest_cache/README.md` | **AUDITED / VERIFIED** | Verified standard pytest cache documentation. Retained in cache folder. |

---

## 10. Security Audit

* **API Key Isolation:** Verified that no AI keys (Gemini, Groq) or database credentials are present in frontend source code or git history.
* **CORS Restrictions:** Configured in `app/main.py`. The backend dynamically registers `FRONTEND_ORIGIN` alongside allowed origins, preventing unauthorized cross-origin requests from foreign domains.
* **Row Level Security:** Tables in Supabase are protected by RLS; database modifications require the backend's `service_role` key.
* **Data Sanitization:** Database operations utilize parameterized queries through the Supabase client, preventing SQL injection. Verbatim user notes are rendered safely using React's built-in text escaping.
* **Git Cleanliness:** `.gitignore` excludes all `.env` files, build caches, and system files.

---

## 11. Test and Build Evidence

The following verification commands were executed directly during this audit. All checks completed with 100% pass rates:

| Check | Command Executed | Result | Notes |
|---|---|---|---|
| **Frontend Test Suite** | `npm --prefix frontend test` | **PASS (5/5 suites)** | Verified Stage Engine, Call History, Backend Client (including 5 new `getApiBaseUrl` tests), Prospect Modal, and AI/Dataset suites. |
| **Frontend Linting** | `npm --prefix frontend run lint` | **PASS (0 errors)** | 1 non-blocking font warning in `layout.tsx`. |
| **Frontend TypeScript** | `npx --prefix frontend tsc -p frontend/tsconfig.json --noEmit` | **PASS (0 errors)** | Clean compilation across all types, components, and pages. |
| **Frontend Build** | `npm --prefix frontend run build` | **PASS** | Production Webpack build generated static and partial prerender routes cleanly. |
| **Backend Test Suite** | `powershell -Command "Set-Location backend; .\.venv\Scripts\pytest -v"` | **PASS (34/34 tests)** | Verified AI bounds, timeouts, retries, fallbacks, call CRUD, prospect deduplication, and health endpoints. |
| **Git Working Tree** | `git status` | **STAGED FOR REVIEW** | No uncommitted secrets. Archived reports staged in review folder. |

---

## 12. Verification Split: Local vs Post-Deployment

### Completed Local Verifications
* Codebase compiles and builds without errors in both frontend and backend.
* 100% automated test pass rate (34 backend unit tests, 5 frontend test suites).
* API base URL resolution tested under production, development, and SSR conditions.
* Security verification confirmed no exposed credentials in code or Git history.
* Clean holding-folder organization for all historical development reports.

### Checks to Perform After Live Cloud Deployment
1. **Supabase Live Connection:** After creating the Supabase project and running `001_initial_schema.sql`, verify that `GET https://<render-url>/health` returns `database: "connected"`.
2. **CORS Communication:** Verify that the deployed Vercel frontend can make requests to the Render backend without CORS errors once `FRONTEND_ORIGIN` is configured in Render.
3. **Live AI Inference:** Trigger an AI suggestion during Stage 6 of an active call to confirm that Google Gemini / Groq generates live responses using the production API key.

---

## 13. Deployment Checklist

Follow this exact sequential order when performing the deployment:

### Step 1: Supabase Database Setup
1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor**.
3. Paste and run the entire contents of `backend/supabase/migrations/001_initial_schema.sql`.
4. Verify that tables `calls` and `call_stage_results` are created with RLS enabled.
5. In **Project Settings -> API**, copy:
   * **Project URL** (`SUPABASE_URL`)
   * **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`)

### Step 2: Render Backend Deployment
1. Log in to [Render](https://render.com) and click **New -> Web Service**.
2. Connect your Git repository.
3. Configure settings:
   * **Root Directory:** `backend`
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   * `SUPABASE_URL`: (from Step 1)
   * `SUPABASE_SERVICE_ROLE_KEY`: (from Step 1)
   * `FRONTEND_ORIGIN`: `https://<your-app>.vercel.app` (or temporary `*` until Vercel URL is known)
   * `ENVIRONMENT`: `production`
   * `LLM_PROVIDER`: `gemini` (or `groq`)
   * `LLM_API_KEY`: (Google AI Studio API key, if using Gemini)
   * `LLM_MODEL`: `gemini-3.5-flash-lite` (optional override)
   * `GROQ_API_KEY`: (Groq Console API key, if using Groq)
   * `GROQ_MODEL`: `openai/gpt-oss-20b` (optional override)
5. Deploy the service and verify `GET https://<render-subdomain>.onrender.com/health` returns `status: "ok"`.

### Step 3: Vercel Frontend Deployment
1. Log in to [Vercel](https://vercel.com) and click **Add New -> Project**.
2. Import the Git repository.
3. Configure settings:
   * **Root Directory:** `frontend`
   * **Framework Preset:** Next.js
   * **Node.js Version:** `22.x` (or `20.x`)
   * **Build Command:** `next build --webpack`
4. Add Environment Variable:
   * `NEXT_PUBLIC_API_BASE_URL`: `https://<render-subdomain>.onrender.com`
5. Deploy and verify that the active call screen and call history load cleanly.

### Step 4: Live Integration Verification
1. Open the deployed Vercel application.
2. Click **Start Call** -> Create a test prospect -> Progress through Stage 1 to Stage 8.
3. Request an AI suggestion in Stage 6 to confirm Gemini / fallback connectivity.
4. Complete the call -> Verify it appears in the **Call History** dashboard with accurate duration and outcome.

---

## 14. Final Verdict

### **READY TO DEPLOY**

**Justification:**  
All pre-deployment corrections, workspace cleanup, and README audits have been completed.
* The API base URL resolution issue has been resolved and verified with automated test coverage.
* Node.js version requirements are standardized to `>= 20.9.0` with `22.x` recommended for Vercel.
* The hydration warning root cause was verified as a browser extension rather than application code.
* All README files across the project provide complete, verified documentation.
* Frontend and backend production test suites, typechecks, and builds pass at 100%.

The project is fully prepared for cloud deployment on Supabase, Render, and Vercel.
