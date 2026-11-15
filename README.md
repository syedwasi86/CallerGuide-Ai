# CallGuide AI — Cold-Call Companion (MVP)

**CallGuide AI** is an AI-assisted cold-call companion designed for outbound B2B sales professionals. It keeps a structured eight-stage conversation methodology beside live phone calls, helps callers anticipate prospect objections and responses grounded in empirical cold-call transcripts, captures verbatim prospect statements, logs stage-by-stage results and canonical call outcomes to PostgreSQL, and provides low-latency LLM-assisted conversational guidance with intelligent rule-based fallbacks.

The single source of truth for all product requirements, conversational stages, data models, and acceptance criteria is [`doc/PRODUCT_SPEC.md`](doc/PRODUCT_SPEC.md).

---

## 1. Main Product Capabilities

1. **Eight-Stage Cold-Call Companion:** Guides callers in real time through an industry-tested cold-call sequence:
   * **Stage 1 — Opening:** Reach the right decision-maker and introduce yourself.
   * **Stage 2 — Purpose:** Explain the concise reason for the call without pitching prematurely.
   * **Stage 3 — Permission:** Secure time or consent to speak.
   * **Stage 4 — Their business:** Learn about company operations, existing vendors, or current setup.
   * **Stage 5 — Their need, in their words:** Capture verbatim problem statements, goals, and challenges.
   * **Stage 6 — Objection:** Address objections directly and pivot toward low-friction next steps.
   * **Stage 7 — Next step:** Propose and confirm a concrete, low-friction follow-up action.
   * **Stage 8 — Close:** Confirm agreed follow-up details and conclude courteously.
2. **Prospect Creation & Selection:** Create a new prospect or select an existing contact with instant deduplication, contact auto-fill, and live search across prospect names, companies, and phone numbers.
3. **Stage-Level Result Capture & Verbatim Notes:** Record selectable stage outcomes and exact prospect statements at every stage, preserved separately from caller interpretations.
4. **Any-Stage Exit:** Calls can terminate gracefully at any point with one of the 10 canonical outcomes without forcing the full sequence.
5. **Call History & Analytics Dashboard:** Filter calls by outcome or stage, search past conversations, review key metrics (total calls, completion rate, average duration, furthest stage distribution), and view stage-by-stage audit details.
6. **Transcript-Grounded Guidance:** Stage guidance and prospect response examples are grounded in 100 authentic fictionalized B2B cold-call transcripts analyzed in [`doc/DATASET_ANALYSIS.md`](doc/DATASET_ANALYSIS.md).
7. **Dual-Provider LLM Suggestions with Rule-Engine Fallback:** Contextual conversational suggestions powered by Google Gemini (`gemini-3.5-flash-lite`) or Groq (`openai/gpt-oss-20b`) via direct REST integration. Includes bounded transient retry, strict read timeouts, and immediate rule-engine fallback if the LLM is unconfigured, slow, or unavailable.
8. **Ethical Guardrail:** When a prospect asks not to be called (`do_not_call`), the assistant strictly generates a respectful departure statement without objection handling or persuasion.

---

## 2. Technology Stack

* **Frontend:**
  * **Framework:** Next.js 16.4.6 (App Router, Webpack bundler)
  * **UI Library:** React 19.3.0
  * **Styling:** Tailwind CSS 4.3.3
  * **Language:** TypeScript 5.9.3
  * **Hosting Target:** Vercel
* **Backend:**
  * **Framework:** FastAPI 0.162.6
  * **Server:** Uvicorn 0.38.0
  * **Validation & Settings:** Pydantic 2.14.3 & Pydantic-Settings 2.16.3
  * **HTTP Client:** HTTPX 0.28.1 (async client with connection pooling)
  * **Database Client:** Supabase Python Client (`supabase>=2.10.0`)
  * **Language:** Python 3.11+ (tested on Python 3.13)
  * **Hosting Target:** Render
* **Database:**
  * **Engine:** Supabase PostgreSQL
  * **Features:** Relational schema (`calls`, `call_stage_results`), Row Level Security (RLS), automated triggers for timestamping and bidirectional column synchronization, and 9 performance indexes.

---

## 3. Directory Structure

```text
caller guide/
├── doc/
│   ├── PRODUCT_SPEC.md              # Authoritative PRD & MVP specification
│   └── DATASET_ANALYSIS.md          # 100-transcript empirical dataset analysis
├── data/
│   └── cold-call-transcripts-100/   # 100 fictionalized cold-call transcripts & metadata
├── cold-call-transcripts-100/       # Secondary transcript root used by scripts & tests
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── calls/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── details/page.tsx # Comprehensive stage audit detail view
│   │   │   │   │   └── page.tsx         # Live 8-stage active cold-call runner
│   │   │   │   └── page.tsx             # Call history & metrics dashboard
│   │   │   ├── globals.css          # Tailwind CSS styles
│   │   │   ├── layout.tsx           # Global shell & typography
│   │   │   └── page.tsx             # Landing screen with Start Call dialog trigger
│   │   ├── components/active-call/  # Modular call UI components (AiAssistant, Stepper, etc.)
│   │   ├── config/stages.ts         # 8-stage definitions, guidance, and transcript quotes
│   │   ├── lib/
│   │   │   ├── api-client.ts        # Robust REST client with resilient base URL resolution
│   │   │   └── call-storage.ts      # Active call references & demo data migration
│   │   └── types/index.ts           # Shared TypeScript domain models and stage contracts
│   ├── .env.example                 # Frontend environment variable template
│   ├── package.json                 # Next.js scripts, dependencies, engines (Node >=20.9)
│   ├── test-phase2.mjs              # Phase 2 Stage Engine automated test suite
│   ├── test-phase3.mjs              # Phase 3 Call History & Storage automated test suite
│   ├── test-phase4.mjs              # Phase 4 Backend Integration & API Client test suite
│   ├── test-phase4-1.mjs            # Phase 4.1 Prospect Selection & Modal test suite
│   └── test-phase5.mjs              # Phase 5 AI Suggestions & Dataset integrity test suite
├── backend/
│   ├── app/
│   │   ├── api/v1/calls.py          # REST endpoints for calls, stages, suggestions, prospects
│   │   ├── core/config.py           # Pydantic BaseSettings, timeouts, CORS validator
│   │   ├── db/supabase.py           # Supabase client singleton using service-role key
│   │   ├── schemas/                 # Pydantic request/response schemas (call.py, ai.py)
│   │   ├── services/
│   │   │   ├── ai_service.py        # AI suggestion orchestration, retries, rule fallback
│   │   │   ├── call_service.py      # Call lifecycle, stage upserts, prospect deduplication
│   │   │   └── providers/           # REST providers (gemini.py, groq.py, base.py)
│   │   └── main.py                  # FastAPI application, CORS middleware, /health endpoint
│   ├── scripts/                     # Dataset processing & extraction utilities
│   ├── supabase/migrations/
│   │   └── 001_initial_schema.sql   # Idempotent database schema, triggers, and RLS policies
│   ├── tests/
│   │   ├── test_ai.py               # AI suggestions, timeout, retry, fallback unit tests
│   │   ├── test_calls.py            # Backend CRUD, stage upsert, prospect search tests
│   │   └── test_health.py           # Service status and database connectivity tests
│   ├── .env.example                 # Backend environment variable template
│   ├── README.md                    # Backend architecture, setup & test guide
│   └── requirements.txt             # Production Python dependencies
├── DEPLOYMENT_READINESS_REPORT.md   # Comprehensive pre-deployment readiness audit
└── README.md                        # Master repository documentation
```

---

## 4. Prerequisites

* **Node.js:** Node.js **>= 20.9.0** (Node.js **22.x LTS** recommended for Vercel deployment; Next.js 16 requires Node 20.9+).
* **Package Manager:** `npm` (v10+ or v11+).
* **Python:** Python **3.11+** (tested on Python 3.13.3; 64-bit).
* **Database:** Free-tier or managed **Supabase** project (PostgreSQL 15+).

---

## 5. Local Development Setup

### 5.1 Clone & Setup Database

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run `backend/supabase/migrations/001_initial_schema.sql`.
4. From **Project Settings -> API**, obtain:
   * **Project URL** (`SUPABASE_URL`)
   * **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`)

### 5.2 Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create local environment configuration
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```dotenv
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_ORIGIN=http://localhost:3000

# Supabase Credentials (keep service-role key backend-only)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key

# LLM Configuration (Gemini or Groq)
LLM_PROVIDER=gemini
LLM_API_KEY=your-gemini-api-key-from-google-ai-studio
LLM_MODEL=gemini-3.5-flash-lite

# Groq Configuration (Optional secondary provider)
GROQ_API_KEY=your-groq-api-key-from-groq-console
GROQ_MODEL=openai/gpt-oss-20b

# Timeouts (in seconds)
LLM_CONNECT_TIMEOUT_SECONDS=5.0
LLM_READ_TIMEOUT_SECONDS=20.0
LLM_WRITE_TIMEOUT_SECONDS=10.0
LLM_POOL_TIMEOUT_SECONDS=5.0
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Verify backend health at `http://localhost:8000/health`.

### 5.3 Frontend Setup

```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create local environment configuration
cp .env.example .env.local
```

`frontend/.env.local` contains:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Start the frontend development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Testing & Build Commands

### 6.1 Frontend Verification

From the `frontend/` directory:

```bash
# Run all 5 automated frontend test suites (Phase 2, 3, 4, 4.1, 5)
npm test

# Run TypeScript typecheck (0 errors)
npx tsc --noEmit

# Run ESLint (0 errors)
npm run lint

# Run Next.js production build
npm run build
```

### 6.2 Backend Verification

From the `backend/` directory (with `.venv` activated):

```bash
# Run the complete pytest suite (34/34 tests passing)
pytest -v
```

---

## 7. LLM Integration & Fallback Handling

CallGuide AI integrates Google Gemini and Groq without heavy external SDKs by using lightweight, asynchronous `httpx` connection-pooled REST requests:

1. **Active Provider Selection:** Configured via `LLM_PROVIDER=gemini` or `LLM_PROVIDER=groq`.
2. **Transient Error Retries:** Transient connection failures, socket timeouts, and HTTP 500/503 responses trigger up to **2 automated retries** with backoff.
3. **No Retries on Hard Errors:** HTTP 401/403 authorization failures or LLM read timeouts fail immediately without retry to prevent latency accumulation during active sales calls.
4. **Resilient JSON Parsing:** Handles raw JSON as well as markdown-wrapped JSON code blocks (` ```json ... ``` `).
5. **Rule-Engine Fallback:** If the external LLM times out, fails, or has no API key configured, the application automatically invokes a rule engine grounded in the 100 empirical cold-call transcripts. The API response marks `is_fallback: true` and `provider: "fallback"`, and the UI indicates fallback status without disrupting the caller.
6. **Ethical Guardrail:** If the prospect asks not to be called (`selected_outcome == "do_not_call"` or verbatim text signals a request to stop contact), the system short-circuits LLM generation and outputs an immediate respectful departure statement (`provider: "guardrail"`).

---
## 8. Live Deployment & Submission Links

### 8.1 Live Application — Vercel

**Production Frontend:**  
https://caller-guide-ai-flax.vercel.app/

The live application provides the eight-stage cold-call companion, prospect selection, AI-assisted conversational guidance, stage-level result capture, and call history.

### 8.2 Backend API — Render

**Production Backend:**  
https://callerguide-ai.onrender.com

**Health Check:**  
https://callerguide-ai.onrender.com/health

The FastAPI backend handles call lifecycle management, prospect data, stage results, AI suggestions, and PostgreSQL persistence through Supabase.

### 8.3 Database — Supabase PostgreSQL

The database schema and migration are included in the public repository:

`backend/supabase/migrations/001_initial_schema.sql`

The migration defines the `calls` and `call_stage_results` tables, relationships, indexes, triggers, and Row Level Security policies.

### 8.4 LLM Integration

**Production LLM Provider:** Google Gemini  
**Model:** `gemini-3.5-flash-lite`

The LLM is used to generate contextual, concise, conversational suggestions based on the current call stage, selected stage outcome, and prospect's recorded words.

The application also supports Groq (`openai/gpt-oss-20b`) as an alternative provider.

A transcript-grounded rule-based fallback handles unavailable, unconfigured, or timed-out LLM requests to keep the call workflow usable.

### 8.5 Deployment Architecture

| Component | Technology | Hosting |
|---|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS | Vercel |
| Backend | FastAPI, Python | Render |
| Database | PostgreSQL | Supabase |
| AI suggestions | Google Gemini / Groq | External API |

---

## 9. Security & Privacy Considerations

* **Backend Secrets:** Gemini/Groq API keys and Supabase `service_role` secrets are strictly backend-only. They are never exposed to the browser or prefixed with `NEXT_PUBLIC_`.
* **Row Level Security (RLS):** Supabase tables enforce RLS, allowing access only to the backend's authenticated `service_role`.
* **CORS Restrictions:** FastAPI restricts allowed origins to the configured `FRONTEND_ORIGIN` and local development URLs.
* **Content Safety:** Verbatim prospect input and AI suggestions are rendered with standard React JSX string escaping to prevent XSS.
* **Fictionalized Dataset:** The 100 cold-call transcripts in `data/` are completely fictionalized. They must not be published or used to attempt identification of real individuals or companies.

---

## 10. Known Limitations

* **Render Free-Tier Spin-Down:** Render free web services spin down after 15 minutes of inactivity. When spun down, the first request will take 30–50 seconds to complete. The frontend handles this by displaying a retry banner and a 15-second request timeout.
* **Supabase Free-Tier Pausing:** Free Supabase projects pause after 7 days of inactivity. If paused, re-activate the project in the Supabase Dashboard.
* **Browser Extension Warnings:** Browser extensions that inject DOM attributes into pages (such as `data-qb-installed="true"`) can produce harmless console hydration warnings. Testing in Incognito mode with extensions disabled verifies that no application hydration mismatch exists.
# CallerGuide-Ai
