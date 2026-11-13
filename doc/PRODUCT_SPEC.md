# CallGuide AI --- Product Specification

**Document type:** Product Requirements Document (PRD)\
**Version:** 1.0\
**Status:** Development reference --- MVP\
**Project workspace:** `caller guide/`\
**Primary constraint:** 48-hour build and submission window

------------------------------------------------------------------------

## 1. Purpose of this document

This document is the single product reference for the CallGuide AI MVP.
The development agent should read it before making architectural, UI,
database, or implementation decisions.

Use this document as the source of truth for: - Product scope and user
journeys - The eight-stage cold-call flow - Required screens and
interactions - Call outcomes and stage-result capture - Database
entities and persistence rules - Backend API contracts - LLM behaviour
and safety constraints - Acceptance criteria and out-of-scope features

If a prompt conflicts with this document, follow the most recent
explicit instruction from the project owner. Do not silently change
product behaviour or expand scope. If an ambiguity blocks
implementation, identify it and ask before making a consequential
assumption.

## 2. Product summary

### Working name

**CallGuide AI** (working title; keep the name easy to change).

### One-line description

An AI-assisted cold-call companion that guides a salesperson through a
structured conversation, helps them anticipate prospect responses,
records what happened at each stage, and saves the call for later
review.

### The problem

During a cold call, a salesperson must listen, remember the call
structure, respond to unexpected questions, handle objections, capture
useful details, and agree on a next step. Switching between notes and
scripts makes this difficult.

CallGuide AI keeps a concise call guide open beside the phone
conversation. It shows the current stage, why that stage matters, likely
prospect responses, quick outcome choices, and a field for the
prospect's own words.

### Primary user

A salesperson making outbound calls to business prospects.

### Product principles

1.  **Fast to use while speaking:** The caller should understand the
    current task at a glance.
2.  **Research-informed, not generic:** Stage guidance and examples
    should be based on the supplied cold-call structure and transcript
    dataset.
3.  **Capture facts, not assumptions:** Preserve the prospect's wording
    separately from the caller's interpretation.
4.  **Never force the full sequence:** A call may end at any stage.
5.  **Persist reliably:** Stage results and call outcomes must be saved
    to the backend/database.
6.  **AI assists; the caller decides:** AI suggestions are optional and
    never sent automatically.
7.  **Keep the MVP focused:** Build a dependable call companion, not a
    full CRM or telephony system.

## 3. Assignment requirements

The assignment requires a small product deployed on free tiers, with an
LLM feature.

### Required screens

1.  **Active Call:** The main screen kept open during a cold call.
2.  **Call History:** A second screen listing past calls and the stage
    each call reached.

A call-detail view may be implemented as a page, drawer, or modal opened
from Call History.

### Required call capabilities

-   Show which stage the caller is in and the purpose of that stage.
-   Show what prospects commonly say at that point.
-   Let the caller select what happened at the stage.
-   Let the caller capture the prospect's own words.
-   Let the caller move to the next stage.
-   Let the caller end the call and record its outcome.
-   Save the call after it ends.
-   List past calls and show the stage each call reached.

### Required infrastructure

-   **Supabase:** Calls, stages/stage results, prospect words, outcomes.
-   **Render:** Backend endpoints to start a call, save a stage result,
    close a call, list calls, and provide a health endpoint.
-   **Vercel:** Frontend application.
-   **LLM:** At least one real LLM-powered feature.

The assignment permits free tiers. Render may sleep when idle; that is
acceptable for this project.

## 4. Source material and research rules

The project owner has supplied three task resources: 1. Cold-call
structure page:
`https://sainikpuri.deepthought.education/fde-hyderabad-v2/structure` 2.
Reference screen:
`https://sainikpuri.deepthought.education/fde-hyderabad-v2/reference` 3.
ZIP of 100 fictionalized cold-call transcripts:
`https://sainikpuri.deepthought.education/fde/cold-call-transcripts-100.zip`

The transcript dataset is provided for this assignment only. Do not
publish it, expose it in the deployed application, or attempt to
identify any person or company. The transcripts are fictionalized.

### Research findings already established

-   The dataset contains 100 transcript records.
-   The index contains 10 original outcome labels:
    -   `not_interested` --- 14
    -   `agreed_to_receive_report` --- 14
    -   `follow_up` --- 14
    -   `not_logged` --- 13
    -   `next_step_agreed` --- 11
    -   `do_not_call` --- 10
    -   `wrong_person` --- 8
    -   `interested` --- 7
    -   `moved_company` --- 5
    -   `call_again` --- 4
-   The prior dataset summary reported an average duration of 136
    seconds and a median duration of 93.5 seconds. Recalculate from the
    source index/transcripts if these values are needed in product copy
    or analytics.
-   The outcome index does **not** directly establish the furthest stage
    reached by each call. Do not infer stage drop-off counts from final
    outcomes.
-   The stage examples and selectable options in this document are
    initial product-content proposals. Before claiming that a phrase or
    response is statistically common, validate it against the actual
    transcripts and keep a record of the supporting transcript IDs.
-   Do not display invented statistics, conversion rates, or stage
    drop-off percentages.

### Research priorities

Pay particular attention to: - Stage 2: what prospects say after the
caller explains the purpose. - Stage 3: how prospects respond to a
request for permission/time. - Stage 5: the prospect's own words about
goals, needs, and challenges. - Stage 6: objections and how prospects
express them. - Where calls end and why.

When presenting examples in the product, keep them concise and
realistic. Examples may be lightly edited for readability, but do not
present invented examples as direct transcript quotations. If using a
verbatim quotation internally, preserve its transcript ID and exact
wording.

## 5. The eight-stage call structure

The application must use this exact stage order and stage naming:

1.  Opening
2.  Purpose
3.  Permission
4.  Their business
5.  Their need, in their words
6.  Objection
7.  Next step
8.  Close

A stage is a guide, not a mandatory gate. Prospects can decline, be
unavailable, be the wrong contact, or end the conversation at any point.
The caller must be able to close a call from every stage.

### Stage 1 --- Opening

**Purpose:** Reach the right person and introduce yourself.

**Caller guidance:** - Confirm the prospect's identity where
appropriate. - Introduce yourself and your organisation. - Establish
whether you have reached the right person. - Keep the opening brief and
natural.

**Prospect response examples (initial draft; validate against
transcripts):** - "Who is calling?" - "What is this regarding?" - "I'm
in a meeting. Can you call later?"

**Suggested stage-result options:** - `right_person_reached` --- Reached
the right person - `gatekeeper_answered` --- Receptionist / assistant
answered - `wrong_person_or_number` --- Wrong person or number -
`prospect_unavailable` --- Prospect unavailable

**Additional capture, if relevant:** - Correct contact name -
Referral/contact details - Callback note or requested time

### Stage 2 --- Purpose

**Purpose:** Explain why you are calling in one or two clear,
understandable sentences.

**Caller guidance:** - State the reason for contacting this
prospect/company. - Avoid vague claims and long company introductions. -
Explain the relevance of the call without over-pitching.

**Prospect response examples (initial draft; validate against
transcripts):** - "What exactly does your company do?" - "Where did you
get my number?" - "Is this a sales call?"

**Suggested stage-result options:** - `asked_company_purpose` --- Asked
what the company does - `asked_call_reason` --- Asked why you are
calling - `asked_contact_source` --- Asked about the contact source -
`purpose_understood` --- Understood the purpose

**Additional behaviour:** - Caller may clarify the purpose and remain on
the same stage. - Do not automatically advance merely because the
prospect has spoken.

### Stage 3 --- Permission

**Purpose:** Establish whether the prospect is willing and available to
speak now.

**Caller guidance:** - Seek a clear indication that the prospect is
willing to continue. - Respect time constraints. - If they are
unavailable, capture a callback request accurately. - Do not treat
silence or an ambiguous response as permission.

**Prospect response examples (initial draft; validate against
transcripts):** - "Yes, go ahead." - "Call me after two." - "Send it on
WhatsApp first."

**Suggested stage-result options:** - `permission_granted` ---
Permission granted - `not_available_now` --- Not available now -
`callback_requested` --- Requested callback -
`information_requested_first` --- Requested information first

**Conditional capture:** - Callback date/time/time zone if provided. -
Preferred information channel if provided. - Do not invent a callback
date or time.

### Stage 4 --- Their business

**Purpose:** Understand the prospect's business and their
role/responsibilities.

**Caller guidance:** - Ask concise questions about the business,
operating context, or prospect's role. - Listen before pitching. -
Establish whether the prospect is the relevant person. - Avoid turning
the stage into a long questionnaire.

**Prospect response examples (initial draft; validate against
transcripts):** - "We manufacture industrial equipment." - "I handle
operations, not business development." - "Tell me about your company
first."

**Suggested stage-result options:** - `explained_business` --- Explained
their business - `clarified_responsibilities` --- Clarified their
responsibilities - `corrected_company_information` --- Corrected company
information - `referred_another_contact` --- Referred another person

**Additional capture:** - Relevant business context, role, or referral
details in the prospect-words/notes field or structured extra data.

### Stage 5 --- Their need, in their words

**Purpose:** Understand the prospect's goals, challenges, needs, or
requirements, and capture their words accurately.

**Caller guidance:** - Let the prospect explain their situation. - Ask
open questions where appropriate. - Capture the prospect's own wording,
not only the caller's interpretation. - Do not assume every prospect has
a current need.

**Prospect response examples (initial draft; validate against
transcripts):** - "We are looking to enter new markets." - "Our plant is
operating below capacity." - "Everything is going fine. We don't have
any particular need."

**Suggested stage-result options:** - `shared_business_goal` --- Shared
a business goal - `shared_business_challenge` --- Shared a business
challenge - `no_current_need` --- No current need identified -
`asked_what_we_offer` --- Asked what we can offer

**UI priority:** - Make the prospect-words field especially prominent
and spacious on this stage. - Preserve the exact original text. - Never
overwrite original notes with an AI summary. - AI summarisation is
optional and secondary.

### Stage 6 --- Objection

**Purpose:** Understand and respond appropriately to a concern,
hesitation, or objection.

**Caller guidance:** - Listen without arguing. - Identify the actual
concern before responding. - Acknowledge the concern naturally. - Offer
a relevant, truthful response. - Respect a clear rejection or
do-not-contact request.

**Prospect response examples (initial draft; validate against
transcripts):** - "We already have a consultant." - "We have an internal
team handling this." - "Send something in writing first."

**Suggested stage-result options:** - `existing_provider_or_team` ---
Existing provider / internal team - `not_decision_maker` --- Not the
right decision-maker - `requested_information` --- Requested information
first - `declined_not_interested` --- Declined / not interested

**UI/AI priority:** - This stage is a primary use case for the AI
response assistant. - AI suggestions must be concise, contextual,
non-aggressive, and grounded in supplied information. - Do not suggest
misleading claims, fabricated customer results, guarantees, or pressure
tactics. - A do-not-call request must be respected and recorded as a
final call outcome, not treated as an objection to overcome.

### Stage 7 --- Next step

**Purpose:** Agree on one concrete next action, including what will
happen, through which channel, and when where applicable.

**Caller guidance:** - Ask for a clear next step. - Confirm the action
and timing. - Distinguish a soft expression of interest from a concrete
commitment. - Do not label a report request as a booked meeting or
qualified opportunity.

**Prospect response examples (initial draft; validate against
transcripts):** - "Send me the report on WhatsApp." - "Call me next
Tuesday afternoon." - "You can speak to our director."

**Suggested stage-result options:** - `agreed_to_receive_report` ---
Agreed to receive report - `meeting_scheduled` --- Meeting scheduled -
`follow_up_call_agreed` --- Follow-up call agreed -
`referred_to_contact` --- Referred to another contact

**Conditional capture:** - Report: preferred channel and destination if
provided. - Meeting: date/time if explicitly agreed. - Follow-up:
callback date/time if explicitly agreed. - Referral: contact
name/role/details if provided. - Do not fabricate or infer dates, times,
or contact details.

### Stage 8 --- Close

**Purpose:** Confirm the agreed action, end the conversation politely,
and record the final outcome.

**Caller guidance:** - Recap the agreed next action if there is one. -
Thank the prospect. - Record the actual result of the call. - Do not
force a positive outcome.

**Prospect response examples (initial draft; validate against
transcripts):** - "Okay, send it across." - "Let's connect next week." -
"Thank you, but we aren't interested."

**Final call outcome values:** Preserve the dataset's ten outcome
categories as the canonical set:

  Stored value                 Display label
  ---------------------------- --------------------------
  `agreed_to_receive_report`   Agreed to receive report
  `next_step_agreed`           Next step agreed
  `interested`                 Interested
  `follow_up`                  Follow-up
  `call_again`                 Call again
  `not_interested`             Not interested
  `do_not_call`                Do not call
  `wrong_person`               Wrong person
  `moved_company`              Moved company
  `not_logged`                 Not logged

`not_logged` should be used only when the caller genuinely cannot record
an outcome; it must not be treated as synonymous with rejection.

The final outcome is separate from the stage-result selection.

## 6. Core application screens

### 6.1 Dashboard / Call History

**Purpose:** Let the caller start a new call and review previous calls.

**Required elements:** - Product logo/name. - Navigation to
Dashboard/Call History. - Page title, e.g. "Your Calls". - Short
supporting description. - Primary "Start New Call" action. - Calls
table/list. - Useful empty state when no calls exist.

**Call list columns:** - Prospect - Company - Date/time - Last stage
reached - Final outcome - View details action

**Useful optional features:** - Search by prospect or company. - Filter
by final outcome. - Pagination or "load more" if needed. - Small summary
metrics, provided their definitions are accurate.

**Behaviour:** - Newly completed calls appear at the top. - Display the
furthest stage reached, independently of the final outcome. - Selecting
a row opens call details. - In-progress calls should be identifiable and
resumable. - Do not show fabricated analytics or conversion metrics.

### 6.2 Start Call flow

A lightweight form or modal should collect: - Prospect name (required) -
Company name (required) - Prospect role/designation (optional)

Avoid a large CRM-style form. The caller should be able to start
quickly.

On submission: 1. Call the backend start-call endpoint. 2. Create a
persisted call record with `status = in_progress`. 3. Set
`current_stage = 1`. 4. Store the returned call ID in frontend state and
a lightweight recovery mechanism such as session/local storage. 5.
Navigate to Active Call.

Do not store the authoritative call data only in browser storage.

### 6.3 Active Call

**Purpose:** This is the primary product screen and must be optimised
for use while speaking.

**Header:** - Product name/logo. - Prospect name. - Company name. -
Prospect role, if available. - Call duration or elapsed time. -
Always-accessible "End Call" action.

**Stage progress:** - Show all eight stages. - Clearly distinguish
completed, current, and upcoming stages. - Show current stage number and
title. - Permit revisiting previous stages. - Do not mark a stage
complete until the caller saves a result or explicitly moves past it
according to the interaction design.

**Current stage content:** - Stage number and title. - One-line
purpose. - Brief caller guidance. - Three concise prospect response
examples. - "What happened?" selectable stage-result options. -
Prospect's words text area. - Optional contextual extra fields. - AI
suggestion action where available. - Previous Stage and Next Stage
actions. - End Call action.

**Interaction rules:** - Stage-result selection is single-select in the
MVP. - Caller can save a stage without necessarily advancing. - Next
Stage saves the current stage first. - Previous Stage loads existing
saved values. - Revisiting and changing a stage updates the existing
result rather than creating a duplicate. - The caller may move forward
even if no stage result was selected, but the UI should make incomplete
capture clear. Do not block an urgent call-ending action. - Do not
require prospect words at every stage. - Stage 5 should visually
prioritise prospect words. - Avoid unnecessary scrolling; the current
objective, likely responses, outcome controls, and notes should be easy
to reach.

### 6.4 End Call flow

The caller must be able to end a call from any stage.

When "End Call" is selected: 1. Show a confirmation/close-call form. 2.
Display the furthest stage reached. 3. Ask for one final outcome from
the ten canonical values. 4. Show relevant next-step fields if
appropriate. 5. Allow the caller to confirm and save.

The close flow must not require the caller to visit Stage 8 first.

On successful close: - Set call status to `completed`. - Store final
outcome. - Store furthest stage reached. - Set `ended_at`. - Persist any
final next-step information. - Navigate to call history or a saved-call
confirmation/detail view.

If the caller cancels the close form, return to the active call without
losing unsaved input.

### 6.5 Call Details

Display: - Prospect and company information. - Call start/end times. -
Furthest stage reached. - Final outcome. - Each stage reached and its
saved result. - Prospect's words for each stage. - Extra structured
data, where present. - AI suggestions only if retained and useful.

Completed calls should be read-only in the MVP unless the project owner
explicitly requests editing.

## 7. Stage content data model

Keep stage content separate from individual call records. Use a
structured configuration file/module or database-managed content if
justified.

Each stage definition should support: - `stage_number` - `slug` -
`title` - `purpose` - `caller_guidance` - `prospect_examples` (array of
three concise examples) - `outcome_options` (array of value/label
pairs) - `extra_fields` (optional conditional fields) - `ai_enabled`
(boolean)

Use stable machine-readable slugs and values. Do not use display labels
as database identifiers.

The stage content should be easy to edit without rewriting the screen
components.

## 8. LLM feature specification

### 8.1 MVP feature: contextual response suggestion

**User action:** The caller selects "Suggest a response" during a stage,
ideally Stage 6.

**Input context:** - Current stage number and title. - Stage
purpose/guidance. - Selected stage-result option, if any. - Prospect's
actual words. - Prospect/company context if relevant and supplied.

**Expected output:** - One short suggested response that can be spoken
naturally. - Optionally one alternative phrasing. - Optional brief
rationale, if it does not clutter the interface.

**Requirements:** - The suggestion must be relevant to the current stage
and the prospect's words. - Keep it concise and conversational. - Do not
invent facts about the caller's company, prospect, product, case
studies, pricing, guarantees, or results. - Do not encourage pressure,
deception, or arguing. - Respect rejection and do-not-call requests. -
AI output is advisory; the caller chooses whether to use it. - Never
send or speak the suggestion automatically. - Show a loading state and
handle errors gracefully. - The caller must be able to continue the call
if the LLM is unavailable.

### 8.2 Optional feature: post-call summary

Only implement if the core application is stable and time remains.

Generate a short summary from saved stage notes: - Prospect's stated
need/goal. - Main objection or concern. - Agreed next action. -
Important context.

The original prospect words must remain unchanged and accessible. Label
the summary as AI-generated. Do not fabricate missing information.

### 8.3 LLM provider and secrets

The provider may be selected during implementation based on available
API access/free quota. Keep the provider behind a backend service/module
so it can be changed without altering frontend components.

-   Store API keys only in Render/backend environment variables.
-   Never expose LLM keys in frontend code or `NEXT_PUBLIC_` variables.
-   Do not commit secrets to Git.
-   Add request timeout and error handling.
-   Avoid sending unnecessary personal or sensitive data to the LLM.

## 9. Database specification --- Supabase PostgreSQL

Use UUID primary keys and timestamps. Use foreign keys and appropriate
indexes. Use migrations or documented SQL so the schema can be
recreated.

### 9.1 `calls`

One row per call.

  -----------------------------------------------------------------------
  Column                  Type                    Rules / meaning
  ----------------------- ----------------------- -----------------------
  `id`                    UUID                    Primary key, generated

  `prospect_name`         TEXT                    Required

  `company_name`          TEXT                    Required

  `prospect_role`         TEXT                    Nullable

  `current_stage`         SMALLINT                Furthest stage reached,
                                                  1--8

  `outcome`               TEXT                    Nullable while in
                                                  progress; canonical
                                                  outcome on close

  `status`                TEXT                    `in_progress` or
                                                  `completed`

  `started_at`            TIMESTAMPTZ             Required

  `ended_at`              TIMESTAMPTZ             Nullable until close

  `created_at`            TIMESTAMPTZ             Default now

  `updated_at`            TIMESTAMPTZ             Updated on mutation

  `next_step_data`        JSONB                   Optional agreed action
                                                  details
  -----------------------------------------------------------------------

Suggested constraints: - `current_stage BETWEEN 1 AND 8` -
`status IN ('in_progress', 'completed')` - `outcome` must be null or one
of the ten canonical values. - Completed calls should have an `ended_at`
and final outcome. If `not_logged` is selected, it is still an explicit
recorded outcome value.

### 9.2 `call_stage_results`

One row per call per stage.

  Column               Type          Rules / meaning
  -------------------- ------------- -------------------------------------------
  `id`                 UUID          Primary key
  `call_id`            UUID          Foreign key to `calls.id`, cascade delete
  `stage_number`       SMALLINT      1--8
  `selected_outcome`   TEXT          Nullable if caller saved notes only
  `prospect_words`     TEXT          Nullable; preserve verbatim
  `extra_data`         JSONB         Optional callback/channel/referral fields
  `created_at`         TIMESTAMPTZ   Default now
  `updated_at`         TIMESTAMPTZ   Updated on mutation

Constraints: - `stage_number BETWEEN 1 AND 8` - Unique constraint on
`(call_id, stage_number)` so revisiting a stage updates its existing
record. - Index on `call_id`.

### 9.3 `call_ai_suggestions` (optional)

  Column           Type          Meaning
  ---------------- ------------- ----------------------------------
  `id`             UUID          Primary key
  `call_id`        UUID          Foreign key to calls
  `stage_number`   SMALLINT      Stage at time of suggestion
  `input_text`     TEXT          Prospect words/context submitted
  `suggestion`     TEXT          Generated response
  `created_at`     TIMESTAMPTZ   Generation time

This table is optional. Do not delay core functionality to implement AI
audit history.

### 9.4 Security

-   Supabase service-role credentials must only be used on the backend.
-   Never put the service-role key in frontend code.
-   The frontend should communicate with the backend API, not use
    privileged database access directly.
-   Configure CORS for the deployed frontend origin.
-   If authentication is not implemented in the MVP, document that the
    demo is a single-user/demo environment and do not expose privileged
    database keys.
-   Add basic input validation and reasonable request-size limits.

## 10. Backend API specification --- Render

Use REST JSON endpoints. Return consistent response structures and
appropriate HTTP status codes. Validate all inputs server-side.

Base path may be `/api`; health endpoint is `/health`.

### 10.1 Start call

`POST /api/calls`

Request:

``` json
{
  "prospect_name": "Rahul Sharma",
  "company_name": "ABC Industries",
  "prospect_role": "Managing Director"
}
```

Behaviour: - Validate required fields. - Create call with
`current_stage = 1`, `status = "in_progress"`, and `started_at`. -
Return created call and ID.

Example response:

``` json
{
  "success": true,
  "call": {
    "id": "generated-uuid",
    "current_stage": 1,
    "status": "in_progress"
  }
}
```

### 10.2 Get call details / resume call

Recommended additional endpoint:

`GET /api/calls/{call_id}`

Return the call record and all saved stage results. This supports
browser refresh, active-call recovery, and call-detail view.

### 10.3 Save a stage result

`PUT /api/calls/{call_id}/stages/{stage_number}`

Request:

``` json
{
  "selected_outcome": "permission_granted",
  "prospect_words": "Yes, go ahead.",
  "extra_data": {}
}
```

Behaviour: - Confirm call exists and is in progress. - Validate stage
number 1--8. - Upsert by `(call_id, stage_number)`. - Update the call's
`current_stage` to the maximum stage reached, not simply the most
recently visited stage. - Return the saved stage result and updated call
progress.

### 10.4 Close a call

`POST /api/calls/{call_id}/close`

Request:

``` json
{
  "outcome": "next_step_agreed",
  "last_stage_reached": 7,
  "next_step_data": {
    "type": "meeting",
    "date": "2026-11-17",
    "time": "14:00"
  }
}
```

Behaviour: - Validate outcome against canonical values. - Validate last
stage is 1--8. - Save furthest stage reached and outcome. - Set status
to `completed`. - Set `ended_at`. - Save next-step data if provided. -
Prevent accidental duplicate closure or return the already completed
record safely.

The backend should not trust the frontend's claimed furthest stage
blindly. Reconcile it with persisted stage activity and validate that
the value is in range. If a caller has reached a stage without a
stage-result row, the product may still record that stage as reached; do
not falsely require all earlier stages to be completed.

### 10.5 List calls

`GET /api/calls`

Optional query parameters: - `search` - `outcome` - `status` - `page` -
`limit`

Behaviour: - Sort newest first. - Return prospect/company, timestamps,
current/furthest stage, status, and final outcome. - Use pagination if
needed. - Validate query parameters.

### 10.6 Health check

`GET /health`

Return service status and database connectivity status. Example:

``` json
{
  "status": "ok",
  "database": "connected"
}
```

If the database is unavailable, return an appropriate unhealthy status
and non-200 response where suitable. Do not report database connected
merely because the API process is running.

### 10.7 AI response suggestion

`POST /api/ai/suggest-response`

Request:

``` json
{
  "stage_number": 6,
  "selected_outcome": "existing_provider_or_team",
  "prospect_words": "We already have an internal team.",
  "prospect_name": "Rahul Sharma",
  "company_name": "ABC Industries"
}
```

Response:

``` json
{
  "success": true,
  "suggestion": "That makes sense. Could you share whether there are any specific areas where your team would value an outside perspective?"
}
```

The endpoint must validate input, call the configured LLM provider,
handle timeouts/errors, and return a safe, concise suggestion.

## 11. Frontend/backend architecture

Recommended stack:

  Layer              Technology
  ------------------ -----------------------------------------
  Frontend           Next.js + TypeScript
  Styling            Tailwind CSS
  UI primitives      shadcn/ui where useful
  Backend            Python + FastAPI
  Database           Supabase PostgreSQL
  Hosting frontend   Vercel
  Hosting backend    Render
  LLM                Provider selected during implementation

Recommended repository structure (adapt if there is a good reason, but
keep frontend/backend separated):

``` text
caller guide/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── types/
│   └── ...
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── ...
│   ├── tests/
│   └── requirements.txt
├── docs/
│   └── PRODUCT_SPEC.md
├── README.md
└── .gitignore
```

If the repository is already initialized or a different structure is
already present, inspect it before changing anything. Do not overwrite
existing work without asking.

### Frontend responsibilities

-   Render stage content from structured configuration.
-   Manage transient UI state.
-   Call backend APIs for persistence.
-   Show loading, success, empty, and error states.
-   Restore an active call using its ID and backend data.
-   Never contain database service-role credentials or LLM secrets.

### Backend responsibilities

-   Validate and process API requests.
-   Read/write Supabase data.
-   Enforce call/stage/outcome rules.
-   Provide call history and detail data.
-   Integrate the LLM provider securely.
-   Return predictable error responses.

## 12. UX and visual design direction

### Overall direction

Professional, calm, minimal B2B SaaS. The product is a practical work
surface, not a marketing website.

### Visual system

-   Background: very light neutral grey.
-   Cards/surfaces: white.
-   Primary colour: blue/indigo.
-   Success: green.
-   Warning: amber.
-   Typography: Inter or a similarly readable sans-serif.
-   Border radius: approximately 10--12px.
-   Clear contrast and readable font sizes.
-   Consistent spacing and button styles.

### Interaction principles

-   Desktop-first, responsive for smaller screens.
-   Make current stage immediately obvious.
-   Keep stage purpose and likely prospect responses visible.
-   Use large, easy-to-select stage outcome controls.
-   Avoid dense paragraphs and excessive decoration.
-   Keep End Call accessible.
-   Minimise typing during a live conversation.
-   Use clear labels, not icon-only controls for important actions.
-   Provide visible save/loading/error feedback.
-   Avoid animations that slow down or distract the caller.

Do not copy the reference screen pixel-for-pixel. Use it to understand
the information hierarchy and interaction pattern, then create an
original design.

## 13. Persistence, recovery, and edge cases

These behaviours are mandatory:

  -----------------------------------------------------------------------
  Scenario                            Expected behaviour
  ----------------------------------- -----------------------------------
  Caller moves to next stage          Save current stage before
                                      navigation

  Caller revisits a stage             Load saved result and prospect
                                      words

  Caller changes a saved selection    Update the existing stage result

  Caller ends at any stage            Open close-call flow immediately

  Caller refreshes browser            Recover active call using saved
                                      call ID and backend data

  AI provider fails                   Show a helpful error; manual
                                      calling workflow remains usable

  Database/API fails to save          Clearly show save failure and offer
                                      retry; do not claim success

  Call already completed              Treat it as read-only in MVP

  Prospect says do not call           Record `do_not_call`; do not
                                      suggest overcoming it

  Callback time is unclear            Save only what was actually said;
                                      do not invent a time

  Stage result is not selected        Allow urgent call closure; make
                                      missing capture clear

  Call ends before Stage 8            Save furthest stage reached
                                      separately from final outcome
  -----------------------------------------------------------------------

Do not display "Saved" until the backend confirms successful
persistence.

For browser recovery, local/session storage may retain the active call
ID, but Supabase/backend data is authoritative. Avoid storing
unnecessary prospect notes in browser storage.

## 14. MVP scope and priorities

### P0 --- Must work for submission

-   Start call with prospect details.
-   Active Call screen with all eight stages.
-   Stage-specific purpose/guidance.
-   Three prospect response examples per stage (after content
    validation).
-   Four selectable stage-result options per stage (initial set defined
    above).
-   Prospect words field at every stage.
-   Save/update stage results.
-   Previous/next stage navigation.
-   End call from any stage.
-   Ten final call outcome options.
-   Persist calls and stage results in Supabase.
-   Call History listing calls and furthest stage reached.
-   Call detail view.
-   Required backend endpoints and health check.
-   One real LLM-powered response suggestion.
-   Deploy frontend to Vercel and backend to Render.
-   Verify deployed app end-to-end.

### P1 --- Implement if time permits after P0 is stable

-   AI-generated post-call summary.
-   Search and outcome filters.
-   Callback date/time controls.
-   Basic accurate summary metrics.
-   AI suggestion history.

### Out of scope for MVP

-   Automatic phone dialling.
-   Call recording.
-   Live speech-to-text or transcription.
-   Automatic stage detection from audio.
-   Multi-user organisation/team management.
-   Full CRM functionality.
-   Sales forecasting.
-   Complex role-based permissions.

Do not start P1 or out-of-scope features while P0 workflows are
incomplete.

## 15. Acceptance criteria / definition of done

The MVP is ready for submission when all of the following can be
demonstrated:

### Call workflow

-   [ ] Start a new call with prospect name and company.
-   [ ] Prospect role is optional.
-   [ ] All eight stages are accessible and in the correct order.
-   [ ] Each stage shows its title, purpose, guidance, and prospect
    examples.
-   [ ] Each stage has selectable result options.
-   [ ] Prospect words can be entered and saved.
-   [ ] Next Stage persists the current stage before moving.
-   [ ] Previous Stage loads previously saved information.
-   [ ] Revisiting a stage does not create duplicate stage-result
    records.
-   [ ] Call can be ended from Stage 1.
-   [ ] Call can be ended from Stage 6.
-   [ ] Final outcome is independent of stage result.
-   [ ] All ten final outcomes are selectable.
-   [ ] Completed call is saved with timestamps and furthest stage
    reached.

### History and recovery

-   [ ] Completed calls appear in Call History.
-   [ ] History shows prospect, company, date, furthest stage, and
    outcome.
-   [ ] A past call can be opened and reviewed.
-   [ ] An in-progress call can be resumed.
-   [ ] Refreshing the browser does not lose persisted call data.
-   [ ] Completed calls are read-only in MVP.

### AI

-   [ ] AI response suggestion calls a real backend LLM integration.
-   [ ] Suggestion uses current stage and prospect words.
-   [ ] AI output is concise and optional.
-   [ ] AI errors do not block the call workflow.
-   [ ] API key is not exposed in frontend bundle or repository.

### Infrastructure

-   [ ] Supabase records are visible and correct.
-   [ ] Backend runs on Render.
-   [ ] `/health` reports database connectivity.
-   [ ] Frontend runs on Vercel.
-   [ ] Production frontend can communicate with production backend.
-   [ ] CORS and environment variables are configured.
-   [ ] No secrets are committed to Git.
-   [ ] README explains local setup and deployment configuration.

## 16. Deployment and environment variables

Use environment variables; do not hardcode credentials.

### Frontend

Example:

``` env
NEXT_PUBLIC_API_BASE_URL=https://<render-service-domain>
```

Only values safe for browser exposure may use the `NEXT_PUBLIC_` prefix.

### Backend

Example:

``` env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LLM_API_KEY=
LLM_MODEL=
FRONTEND_ORIGIN=
```

Use the exact variable names expected by the implementation. Keep `.env`
files out of Git and provide a `.env.example` containing placeholders
only.

### Deployment checks

-   Render service starts successfully.
-   Supabase connection works from Render.
-   Render health endpoint works after cold start.
-   Vercel frontend uses the production Render URL.
-   CORS allows the deployed Vercel origin.
-   LLM key is configured only on Render.
-   Test the complete workflow using the deployed URLs, not only
    localhost.

## 17. Testing strategy

At minimum, test these paths:

1.  **Successful call:** Start → move through stages → save notes →
    close as `next_step_agreed` → verify in history.
2.  **Early rejection:** Start → Stage 2 → end as `not_interested` →
    verify furthest stage is 2.
3.  **Do-not-call:** End from any stage as `do_not_call`; verify it is
    recorded exactly.
4.  **Callback:** Record a callback request and explicit date/time if
    supplied.
5.  **Revisit stage:** Save Stage 3, navigate away, return, edit, and
    verify one row is updated.
6.  **Refresh recovery:** Start a call, save a stage, refresh, and
    resume the same call.
7.  **LLM failure:** Simulate missing/invalid LLM configuration and
    verify the call workflow remains usable.
8.  **Database failure:** Verify the UI does not claim a save succeeded
    when the API/database fails.
9.  **History:** Verify completed and in-progress calls display correct
    status and furthest stage.
10. **Production smoke test:** Repeat the core flow using Vercel +
    Render + Supabase.

## 18. Build strategy for the coding agent

Build incrementally. Do not attempt to generate the entire application
in one prompt.

Recommended implementation sequence: 1. Inspect workspace and create a
concise implementation plan. 2. Scaffold frontend and backend with clear
separation. 3. Implement design tokens, app shell, and navigation. 4.
Implement stage configuration and Active Call UI using mock data. 5.
Implement Dashboard/Call History and Call Details UI using mock data. 6.
Implement Supabase schema and backend call endpoints. 7. Connect
frontend persistence and recovery. 8. Implement LLM response suggestion.
9. Add tests, error states, and production configuration. 10. Deploy and
run end-to-end smoke tests.

At the end of each task: - Summarise files created/changed. - Explain
how to run/test the work. - List known issues or incomplete
requirements. - Do not claim functionality is complete unless it has
been run and verified. - Do not silently modify this product
specification.

## 19. Product quality bar

The finished product should feel like a focused, usable tool a
salesperson could realistically keep open during a cold call.

The most important success measure is not the number of features. It is
whether a caller can: 1. See what stage they are in. 2. Understand what
they should achieve. 3. Anticipate likely prospect responses. 4. Record
what actually happened with minimal effort. 5. Get a useful optional AI
suggestion. 6. End the call at any point. 7. Trust that the call record
has been saved.

**Build for that experience first.**
