import { FinalOutcome, StageConfig } from "@/types";

/**
 * 8-Stage Cold-Call Methodology Configuration
 * Source of truth: doc/PRODUCT_SPEC.md Sections 5 & 7
 *
 * NOTE ON PROSPECT EXAMPLES:
 * These examples are initial draft proposals from the specification.
 * The 100-transcript archive dataset validation is pending.
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
      { quote: "Who is calling?", isDraft: true },
      { quote: "What is this regarding?", isDraft: true },
      { quote: "I'm in a meeting. Can you call later?", isDraft: true },
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
      { quote: "What exactly does your company do?", isDraft: true },
      { quote: "Where did you get my number?", isDraft: true },
      { quote: "Is this a sales call?", isDraft: true },
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
      { quote: "Yes, go ahead.", isDraft: true },
      { quote: "Call me after two.", isDraft: true },
      { quote: "Send it on WhatsApp first.", isDraft: true },
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
      { quote: "We manufacture industrial equipment.", isDraft: true },
      { quote: "I handle operations, not business development.", isDraft: true },
      { quote: "Tell me about your company first.", isDraft: true },
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
      { quote: "We are looking to enter new markets.", isDraft: true },
      { quote: "Our plant is operating below capacity.", isDraft: true },
      { quote: "Everything is going fine. We don't have any particular need.", isDraft: true },
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
      { quote: "We already have a consultant.", isDraft: true },
      { quote: "We have an internal team handling this.", isDraft: true },
      { quote: "Send something in writing first.", isDraft: true },
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
      { quote: "Send me the report on WhatsApp.", isDraft: true },
      { quote: "Call me next Tuesday afternoon.", isDraft: true },
      { quote: "You can speak to our director.", isDraft: true },
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
      { quote: "Okay, send it across.", isDraft: true },
      { quote: "Let's connect next week.", isDraft: true },
      { quote: "Thank you, but we aren't interested.", isDraft: true },
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

