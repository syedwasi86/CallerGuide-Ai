# 100 Cold-Call Transcripts Dataset Analysis Report

## 1. Executive Summary & Dataset Overview

This report documents the systematic analysis of the 100 real-world B2B cold-call transcripts provided for **CallGuide AI** (`T001` through `T100`).

- **Total Transcripts Processed:** 100 calls (100% of dataset).
- **Transcript ID Range:** `T001` through `T100`.
- **Dataset Location:** `data/cold-call-transcripts-100/` and `cold-call-transcripts-100/cold-call-transcripts-100/`.
- **Calling Organisation:** Fictionalized as *Meridian Growth Partners* (Hyderabad, India).
- **Target Audience:** Founders, CEOs, Managing Directors, Operations Directors, and Senior Executives across Indian private enterprises, multinationals, and listed companies.
- **Languages Observed:** Primarily Indian Business English, with frequent code-switching into Hindi, Hinglish, Marathi (`T037`, `T057`), and occasional queries in Devanagari Hindi (`T031`).
- **Call Lengths:**
  - **Minimum:** 30 seconds (`T045`)
  - **Average:** 135.6 seconds (~2.25 minutes)
  - **Maximum:** 687 seconds (~11.45 minutes, `T097`)
- **Total Conversation Turns:** 1,935 recorded turns (947 prospect turns, 988 caller turns).

---

## 2. Outcome Distribution Across Transcripts

The callers recorded outcomes matching the ten canonical outcomes defined in `doc/PRODUCT_SPEC.md`:

| Logged Final Outcome | Count | % of Dataset | Behavioral Meaning in Dataset |
|---|---|---|---|
| `not_interested` | 14 | 14% | Prospect explicitly declined or said this is not relevant. |
| `agreed_to_receive_report` | 14 | 14% | Prospect agreed to receive an introductory overview via WhatsApp or email. |
| `follow_up` | 14 | 14% | Caller or prospect agreed to reconnect at an unspecified later date. |
| `not_logged` | 13 | 13% | Call ended abruptly or caller did not log an outcome. |
| `next_step_agreed` | 11 | 11% | A concrete appointment, Google Meet, or timed follow-up was booked. |
| `do_not_call` | 10 | 10% | Prospect firmly requested not to be contacted or caller judged it so. |
| `wrong_person` | 8 | 8% | Person reached was not the intended decision-maker or role. |
| `interested` | 7 | 7% | Soft interest expressed, but without a locked time or delivery channel. |
| `moved_company` | 5 | 5% | Contact no longer works at the listed firm. |
| `call_again` | 4 | 4% | Line dropped, audio inaudible, or prospect was driving / mid-meeting. |
| **Total** | **100** | **100%** | |

### Company Classification Breakdown
- **India arm of a multinational:** 30
- **Mid-size private company:** 22
- **Mid-size private manufacturer:** 20
- **Listed Indian company:** 10
- **Startup:** 8
- **Large private company:** 4
- **Public sector utility / Small private company / Other:** 6

---

## 3. Stage-by-Stage Transcript Findings

Cold calls rarely proceed in a linear lock-step sequence from Stage 1 to Stage 8. Rather, calls often jump forward, loop back when objections arise, or terminate early due to gatekeepers or lack of interest. Below are the empirical findings for each stage.

### Stage 1: Opening
- **Purpose:** Reach the intended individual and establish contact.
- **Observations:** In Indian B2B calling, prospects rarely answer with corporate formalities. They answer with terse greetings ("Haan ji?", "Hello", "Yes, tell me") or simply state their surname.
- **Key Verbatim Quotations:**
  - `[T003]` `"Yes, tell me."` (Terse direct acknowledgement when reached on personal cell phone)
  - `[T009]` `"Yeah. Rathi."` (Direct surname verification)
  - `[T035]` `"Yeah, who is this?"` (Immediate demand for identity before listening further)
  - `[T001]` `"Aha, Priya ji."` (Polite, familiar acknowledgement of previous correspondence)

### Stage 2: Purpose
- **Purpose:** Clarify who Meridian is and why they are calling.
- **Observations:** Prospects interrupt early if the caller rambles. The most common interruptions demand either the reason for the call or the source of their contact number.
- **Key Verbatim Quotations:**
  - `[T012]` `"I am sorry. What is this regarding?"` (Direct demand for purpose)
  - `[T063]` `"Where did you get my contact from?"` (Privacy / sourcing challenge)
  - `[T084]` `"What do you guys do?"` (Request for concise value proposition)
  - `[T094]` `"Pallavi, can you tell me, how is this going to help us? ... it's a kind of media company, or what?"` (Skepticism regarding business category)

### Stage 3: Permission
- **Purpose:** Gauge whether the prospect is willing and available to talk right now.
- **Observations:** Prospects either grant a rapid "Go ahead" or offer genuine time constraints (meetings, driving, client site visits). Silence or passive hums must not be assumed to be permission.
- **Key Verbatim Quotations:**
  - `[T001]` `"Ah, yes. Go ahead."` (Clear affirmative permission)
  - `[T003]` `"Haan, boliye."` (Standard conversational Hindi/Hinglish permission)
  - `[T033]` `"Actually, right now I'm in a meeting with a customer. So can I call you after?"` (Legitimate customer meeting constraint)
  - `[T027]` `"I am just getting into a school event. Can we speak at 1:30, Rohit?"` (Specific personal callback window)

### Stage 4: Their Business
- **Purpose:** Understand company scope, manufacturing footprint, and division of responsibility.
- **Observations:** Prospects frequently clarify their operational boundaries (e.g. Tier-1 supplier, contract manufacturer vs brand owner) or point out that they lead operations rather than corporate sales.
- **Key Verbatim Quotations:**
  - `[T008]` `"We do only manufacturing. We supply to Tier-1 OEMs."` (Upstream contract manufacturer context)
  - `[T044]` `"I handle operations, not corporate business development."` (Functional division clarification)
  - `[T059]` `"I'm no longer in Celera, by the way. Just wanted to let you know first."` (Moved company context)

### Stage 5: Their Need, in Their Words
- **Purpose:** Capture prospect's goals, pains, or operational realities in their exact verbatim words.
- **Observations:** This stage occurs in longer calls (e.g. `T001`, `T021`, `T081`, `T097`). When prospects open up, they speak about capacity utilisation, raw material commodity prices, and in-house execution. Conversely, several clearly state they have zero external needs.
- **Key Verbatim Quotations:**
  - `[T001]` `"Perhaps next week would be better. We would have a clearer idea of our products and where to push them."` (Upcoming product strategy review)
  - `[T097]` `"When you say growth ideas, it can be anything. For example, your commodity pricing has gone up, or people are moving from salty snacks or cola to other things... leadership is trying to solve that."` (Strategic margin and demand dynamics)
  - `[T021]` `"Hamara chal hi raha hai, par abhi woh sab internal hi. Hum log outsource nahi kar rahe kuch bhi."` (In-house capability; no outsourcing requirement)

### Stage 6: Objection
- **Purpose:** Identify and respectfully navigate concerns, hesitations, or resistance.
- **Observations:** Objections fall into distinct buckets (detailed in Section 4 below). Crucially, 10% of calls involve hard rejections or explicit do-not-contact requests where no objection-handling should be attempted.
- **Key Verbatim Quotations:**
  - `[T003]` `"No, no, no point ma'am. I am not the relevant person."` (Wrong functional stakeholder)
  - `[T020]` `"Uh, not really. I'm not interested in this at this point of time. Thank you for asking, though."` (Polite, firm disinterest)
  - `[T044]` `"All those decisions are taken somewhere else, at corporate in the US. Those decisions aren't taken here locally."` (Headquarters vs subsidiary boundary)
  - `[T053]` `"No, I don't have time for such work. You should call somebody else."` (Firm dismissal)

### Stage 7: Next Step
- **Purpose:** Agree on a concrete next action (what, channel, and when).
- **Observations:** In India B2B calls, WhatsApp is by far the most popular channel for initial documents, followed by email. High-intent calls lock in a specific weekday and time window (e.g., "Tuesday after 2 PM").
- **Key Verbatim Quotations:**
  - `[T001]` `"Tuesday is a good day. After 2 PM. Call us in the afternoon and then we can perhaps have a working session."` (Concrete time window and format)
  - `[T043]` `"You can share your company profile and things on my WhatsApp. This is my WhatsApp number."` (Document dispatch to personal WhatsApp)
  - `[T063]` `"Okay, that email ID we have, you can send it on that."` (Document dispatch to verified email)

### Stage 8: Close
- **Purpose:** Reconfirm next action and conclude courteously.
- **Observations:** Successful calls end with mutual commitments to review collateral. Rejections end with brief courtesies or regional-language exit requests.
- **Key Verbatim Quotations:**
  - `[T078]` `"We'll have a look at it and then we'll see if we can work together."` (Constructive forward-looking wrap-up)
  - `[T090]` `"Okay, no problem. Thank you for your time, and I'll wait for the report."` (Clear expectation of delivery)
  - `[T037]` `"Naka sir, punha naka pathvu."` (Marathi: *"Please do not send again."* - explicit do-not-call exit)

---

## 4. Common Objection Patterns

Analysis of all 100 calls reveals six dominant objection archetypes:

1. **Role / Decision-Maker Mismatch (`wrong_person`):**
   - *"I'm not the relevant person."* (`T003`)
   - *"Decisions are taken at corporate headquarters in the US, not locally."* (`T044`)
   - *"You can save your time by verifying which company and person it is."* (`T066`)
2. **Deflection via Document Request ("Send on WhatsApp/Email"):**
   - Used frequently as a polite brush-off or low-commitment screening mechanism (`T043`, `T055`, `T063`).
3. **Internal Handling / No Outsourcing Need:**
   - *"Hamara chal hi raha hai, par abhi woh sab internal hi. Hum log outsource nahi kar rahe kuch bhi."* (`T021`)
4. **Current Inconvenience / Bad Timing:**
   - Prospect is driving, in a board meeting, or on a factory line (`T027`, `T033`, `T048`).
5. **Contact Source Suspicion:**
   - *"Where did you get my number from?"* (`T063`, `T081`, `T084`).
6. **Firm Rejection & Do-Not-Call:**
   - *"Not interested at this point of time."* (`T020`)
   - *"Punha naka pathvu."* (`T037`)
   - *"I don't have time for such work."* (`T053`)

---

## 5. Limitations & Data Integrity Notes

1. **Speaker Label Swaps:** As noted in the dataset README, early transcript turns occasionally swapped `CALLER` and `PROSPECT`. In this analysis, surrounding context was verified for every quoted passage.
2. **Not All Stages Occur in All Calls:** 51 of the 100 calls ended before reaching Stage 5. Stages 1 through 3 are present in nearly all calls, while Stage 5 appears primarily in calls lasting over 120 seconds.
3. **Outcome Discrepancies:** In ~15% of transcripts, the logged outcome was more optimistic or pessimistic than the actual transcript dialogue (e.g. caller logged `follow_up` when the prospect gave a hard brush-off). The stage engine preserves caller objectivity by keeping the prospect's verbatim words distinct from outcome logging.
4. **Fictionalization:** All company names, personal names, and contact details were normalized and fictionalized by the dataset author (e.g., *Meridian Growth Partners*).
