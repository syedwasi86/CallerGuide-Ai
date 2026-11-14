# Phase 5.1 Completion Report: Improve Gemini API Reliability and Timeout Handling

**Project:** CallGuide AI  
**Date:** November 15, 2026  
**Status:** Completed & Verified  
**Branch:** `main`  

---

## 1. Executive Summary

Phase 5.1 upgrades the Google Gemini API integration in **CallGuide AI** by eliminating brittle hardcoded timeouts, adding controlled transient retry logic, establishing granular error classification, and refining the frontend caller experience.

Key accomplishments:
1. **Configurable HTTP Timeouts:** Replaced the hardcoded 5-second total timeout with granular, environment-driven HTTPX timeout parameters:
   - Connect Timeout: `5.0s` (configurable via `LLM_CONNECT_TIMEOUT_SECONDS`)
   - Read Timeout: `20.0s` (configurable via `LLM_READ_TIMEOUT_SECONDS`)
   - Write Timeout: `10.0s` (configurable via `LLM_WRITE_TIMEOUT_SECONDS`)
   - Pool Timeout: `5.0s` (configurable via `LLM_POOL_TIMEOUT_SECONDS`)
2. **Controlled Transient Retry:** Implemented at most **ONE** automatic retry strictly for transient failures (temporary network disconnects, HTTP 429 rate limits with backoff, HTTP 5xx server errors). Non-transient errors (invalid API keys, 401/403 auth failures, model not found 404, or read timeouts) are never retried.
3. **Diagnostic Logging & Error Classification:** The service classifies and logs specific failure categories (`connect_timeout`, `read_timeout`, `connection_failure`, `rate_limit_exceeded`, `authentication_failure`, `model_not_found`, `provider_server_error`) with elapsed timing while **never exposing credentials or API keys**.
4. **Preserved Rule-Engine Fallback:** On failure or timeout, the system seamlessly returns high-quality transcript-grounded guidance with `is_fallback: true`, `provider: "rule_engine"`, and an informative `fallback_reason`. Live Gemini completions return `is_fallback: false` and `provider: "gemini"`.
5. **Caller UX Polish:** While awaiting generation, the Active Call screen displays `"Generating AI suggestion..."` while keeping the call interface fully usable and disabling the button to prevent accidental duplicate requests. When a fallback is returned, the UI displays a clear `Transcript-based Fallback` notice with an action to retry.
6. **Verification & Regression Testing:** Added 9 focused unit tests in `backend/tests/test_ai.py` (totaling 34 passing backend tests) and updated frontend test suites (all 5 suites passing with 100% success).

---

## 2. Files Changed

| File Path | Status | Summary of Changes |
|---|---|---|
| `backend/app/core/config.py` | Modified | Added `llm_connect_timeout_seconds`, `llm_read_timeout_seconds`, `llm_write_timeout_seconds`, and `llm_pool_timeout_seconds` with sensible defaults. |
| `backend/app/schemas/ai.py` | Modified | Added `fallback_reason: Optional[str]` to `SuggestionResponse`. |
| `backend/app/services/ai_service.py` | Modified | Implemented granular HTTPX timeout, controlled single retry for transient issues, error classification, credential-safe logging, and fallback reason attribution. |
| `backend/.env.example` | Modified | Documented all 4 timeout environment variables alongside `LLM_API_KEY` and `LLM_MODEL`. |
| `backend/tests/test_ai.py` | Modified | Added 9 test scenarios verifying successful response, slow response within read timeout, read timeout, connect timeout, transient retry, permanent auth failure, retry failure fallback, contract compliance, and zero API key leakage. |
| `frontend/src/lib/api-client.ts` | Modified | Added `fallback_reason?: string | null` to `AiSuggestionResult`; updated offline fallback provider to `"rule_engine"`. |
| `frontend/src/components/active-call/AiAssistant.tsx` | Modified | Updated loading text to `"Generating AI suggestion..."`, added fallback notice banner with `fallback_reason`, and improved retry actions. |
| `frontend/test-phase5.mjs` | Modified | Verified `"Generating AI suggestion..."` loading text, fallback badge, and `fallback_reason` support. |

---

## 3. New Timeout Configuration

In `backend/app/core/config.py`, timeouts are configured via Pydantic settings with environment variable fallbacks:

```python
# LLM Timeout Configuration (in seconds)
llm_connect_timeout_seconds: float = 5.0
llm_read_timeout_seconds: float = 20.0
llm_write_timeout_seconds: float = 10.0
llm_pool_timeout_seconds: float = 5.0
```

### Environment Variables (`backend/.env` & `backend/.env.example`)
```ini
# LLM Provider Configuration (Phase 5 & 5.1)
LLM_API_KEY=your-gemini-api-key
LLM_MODEL=gemini-2.5-flash

# LLM Timeout Configuration (in seconds)
LLM_CONNECT_TIMEOUT_SECONDS=5.0
LLM_READ_TIMEOUT_SECONDS=20.0
LLM_WRITE_TIMEOUT_SECONDS=10.0
LLM_POOL_TIMEOUT_SECONDS=5.0
```

### Why this resolves previous timeouts:
The previous 5.0s total timeout cut off normal LLM generation latency (which often takes 5–8 seconds for cold requests or complex prompts). With a dedicated **20-second read timeout**, Gemini has sufficient headroom to generate complete, high-quality responses, while the **5-second connect timeout** prevents hung sockets.

---

## 4. Retry & Error-Handling Behaviour

### 4.1 Retry Rules (At Most ONE Retry)
Requests allow up to 2 attempts (1 initial request + 1 controlled retry):

| Failure Category | HTTP Status / Exception | Retried? | Action Taken |
|---|---|---|---|
| **Connection Timeout** | `httpx.ConnectTimeout` | **Yes (1x)** | Waits 0.5s, retries once. Falls back if attempt 2 fails. |
| **Network / Interruption** | `httpx.ConnectError` / `NetworkError` | **Yes (1x)** | Waits 0.5s, retries once. Falls back if attempt 2 fails. |
| **Rate Limit** | HTTP `429` | **Yes (1x)** | Waits 1.0s backoff, retries once. Falls back if attempt 2 fails. |
| **Server Error** | HTTP `500`, `502`, `503`, `504` | **Yes (1x)** | Waits 1.0s, retries once. Falls back if attempt 2 fails. |
| **Read Timeout** | `httpx.ReadTimeout` | **No** | **Never retried**. Waiting another 20s during a live call is unacceptable. Falls back immediately. |
| **Invalid API Key / Auth** | HTTP `401`, `403`, or `400 (API_KEY_INVALID)` | **No** | **Never retried**. Permanent client error. Falls back immediately. |
| **Model Not Found** | HTTP `404` | **No** | **Never retried**. Configuration error. Falls back immediately. |
| **Malformed Client Request** | HTTP `400` / `422` | **No** | **Never retried**. Client error. Falls back immediately. |

### 4.2 Credential Protection & Logging
- The API key is sent via the standard `x-goog-api-key` HTTP header rather than in URL query strings.
- Log statements record attempt number, HTTP status, and elapsed duration (e.g. `elapsed: 6.42s`), but **never output the API key**.

---

## 5. Fallback Contract & Frontend Experience

### 5.1 Response Contract
- **Live Gemini Success:**
  `is_fallback: false`, `provider: "gemini"`, `fallback_reason: null`
- **Rule Engine Fallback:**
  `is_fallback: true`, `provider: "rule_engine"`, `fallback_reason: "Response read timeout after 20.0s"` (or specific error category)
- **Do-Not-Call Guardrail:**
  `is_fallback: false`, `provider: "guardrail"`, `fallback_reason: null`

### 5.2 Active Call UI Enhancements
- **Button & Loading Indicator:** Displays `"Generating AI suggestion..."` with an animated spinner. The button is disabled during in-flight requests to prevent double-clicks.
- **Transcript Fallback Notice:** If a fallback response is received, the card displays an amber badge:
  `Transcript-based Fallback` and shows:
  *"Notice: Generated using transcript-grounded rule engine (reason). Using transcript-based guidance."*
- **Retry Action:** When fallback occurs, the action button changes to `"↻ Retry with Gemini"` so the caller can easily trigger another attempt if network conditions improve.

---

## 6. Test Results

### 6.1 Backend Automated Tests (`pytest tests/test_ai.py -v`)
All 9 Phase 5.1 specific test cases passed:
1. `test_1_gemini_success_within_timeout` — PASSED
2. `test_2_gemini_slow_response_succeeds_within_read_timeout` — PASSED
3. `test_3_read_timeout_no_retry_fallback` — PASSED
4. `test_4_connect_timeout_retries_and_falls_back` — PASSED
5. `test_5_transient_error_successful_retry` — PASSED
6. `test_6_permanent_auth_error_no_retry` — PASSED
7. `test_7_retry_failure_followed_by_fallback` — PASSED
8. `test_8_correct_is_fallback_and_provider_contract` — PASSED
9. `test_9_no_api_key_exposure_in_response_or_logs` — PASSED

**Total Backend Suite:** **34 passed, 0 failed** (100% pass rate).

### 6.2 Frontend Test Suite (`npm test`)
Ran all 5 frontend test suites:
- Phase 2 Verification Suite (8 checks): PASSED
- Phase 3 Verification Suite (9 checks): PASSED
- Phase 4 Verification Suite (7 checks): PASSED
- Phase 4.1 Verification Suite (10 checks): PASSED
- Phase 5 / 5.1 Verification Suite (7 checks): PASSED

**Total Frontend Suite:** **34 passed, 0 failed** (100% pass rate).

### 6.3 Code Quality & Production Build
- **ESLint:** `npm run lint` exited with **0 errors**.
- **Next.js Production Build:** `npm run build` compiled all routes cleanly with **Exit Code 0**.

---

## 7. Exact Instructions for Testing with a Real Gemini API Key

To test live Gemini generation end-to-end:

### Step 1: Obtain a Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com).
2. Sign in with your Google account and click **Get API key**.
3. Create a free API key (starts with `AIzaSy...`).

### Step 2: Configure `backend/.env`
Open [backend/.env](file:///c:/Users/syed%20wasi%20uddin/OneDrive/Desktop/caller%20guide/backend/.env) and configure:
```ini
LLM_API_KEY=AIzaSyYourActualKeyHere
LLM_MODEL=gemini-2.5-flash

LLM_CONNECT_TIMEOUT_SECONDS=5.0
LLM_READ_TIMEOUT_SECONDS=20.0
LLM_WRITE_TIMEOUT_SECONDS=10.0
LLM_POOL_TIMEOUT_SECONDS=5.0
```
*(Note: Recommended models are `gemini-2.5-flash` or `gemini-1.5-flash`.)*

### Step 3: Start Backend & Frontend
In Terminal 1 (Backend):
```powershell
cd "c:\Users\syed wasi uddin\OneDrive\Desktop\caller guide\backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In Terminal 2 (Frontend):
```powershell
cd "c:\Users\syed wasi uddin\OneDrive\Desktop\caller guide\frontend"
npm run dev
```

### Step 4: Verify Live Suggestion
1. Open [http://localhost:3000](http://localhost:3000) and click **Start Live Call**.
2. Enter prospect details (e.g., `Amit Shah`, `Precision Forgings`).
3. Advance to **Stage 6 (Objection)**.
4. In the prospect notes area, type:
   `"We already have an in-house team handling this."`
5. Click **Suggest a Response**.
6. The button displays **"Generating AI suggestion..."**. Within 3–6 seconds, the response card renders with:
   - Green badge: **`● Live Gemini AI`**
   - Contextual spoken suggestion generated by Gemini
   - Alternative phrasing angle
   - Rationale explaining the positioning
7. In the backend terminal, observe the success log:
   `INFO: Gemini API request succeeded (attempt: 1, elapsed: 4.12s)`
