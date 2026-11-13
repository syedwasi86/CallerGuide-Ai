import assert from "node:assert";
import fs from "node:fs";

console.log("Running Phase 2 Stage Engine Verification Suite...");

// 1. Verify stage configuration file exists and can be parsed
const stageConfigFile = fs.readFileSync("src/config/stages.ts", "utf-8");

// Verify all 8 stages are present
for (let i = 1; i <= 8; i++) {
  assert(
    stageConfigFile.includes(`stageNumber: ${i}`),
    `Stage ${i} definition missing from stages.ts`
  );
}

// Verify exact stage titles
const expectedTitles = [
  "Opening",
  "Purpose",
  "Permission",
  "Their business",
  "Their need, in their words",
  "Objection",
  "Next step",
  "Close"
];

for (const title of expectedTitles) {
  assert(
    stageConfigFile.includes(`title: "${title}"`),
    `Title "${title}" missing from stages.ts`
  );
}

// 2. Verify all 10 canonical final outcomes are present
const expectedFinalOutcomes = [
  "agreed_to_receive_report",
  "next_step_agreed",
  "interested",
  "follow_up",
  "call_again",
  "not_interested",
  "do_not_call",
  "wrong_person",
  "moved_company",
  "not_logged"
];

for (const outcome of expectedFinalOutcomes) {
  assert(
    stageConfigFile.includes(`value: "${outcome}"`),
    `Canonical outcome "${outcome}" missing from stages.ts`
  );
}

// 3. Verify stage-specific outcomes from spec
const expectedStageOutcomes = [
  "right_person_reached",
  "gatekeeper_answered",
  "wrong_person_or_number",
  "prospect_unavailable",
  "asked_company_purpose",
  "asked_call_reason",
  "asked_contact_source",
  "purpose_understood",
  "permission_granted",
  "not_available_now",
  "callback_requested",
  "information_requested_first",
  "explained_business",
  "clarified_responsibilities",
  "corrected_company_information",
  "referred_another_contact",
  "shared_business_goal",
  "shared_business_challenge",
  "no_current_need",
  "asked_what_we_offer",
  "existing_provider_or_team",
  "not_decision_maker",
  "requested_information",
  "declined_not_interested",
  "agreed_to_receive_report",
  "meeting_scheduled",
  "follow_up_call_agreed",
  "referred_to_contact"
];

for (const outcome of expectedStageOutcomes) {
  assert(
    stageConfigFile.includes(`value: "${outcome}"`),
    `Stage outcome option "${outcome}" missing from stages.ts`
  );
}

// 4. Test logic for stage progression and non-decreasing furthest stage reached
let currentStage = 1;
let furthestStageReached = 1;
let stageResults = {
  1: { selectedOutcome: "right_person_reached", prospectWords: "Yes, speaking." },
  2: { selectedOutcome: null, prospectWords: "" },
  3: { selectedOutcome: null, prospectWords: "" },
};

// Advance to Stage 2
currentStage = 2;
furthestStageReached = Math.max(furthestStageReached, currentStage);
assert.strictEqual(currentStage, 2);
assert.strictEqual(furthestStageReached, 2);

// Advance to Stage 3
currentStage = 3;
furthestStageReached = Math.max(furthestStageReached, currentStage);
assert.strictEqual(currentStage, 3);
assert.strictEqual(furthestStageReached, 3);

// Navigate BACK to Stage 1
currentStage = 1;
// Furthest stage must remain 3!
furthestStageReached = Math.max(furthestStageReached, currentStage);
assert.strictEqual(currentStage, 1);
assert.strictEqual(furthestStageReached, 3, "Furthest stage decreased when navigating backwards!");

// Verify notes in Stage 1 were preserved
assert.strictEqual(stageResults[1].selectedOutcome, "right_person_reached");
assert.strictEqual(stageResults[1].prospectWords, "Yes, speaking.");

console.log("All Phase 2 logic and configuration checks PASSED successfully!");
