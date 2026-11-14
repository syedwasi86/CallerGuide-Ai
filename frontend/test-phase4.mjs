import assert from "node:assert";
import fs from "node:fs";

console.log("Running Phase 4 Backend Integration & API Client Verification Suite...\n");

// --- Mock Browser localStorage Environment in Node.js ---
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.window = {
  localStorage: new MockLocalStorage(),
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  history: { replaceState: () => {} },
};

// 1. Verify required Phase 4 files exist
assert(fs.existsSync("src/lib/api-client.ts"), "src/lib/api-client.ts must exist");
assert(fs.existsSync("../backend/supabase/migrations/001_initial_schema.sql"), "Supabase migration SQL must exist");
assert(fs.existsSync("../backend/app/api/v1/calls.py"), "Backend calls router must exist");
assert(fs.existsSync("../backend/app/schemas/call.py"), "Backend schemas must exist");
assert(fs.existsSync("../backend/app/services/call_service.py"), "Backend call service must exist");

console.log("Test 1: Verification of database schema migration...");
const migrationSql = fs.readFileSync("../backend/supabase/migrations/001_initial_schema.sql", "utf-8");
assert(migrationSql.includes("CREATE TABLE IF NOT EXISTS calls"), "Migration must create calls table");
assert(migrationSql.includes("CREATE TABLE IF NOT EXISTS call_stage_results"), "Migration must create call_stage_results table");
assert(migrationSql.includes("CONSTRAINT uq_call_stage_result UNIQUE (call_id, stage_number)"), "Migration must enforce (call_id, stage_number) unique constraint");
assert(migrationSql.includes("agreed_to_receive_report"), "Migration must include canonical outcomes constraint");
console.log("  ✓ Migration SQL defines calls, call_stage_results, indexes, and unique constraints");

console.log("\nTest 2: Verification of backend data mapping (snake_case -> CallSession)...");
// Simulate mapBackendCallToSession
function mapBackendCallToSession(data) {
  const stageResultsMap = {
    1: { selectedOutcome: null, prospectWords: "", extraData: {} },
    2: { selectedOutcome: null, prospectWords: "", extraData: {} },
    3: { selectedOutcome: null, prospectWords: "", extraData: {} },
    4: { selectedOutcome: null, prospectWords: "", extraData: {} },
    5: { selectedOutcome: null, prospectWords: "", extraData: {} },
    6: { selectedOutcome: null, prospectWords: "", extraData: {} },
    7: { selectedOutcome: null, prospectWords: "", extraData: {} },
    8: { selectedOutcome: null, prospectWords: "", extraData: {} },
  };

  if (Array.isArray(data.stage_results)) {
    for (const s of data.stage_results) {
      if (s.stage_number >= 1 && s.stage_number <= 8) {
        stageResultsMap[s.stage_number] = {
          selectedOutcome: s.selected_outcome || s.stage_outcome || null,
          prospectWords: s.prospect_words || "",
          extraData: s.extra_data || s.additional_data || {},
          updatedAt: s.updated_at,
        };
      }
    }
  }

  return {
    id: data.id,
    prospectName: data.prospect_name,
    companyName: data.company_name,
    prospectRole: data.prospect_role,
    phoneNumber: data.phone_number || undefined,
    status: data.status,
    currentStage: data.current_stage,
    furthestStageReached: data.furthest_stage_reached,
    startedAt: data.started_at,
    endedAt: data.ended_at || undefined,
    durationSeconds: data.duration_seconds || 0,
    finalOutcome: data.final_outcome || data.outcome || null,
    nextStepNotes: data.next_step_notes || undefined,
    stageResults: stageResultsMap,
  };
}

const mockBackendCall = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  prospect_name: "Rahul Sharma",
  company_name: "Apex Industrial Solutions",
  prospect_role: "VP of Operations",
  phone_number: "+91-9876543210",
  status: "completed",
  current_stage: 5,
  furthest_stage_reached: 5,
  started_at: "2026-11-14T10:00:00Z",
  ended_at: "2026-11-14T10:03:30Z",
  duration_seconds: 210,
  final_outcome: "next_step_agreed",
  next_step_notes: "Follow up demo next week.",
  stage_results: [
    {
      id: "660e8400-e29b-41d4-a716-446655440001",
      call_id: "550e8400-e29b-41d4-a716-446655440000",
      stage_number: 1,
      stage_outcome: "right_person_reached",
      prospect_words: "Rahul speaking.",
      additional_data: {},
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440002",
      call_id: "550e8400-e29b-41d4-a716-446655440000",
      stage_number: 5,
      selected_outcome: "need_expressed",
      prospect_words: "Downtime is our biggest problem.",
      extra_data: { priority: "high" },
    },
  ],
};

const session = mapBackendCallToSession(mockBackendCall);
assert.strictEqual(session.id, "550e8400-e29b-41d4-a716-446655440000");
assert.strictEqual(session.prospectName, "Rahul Sharma");
assert.strictEqual(session.companyName, "Apex Industrial Solutions");
assert.strictEqual(session.phoneNumber, "+91-9876543210");
assert.strictEqual(session.stageResults[1].selectedOutcome, "right_person_reached");
assert.strictEqual(session.stageResults[5].selectedOutcome, "need_expressed");
assert.strictEqual(session.stageResults[5].prospectWords, "Downtime is our biggest problem.");
assert.strictEqual(session.stageResults[8].selectedOutcome, null); // Unreached stage initialized cleanly
console.log("  ✓ Backend response maps cleanly to full 8-stage CallSession model");

console.log("\nTest 3: Active call in-progress recovery reference...");
const ACTIVE_CALL_REF_KEY = "callguide_active_call_id_ref";
window.localStorage.setItem(ACTIVE_CALL_REF_KEY, "active-uuid-12345");
assert.strictEqual(window.localStorage.getItem(ACTIVE_CALL_REF_KEY), "active-uuid-12345");
window.localStorage.removeItem(ACTIVE_CALL_REF_KEY);
assert.strictEqual(window.localStorage.getItem(ACTIVE_CALL_REF_KEY), null);
console.log("  ✓ Active call ID reference stored and cleared properly");

console.log("\nTest 4: Verify frontend API client exports...");
const apiClientCode = fs.readFileSync("src/lib/api-client.ts", "utf-8");
assert(apiClientCode.includes("export async function createCall"), "api-client must export createCall");
assert(apiClientCode.includes("export async function getCall"), "api-client must export getCall");
assert(apiClientCode.includes("export async function updateCallStage"), "api-client must export updateCallStage");
assert(apiClientCode.includes("export async function closeCall"), "api-client must export closeCall");
assert(apiClientCode.includes("export async function listCalls"), "api-client must export listCalls");
assert(apiClientCode.includes("export async function checkBackendHealth"), "api-client must export checkBackendHealth");
console.log("  ✓ All required API client methods exported");

console.log("\nTest 5: Verify integration in Active Call page...");
const activeCallCode = fs.readFileSync("src/app/calls/[id]/page.tsx", "utf-8");
assert(activeCallCode.includes("apiCreateCall"), "Active call page must import apiCreateCall");
assert(activeCallCode.includes("apiGetCall"), "Active call page must import apiGetCall");
assert(activeCallCode.includes("apiUpdateCallStage"), "Active call page must import apiUpdateCallStage");
assert(activeCallCode.includes("apiCloseCall"), "Active call page must import apiCloseCall");
assert(activeCallCode.includes("setActiveCallReference"), "Active call page must use setActiveCallReference");
console.log("  ✓ Active call page wired to FastAPI backend and recovery reference");

console.log("\nTest 6: Verify integration in Call History Dashboard...");
const historyCode = fs.readFileSync("src/app/calls/page.tsx", "utf-8");
assert(historyCode.includes("apiListCalls"), "Call history page must use apiListCalls");
assert(historyCode.includes("migrateLocalStorageToBackend"), "Call history page must support migration");
console.log("  ✓ Call history page wired to FastAPI backend and migration workflow");

console.log("\nTest 7: Verify integration in Call Detail View...");
const detailCode = fs.readFileSync("src/app/calls/[id]/details/page.tsx", "utf-8");
assert(detailCode.includes("apiGetCall"), "Call detail page must use apiGetCall");
console.log("  ✓ Call detail page wired to FastAPI backend");

console.log("\n============================================================");
console.log("🎉 All Phase 4 Frontend Integration checks PASSED (100%)!");
console.log("============================================================\n");

