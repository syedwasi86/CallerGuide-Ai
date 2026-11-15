# CallGuide AI — Frontend Application

This directory contains the Next.js 16 frontend application for **CallGuide AI**, an AI-assisted cold-call companion for B2B sales professionals.

The single source of truth for all product requirements, conversational stages, data models, and acceptance criteria is [`../doc/PRODUCT_SPEC.md`](../doc/PRODUCT_SPEC.md).

---

## 1. Architecture & Features

The frontend is built using Next.js App Router and React 19:

* **Active Call Interface (`/calls/[id]`):** An eight-stage stepper and response companion that displays stage goals, authentic transcript quotations, selectable stage outcomes, verbatim prospect text capture, and the live `AiAssistant` suggestion drawer.
* **Prospect Selection Dialog (`StartCallModal`):** Accessible from the Home and Call History pages. Supports creating new prospects with required-field validation, auto-filling details from existing contacts, deduplicating contacts, and live search across prospect names, companies, and phone numbers.
* **Call History Dashboard (`/calls`):** Live dashboard tracking summary metrics (total calls, completed calls, average duration, furthest stage distribution), outcome and stage filtering, search, and local demo data migration to Supabase.
* **Call Detail Audit View (`/calls/[id]/details`):** Detailed breakdown of completed or in-progress calls displaying prospect metadata, duration, final outcome, and each recorded stage result.
* **Resilient API Client (`src/lib/api-client.ts`):** Handles communication with the FastAPI backend, enforces request timeouts (15s for Render cold starts), maps snake_case responses to the domain model, strips trailing slashes, and handles environment-safe base URL resolution.

---

## 2. Technology & Dependencies

* **Framework:** Next.js 16.4.6 (`app` router with `--webpack` bundler)
* **UI Library:** React 19.3.0 & React-DOM 19.3.0
* **Styling:** Tailwind CSS 4.3.3 via `@tailwindcss/postcss`
* **Language & Types:** TypeScript 5.9.3, `@types/react` 19, `@types/react-dom` 19, `@types/node` 20
* **Linting:** ESLint 9 with `eslint-config-next` 16.4.6
* **Engine Requirement:** Node.js **>= 20.9.0** (Node.js **22.x LTS** recommended for deployment)

---

## 3. Directory Structure

```text
frontend/
├── src/
│   ├── app/
│   │   ├── calls/
│   │   │   ├── [id]/
│   │   │   │   ├── details/page.tsx # Detailed stage-by-stage audit view
│   │   │   │   └── page.tsx         # Active cold-call interface (8 stages)
│   │   │   └── page.tsx             # Call History dashboard & summary metrics
│   │   ├── globals.css              # Global styles & Tailwind CSS imports
│   │   ├── layout.tsx               # Root application shell & typography
│   │   └── page.tsx                 # Landing page with Start Call modal trigger
│   ├── components/active-call/
│   │   ├── AiAssistant.tsx          # AI suggestion card with copy, retry & fallback indicators
│   │   ├── CallHeader.tsx           # Prospect name, company, duration timer & exit button
│   │   ├── EndCallModal.tsx         # Close call modal with canonical outcome selector
│   │   ├── ExamplesList.tsx         # Real transcript quotes & verified source badges
│   │   ├── NotesArea.tsx            # Verbatim prospect text capture input
│   │   ├── OutcomeRadio.tsx         # Stage-specific selectable outcome radio options
│   │   ├── StageCard.tsx            # Main stage guidance & caller purpose panel
│   │   ├── StageStepper.tsx         # 8-stage visual progress stepper
│   │   └── StartCallModal.tsx       # Prospect creation, deduplication & search dialog
│   ├── config/
│   │   └── stages.ts                # 8-stage definitions, guidance & transcript quotes
│   ├── lib/
│   │   ├── api-client.ts            # FastAPI client, data mapping & base URL resolution
│   │   └── call-storage.ts          # Active call reference tracking & localStorage utilities
│   └── types/
│       └── index.ts                 # Domain models: CallSession, StageData, FinalOutcome
├── .env.example                     # Environment template
├── .env.local                       # Local development environment (gitignored)
├── package.json                     # Scripts, dependencies, engines (>=20.9.0)
├── test-phase2.mjs                  # Stage Engine verification test suite
├── test-phase3.mjs                  # Call History & Storage verification test suite
├── test-phase4.mjs                  # Backend Client & Base URL verification test suite
├── test-phase4-1.mjs                # Prospect Selection verification test suite
├── test-phase5.mjs                  # AI Integration & Dataset verification test suite
└── tsconfig.json                    # TypeScript compiler configuration
```

---

## 4. Environment Variables

Create `.env.local` for local development:

```bash
cp .env.example .env.local
```

| Variable | Required in Prod | Local Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | **Yes** | `http://localhost:8000` | Full URL of the FastAPI backend service |

* **Production Safety:** In production (`NODE_ENV === "production"`), if `NEXT_PUBLIC_API_BASE_URL` is missing or invalid, `getApiBaseUrl()` throws an explicit error rather than silently defaulting to localhost.
* **Trailing Slashes:** Trailing slashes are automatically trimmed (e.g. `https://api.callguide.ai///` -> `https://api.callguide.ai`).
* **Client & Server Consistency:** `getApiBaseUrl()` reads `process.env.NEXT_PUBLIC_API_BASE_URL` directly without gating access on `typeof window !== "undefined"`.

---

## 5. Development & Testing Commands

```bash
# Install dependencies
npm install

# Start development server on http://localhost:3000
npm run dev

# Run all 5 automated frontend test suites
npm test

# Run TypeScript typecheck (0 errors)
npx tsc --noEmit

# Run ESLint (0 errors)
npm run lint

# Run production build (Next.js Webpack)
npm run build

# Start production server locally after build
npm run start
```

---

## 6. Deployment on Vercel

1. Connect the repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Verify **Framework Preset** is `Next.js`.
4. Ensure **Node.js Version** is set to `22.x` (or `20.x`).
5. Add the production environment variable:
   * `NEXT_PUBLIC_API_BASE_URL` = `https://<your-render-app>.onrender.com`
6. Deploy.
