# CallGuide AI — Cold-Call Companion (MVP)

CallGuide AI is an AI-assisted cold-call companion designed for outbound B2B sales professionals. It keeps a structured conversation methodology beside phone calls, helps anticipate prospect responses, captures verbatim prospect statements, and logs stage-by-stage results and canonical call outcomes.

> **Status:** Phase 1 (Project Setup & Skeletons) complete. Supabase database persistence, LLM integration, and production deployment are planned for subsequent phases.

---

## 1. Project Overview & Current Architecture

CallGuide AI separates frontend presentation from backend API services:

* **Frontend:** Next.js (App Router), TypeScript, and Tailwind CSS. Provides a responsive, distraction-free desktop-first interface for sales callers.
* **Backend:** Python FastAPI with Pydantic v2 validation. Exposes REST endpoints (`/health`, `/`) with CORS middleware configured for frontend local development.
* **Specification Source of Truth:** `doc/PRODUCT_SPEC.md` defines all product requirements, 8-stage call flows, data models, and acceptance criteria.

---

## 2. Directory Structure

```text
caller guide/
├── doc/
│   └── PRODUCT_SPEC.md              # Source of truth specification
├── frontend/
│   ├── public/                      # Static assets
│   ├── src/
│   │   └── app/
│   │       ├── globals.css          # Tailwind CSS styles
│   │       ├── layout.tsx           # Global shell & metadata
│   │       └── page.tsx             # CallGuide AI landing surface & stage overview
│   ├── .env.example                 # Frontend environment template
│   ├── eslint.config.mjs            # ESLint configuration
│   ├── next.config.ts               # Next.js configuration
│   ├── package.json                 # Next.js dependencies and scripts
│   └── tsconfig.json                # TypeScript configuration
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py            # Pydantic Settings & CORS configuration
│   │   ├── __init__.py
│   │   └── main.py                  # FastAPI application, CORS, root & /health routes
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_health.py           # Pytest test suite for health & root endpoints
│   ├── .env.example                 # Backend environment template
│   └── requirements.txt             # FastAPI, uvicorn, pydantic, httpx, pytest
├── .gitignore                       # Git ignore rules for Node, Python, and secrets
└── README.md                        # Project documentation and developer guide
```

---

## 3. Prerequisites

* **Node.js:** v20+ (tested on v24.13.1)
* **npm:** v10+ (tested on 11.8.0)
* **Python:** 3.12 or 3.13 (Python 3.13.3 is configured in `backend/.venv`)
* **Git:** v2+

---

## 4. Local Development Setup

### 4.1 Frontend Setup

1. Open PowerShell and navigate to the `frontend/` directory:
   ```powershell
   cd "frontend"
   ```

2. Copy the environment template:
   ```powershell
   cp .env.example .env.local
   ```

3. Install dependencies:
   ```powershell
   npm install
   ```

4. Run the production build to verify:
   ```powershell
   npm run build
   ```

5. Start the Next.js development server:
   ```powershell
   npm run dev
   ```

The frontend will be available at: **`http://localhost:3000`**

---

### 4.2 Backend Setup

1. Open PowerShell and navigate to the `backend/` directory:
   ```powershell
   cd "backend"
   ```

2. Copy the environment template:
   ```powershell
   cp .env.example .env
   ```

3. Create the virtual environment using Python 3.13 (if not already created):
   ```powershell
   & "C:\Users\syed wasi uddin\AppData\Local\Programs\Python\Python313\python.exe" -m venv .venv
   ```

4. Activate the virtual environment:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```
   *(If script execution is restricted, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first)*

5. Install backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

6. Run automated test suite:
   ```powershell
   pytest
   ```

7. Start the FastAPI development server:
   ```powershell
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

The backend API will be available at:
* **Root status:** `http://127.0.0.1:8000/`
* **Health Check:** `http://127.0.0.1:8000/health`
* **Interactive API Docs (Swagger):** `http://127.0.0.1:8000/docs`

---

## 5. Scope Notice (Phase 1)

In this foundational phase:
* **Database (Supabase):** Not connected yet. Call tables and schemas will be created in Phase 4.
* **LLM Integration:** Not connected yet. Response suggestion endpoints will be implemented in Phase 5.
* **Active Call & History:** The UI contains placeholders and structural layouts; live calling and state persistence will be wired in Phases 2 and 3.
* **Hosting (Render & Vercel):** Deployment will be executed in Phase 6.
