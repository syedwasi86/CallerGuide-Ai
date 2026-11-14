import { FinalOutcome, StageConfig } from "@/types";

/**
 * 8-Stage Cold-Call Methodology Configuration
 * Source of truth: doc/PRODUCT_SPEC.md Sections 5 & 7
 *
 * PROSPECT EXAMPLES:
 * Grounded in empirical analysis of the 100 cold-call transcripts dataset
 * (T001 through T100, Meridian Growth Partners).
 */
export const STAGES_CONFIG: Record<number, StageConfig> = {
  1: {
    stageNumber: 1,
    slug: "opening",
    title: "Opening",
    purpose: "Reach the right person and introduce yourself.",
    callerGuidance: [
      "Confirm the prospect's identity where appropriate.",
      "Introduce yourself and your organisation concisely.",
      "Establish whether you have reached the right decision-maker or contact.",
      "Keep the opening brief, professional, and natural.",
    ],
    prospectExamples: [
      {
        quote: "Yes, tell me.",
        transcriptId: "T003",
        explanation: "Terse direct acknowledgement when reached on personal line.",
        isDraft: false,
      },
      {
        quote: "Yeah. Rathi.",
        transcriptId: "T009",
        explanation: "Direct confirmation of surname / identity without elaboration.",
        isDraft: false,
      },
      {
        quote: "Yeah, who is this?",
        transcriptId: "T035",
        explanation: "Immediate request for caller identification before committing to talk.",
        isDraft: false,
      },
    ],
    outcomeOptions: [
      { value: "right_person_reached", label: "Reached the right person" },
      { value: "gatekeeper_answered", label: "Receptionist / assistant answered" },
      { value: "wrong_person_or_number", label: "Wrong person or number" },
      { value: "prospect_unavailable", label: "Prospect unavailable" },
    ],
  },
  2: {
    stageNumber: 2,
    slug: "purpose",
    title: "Purpose",
    purpose: "Explain why you are calling in one or two clear, understandable sentences.",
    callerGuidance: [
      "State the primary reason for contacting this specific prospect or company.",
      "Avoid vague sales claims and long company corporate history.",
      "Explain the immediate relevance of the call without over-pitching.",
    ],
    prospectExamples: [
      {
        quote: "I am sorry. What is this regarding?",
        transcriptId: "T012",
        explanation: "Direct request to clarify call intention after initial introduction.",
        isDraft: false,
      },
      {
        quote: "Where did you get my contact from?",
        transcriptId: "T063",
        explanation: "Inquiring about phone number sourcing and contact origin.",
        isDraft: false,
      },
      {
        quote: "What do you guys do?",
        transcriptId: "T084",
        explanation: "Inquiring about core capabilities and business model.",
        isDraft: false,
      },
    ],
    outcomeOptions: [
      { value: "asked_company_purpose", label: "Asked what the company does" },
      { value: "asked_call_reason", label: "Asked why you are calling" },
      { value: "asked_contact_source", label: "Asked about contact source" },
      { value: "purpose_understood", label: "Understood the purpose" },
    ],
  },
  3: {
    stageNumber: 3,
    slug: "permission",
    title: "Permission",
    purpose: "Establish whether the prospect is willing and available to speak now.",
    callerGuidance: [
      "Seek a clear indication that the prospect is willing to continue right now.",
      "Respect time constraints and active work pressures.",
      "If unavailable, capture a precise callback request accurately.",
      "Never treat silence or an ambiguous grunt as permission.",
    ],
    prospectExamples: [
      {
        quote: "Ah, yes. Go ahead.",
        transcriptId: "T001",
        explanation: "Clear affirmative permission to proceed with brief overview.",
        isDraft: false,
      },
      {
        quote: "Haan, boliye.",
        transcriptId: "T003",
        explanation: "Natural Hindi/Hinglish affirmative permission to speak.",
        isDraft: false,
      },
      {
        quote: "Actually, right now I'm in a meeting with a customer. So can I call you after?",
        transcriptId: "T033",
        explanation: "Legitimate customer meeting conflict requesting a callback window.",
        isDraft: false,
      },
    ],
    outcomeOptions: [
      { value: "permission_granted", label: "Permission granted" },
      { value: "not_available_now", label: "Not available now" },
      { value: "callback_requested", label: "Requested callback" },
      { value: "information_requested_first", label: "Requested information first" },
    ],
  },
  4: {
    stageNumber: 4,
    slug: "their_business",
    title: "Their business",
    purpose: "Understand the prospect's business and their role/responsibilities.",
    callerGuidance: [
      "Ask concise questions about their operating context and responsibilities.",
      "Listen actively before attempting any positioning.",
      "Verify whether the prospect is the relevant decision-maker.",
      "Avoid turning the conversation into a rigid questionnaire.",
    ],
    prospectExamples: [
      {
        quote: "We do only manufacturing. We supply to Tier-1 OEMs.",
        transcriptId: "T008",
        explanation: "Defining operating scope as an upstream contract manufacturer.",
        isDraft: false,
      },
      {
        quote: "I handle operations, not corporate business development.",
        transcriptId: "T044",
        explanation: "Clarifying functional division boundaries versus corporate sales.",
        isDraft: false,
      },
      {
        quote: "I'm no longer in Celera, by the way. Just wanted to let you know first.",
        transcriptId: "T059",
        explanation: "Clarifying that prospect moved company or changed responsibilities.",
        isDraft: false,
      },
    ],
    outcomeOptions: [
      { value: "explained_business", label: "Explained their business" },
      { value: "clarified_responsibilities", label: "Clarified responsibilities" },
      { value: "corrected_company_information", label: "Corrected company info" },
      { value: "referred_another_contact", label: "Referred another person" },
    ],
  },
  5: {
    stageNumber: 5,
    slug: "their_need",
    title: "Their need, in their words",
    purpose: "Understand the prospect's goals, challenges, needs, or requirements, and capture their words accurately.",
    callerGuidance: [
      "Let the prospect describe their situation freely without interruption.",
      "Ask open-ended exploratory questions where appropriate.",
      "Capture the prospect's EXACT wording, not your own filtered interpretation.",
      "Do not force or fabricate a need if the prospect has none.",
    ],
    prospectExamples: [
      {
        quote: "Perhaps next week would be better. We would have a clearer idea of our products and where to push them.",
        transcriptId: "T001",
        explanation: "Articulating internal product pipeline review and go-to-market priorities.",
        isDraft: false,
      },
      {
        quote: "When you say growth ideas, it can be anything. For example, your commodity pricing has gone up, or people are moving from salty snacks or cola to other things... leadership is trying to solve that.",
        transcriptId: "T097",
        explanation: "Articulating raw material margin pressures and shifting customer demand.",
        isDraft: false,
      },
      {
        quote: "Hamara chal hi raha hai, par abhi woh sab internal hi. Hum log outsource nahi kar rahe kuch bhi.",
        transcriptId: "T021",
        explanation: "Stating in-house capabilities with no external outsourcing requirement.",
        isDraft: false,
      },
    ],
    outcomeOptions: [
      { value: "shared_business_goal", label: "Shared a business goal" },
      { value: "shared_business_challenge", label: "Shared a business challenge" },
      { value: "no_current_need", label: "No current need identified" },
      { value: "asked_what_we_offer", label: "Asked what we can offer" },
    ],
    hasProminentNotes: true,
  },
  6: {
    stageNumber: 6,
    slug: "objection",
    title: "Objection",
    purpose: "Understand and respond appropriately to a concern, hesitation, or objection.",
    callerGuidance: [
      "Listen patiently without becoming defensive or argumentative.",
      "Identify the underlying concern before formulating a response.",
      "Acknowledge the concern naturally with empathy.",
      "Offer a truthful, contextually relevant answer.",
      "Respect a firm rejection or do-not-contact request immediately.",
    ],
    prospectExamples: [
      {
        quote: "No, no, no point ma'am. I am not the relevant person.",
        transcriptId: "T003",
        explanation: "Objection based on functional role mismatch / wrong decision-maker.",
        isDraft: false,
      },
      {
        quote: "Uh, not really. I'm not interested in this at this point of time. Thank you for asking, though.",
        transcriptId: "T020",
        explanation: "Polite but firm disinterest without aggressive pushback.",
        isDraft: false,
      },
      {
        quote: "All those decisions are taken somewhere else, at corporate in the US. Those decisions aren't taken here locally.",
        transcriptId: "T044",
        explanation: "Objection highlighting subsidiary vs global headquarters decision authority.",
        isDraft: false,
      },
    ],
    outcomeOptions: [
      { value: "existing_provider_or_team", label: "Existing provider / internal team" },
      { value: "not_decision_maker", label: "Not the right decision-maker" },
      { value: "requested_information", label: "Requested information first" },
      { value: "declined_not_interested", label: "Declined / not interested" },
    ],
    hasAiFocus: true,
  },
  7: {
    stageNumber: 7,
    slug: "next_step",
    title: "Next step",
    purpose: "Agree on one concrete next action, including what will happen, through which channel, and when.",
    callerGuidance: [
      "Ask for a specific, realistic next commitment.",
      "Explicitly confirm the action, channel, and agreed timing.",
      "Distinguish polite soft interest from an actual commitment.",
      "Do not classify a report request as a booked meeting.",
    ],
    prospectExamples: [
      {
        quote: "Tuesday is a good day. After 2 PM. Call us in the afternoon and then we can perhaps have a working session.",
        transcriptId: "T001",
        explanation: "Concrete commitment to a specific weekday, time window, and meeting format.",
        isDraft: false,
      },
      {
        quote: "You can share your company profile and things on my WhatsApp. This is my WhatsApp number.",
        transcriptId: "T043",
        explanation: "Agreeing to receive overview materials on WhatsApp for initial review.",
        isDraft: false,
      },
      {
        quote: "Okay, that email ID we have, you can send it on that.",
        transcriptId: "T063",
        explanation: "Agreeing to receive document via existing recorded email address.",
        isDraft: false,
      },
    ],
    outcomeOptions: [
      { value: "agreed_to_receive_report", label: "Agreed to receive report" },
      { value: "meeting_scheduled", label: "Meeting scheduled" },
      { value: "follow_up_call_agreed", label: "Follow-up call agreed" },
      { value: "referred_to_contact", label: "Referred to another contact" },
    ],
  },
  8: {
    stageNumber: 8,
    slug: "close",
    title: "Close",
    purpose: "Confirm the agreed action, end the conversation politely, and record the final outcome.",
    callerGuidance: [
      "Recap the concrete next action if agreed.",
      "Thank the prospect warmly for their time.",
      "Record the genuine call outcome without inflating results.",
      "Never pressure for a positive outcome during wrap-up.",
    ],
    prospectExamples: [
      {
        quote: "We'll have a look at it and then we'll see if we can work together.",
        transcriptId: "T078",
        explanation: "Constructive wrap-up agreeing to review shared collateral before next contact.",
        isDraft: false,
      },
      {
        quote: "Okay, no problem. Thank you for your time, and I'll wait for the report.",
        transcriptId: "T090",
        explanation: "Polite mutual wrap-up setting expectation for report delivery.",
        isDraft: false,
      },
      {
        quote: "Naka sir, punha naka pathvu.",
        transcriptId: "T037",
        explanation: "Explicit regional language (Marathi) request not to send materials or call again (do_not_call).",
        isDraft: false,
      },
    ],
    outcomeOptions: [
      { value: "agreed_action_confirmed", label: "Confirmed agreed next action" },
      { value: "callback_time_noted", label: "Reconfirmed callback timing" },
      { value: "materials_destination_noted", label: "Captured delivery destination (WhatsApp/Email)" },
      { value: "polite_exit", label: "Polite wrap-up / prospect declined" },
    ],
  },
};

/**
 * 10 Canonical Final Call Outcomes
 * Preserved exactly from the dataset index & specification
 */
export const CANONICAL_OUTCOMES: {
  value: FinalOutcome;
  label: string;
  description: string;
  category: "positive" | "followup" | "negative" | "administrative";
}[] = [
  {
    value: "agreed_to_receive_report",
    label: "Agreed to receive report",
    description: "Prospect consented to review an introductory or custom report.",
    category: "positive",
  },
  {
    value: "next_step_agreed",
    label: "Next step agreed",
    description: "Concrete next business interaction or meeting was scheduled.",
    category: "positive",
  },
  {
    value: "interested",
    label: "Interested",
    description: "General positive interest expressed without a fixed date/time.",
    category: "positive",
  },
  {
    value: "follow_up",
    label: "Follow-up",
    description: "Prospect requested a follow-up conversation later.",
    category: "followup",
  },
  {
    value: "call_again",
    label: "Call again",
    description: "Call could not proceed; prospect explicitly invited a later call.",
    category: "followup",
  },
  {
    value: "not_interested",
    label: "Not interested",
    description: "Prospect explicitly declined the offering or proposition.",
    category: "negative",
  },
  {
    value: "do_not_call",
    label: "Do not call",
    description: "Prospect requested complete removal from contact lists.",
    category: "negative",
  },
  {
    value: "wrong_person",
    label: "Wrong person",
    description: "Contact is no longer in this role or never worked at company.",
    category: "administrative",
  },
  {
    value: "moved_company",
    label: "Moved company",
    description: "Prospect has moved on to a different organization.",
    category: "administrative",
  },
  {
    value: "not_logged",
    label: "Not logged",
    description: "Outcome was genuinely indeterminable or unrecorded.",
    category: "administrative",
  },
];

