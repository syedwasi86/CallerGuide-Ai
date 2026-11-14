import { CallSession, FinalOutcome, StageNumber } from "@/types";
import { CANONICAL_OUTCOMES, STAGES_CONFIG } from "@/config/stages";

export const STORAGE_KEY = "callguide_call_sessions_v1";
export const ACTIVE_CALL_REF_KEY = "callguide_active_call_id_ref";
export const MIGRATION_FLAG_KEY = "callguide_migration_completed_v1";

/**
 * Save in-progress call ID reference locally (reference only; actual data is in backend).
 */
export function setActiveCallReference(callId: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(ACTIVE_CALL_REF_KEY, callId);
  } catch (err) {
    console.error("Failed to set active call reference:", err);
  }
}

/**
 * Retrieve in-progress call ID reference for recovery after browser refresh.
 */
export function getActiveCallReference(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(ACTIVE_CALL_REF_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear in-progress call ID reference once completed or reset.
 */
export function clearActiveCallReference(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(ACTIVE_CALL_REF_KEY);
  } catch {}
}

/**
 * Retrieve all completed call sessions from localStorage.
 * Safe for SSR and resilient against corrupt data.
 */
export function getStoredCalls(): CallSession[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter valid sessions and sort newest first by startedAt / endedAt
    const validCalls = parsed.filter(
      (c): c is CallSession =>
        Boolean(c && typeof c === "object" && typeof c.id === "string")
    );

    return validCalls.sort((a, b) => {
      const timeA = new Date(a.endedAt || a.startedAt || 0).getTime();
      const timeB = new Date(b.endedAt || b.startedAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (err) {
    console.error("Failed to load calls from localStorage:", err);
    return [];
  }
}

let cachedRaw = "";
let cachedCalls: CallSession[] = [];

/**
 * Subscription helper for React's useSyncExternalStore.
 */
export function subscribeToCalls(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", callback);
  window.addEventListener("callguide-storage-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("callguide-storage-updated", callback);
  };
}

/**
 * Client snapshot for useSyncExternalStore.
 */
export function getCallsSnapshot(): CallSession[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY) || "";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedCalls = getStoredCalls();
  }
  return cachedCalls;
}

/**
 * Server snapshot for useSyncExternalStore (always empty array).
 */
export function getServerCallsSnapshot(): CallSession[] {
  return [];
}

/**
 * Retrieve a specific call session by its unique ID.
 */
export function getCallById(id: string): CallSession | null {
  const calls = getStoredCalls();
  return calls.find((c) => c.id === id) || null;
}

/**
 * Save or update a completed call session in localStorage.
 * Ensures deduplication by call ID.
 */
export function saveCompletedCall(call: CallSession): CallSession {
  if (typeof window === "undefined" || !window.localStorage) {
    return call;
  }

  try {
    const calls = getStoredCalls();
    const existingIndex = calls.findIndex((c) => c.id === call.id);

    let updatedCalls: CallSession[];
    if (existingIndex >= 0) {
      // Update existing record
      updatedCalls = [...calls];
      updatedCalls[existingIndex] = { ...calls[existingIndex], ...call };
    } else {
      // Prepend new record
      updatedCalls = [call, ...calls];
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCalls));

    // Dispatch custom event for real-time reactivity across components
    window.dispatchEvent(new CustomEvent("callguide-storage-updated", { detail: { callId: call.id } }));

    return call;
  } catch (err) {
    console.error("Failed to save call to localStorage:", err);
    return call;
  }
}

/**
 * Delete a call record by ID.
 */
export function deleteCallById(id: string): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  try {
    const calls = getStoredCalls();
    const filtered = calls.filter((c) => c.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent("callguide-storage-updated"));
    return true;
  } catch (err) {
    console.error("Failed to delete call from localStorage:", err);
    return false;
  }
}

/**
 * Clear all stored call records (useful for testing or demo reset).
 */
export function clearAllStoredCalls(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("callguide-storage-updated"));
  } catch (err) {
    console.error("Failed to clear calls from localStorage:", err);
  }
}

export interface OutcomeMetric {
  outcome: FinalOutcome;
  label: string;
  category: "positive" | "followup" | "negative" | "administrative";
  count: number;
  percentage: number;
}

export interface CallMetrics {
  totalCompletedCalls: number;
  averageDurationSeconds: number;
  mostFrequentStage: {
    stageNumber: StageNumber;
    title: string;
    count: number;
  } | null;
  outcomeDistribution: OutcomeMetric[];
}

/**
 * Calculate dashboard summary metrics from a list of call sessions.
 * Never fabricates values; handles empty datasets gracefully.
 */
export function calculateCallMetrics(calls: CallSession[]): CallMetrics {
  const completedCalls = calls.filter((c) => c.status === "completed");
  const total = completedCalls.length;

  if (total === 0) {
    return {
      totalCompletedCalls: 0,
      averageDurationSeconds: 0,
      mostFrequentStage: null,
      outcomeDistribution: [],
    };
  }

  // 1. Average call duration
  const totalDuration = completedCalls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  const averageDurationSeconds = Math.round(totalDuration / total);

  // 2. Most frequently reached stage
  const stageCounts: Record<number, number> = {};
  for (const call of completedCalls) {
    const stage = call.furthestStageReached || 1;
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  }

  let topStageNum: StageNumber = 1;
  let topStageCount = 0;
  for (const [sNum, count] of Object.entries(stageCounts)) {
    const num = Number(sNum) as StageNumber;
    if (count > topStageCount) {
      topStageCount = count;
      topStageNum = num;
    }
  }

  const mostFrequentStage = {
    stageNumber: topStageNum,
    title: STAGES_CONFIG[topStageNum]?.title || `Stage ${topStageNum}`,
    count: topStageCount,
  };

  // 3. Outcome distribution (only outcomes actually present in dataset)
  const outcomeCounts: Partial<Record<FinalOutcome, number>> = {};
  for (const call of completedCalls) {
    const outcome = call.finalOutcome || "not_logged";
    outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
  }

  const outcomeDistribution: OutcomeMetric[] = [];
  for (const meta of CANONICAL_OUTCOMES) {
    const count = outcomeCounts[meta.value] || 0;
    if (count > 0) {
      outcomeDistribution.push({
        outcome: meta.value,
        label: meta.label,
        category: meta.category,
        count,
        percentage: Math.round((count / total) * 100),
      });
    }
  }

  // Sort distribution by count descending
  outcomeDistribution.sort((a, b) => b.count - a.count);

  return {
    totalCompletedCalls: total,
    averageDurationSeconds,
    mostFrequentStage,
    outcomeDistribution,
  };
}

/**
 * Helper to ensure deterministic UUID generation for legacy non-UUID demo session IDs (e.g. 'demo-call-1')
 * Guarantees that repeated migrations never generate duplicate database records.
 */
function toDeterministicUUID(rawId: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawId)) {
    return rawId;
  }
  let hash = 0;
  for (let i = 0; i < rawId.length; i++) {
    hash = (hash << 5) - hash + rawId.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  const numPart = rawId.replace(/\D/g, "") || "1";
  const paddedNum = numPart.padStart(12, "0").slice(-12);
  return `${hex}-0000-4000-8000-${paddedNum}`;
}

/**
 * Migrate legacy Phase 3 localStorage call sessions to FastAPI / Supabase backend.
 * Idempotent, non-destructive (preserves local records), reports status cleanly.
 */
export async function migrateLocalStorageToBackend(): Promise<{
  success: boolean;
  totalFound: number;
  importedCount: number;
  alreadyMigrated: boolean;
  errors: string[];
}> {
  if (typeof window === "undefined" || !window.localStorage) {
    return { success: false, totalFound: 0, importedCount: 0, alreadyMigrated: false, errors: ["No window.localStorage available"] };
  }

  const localCalls = getStoredCalls();
  if (localCalls.length === 0) {
    return { success: true, totalFound: 0, importedCount: 0, alreadyMigrated: true, errors: [] };
  }

  const isAlreadyMigrated = window.localStorage.getItem(MIGRATION_FLAG_KEY) === "true";
  if (isAlreadyMigrated) {
    return { success: true, totalFound: localCalls.length, importedCount: 0, alreadyMigrated: true, errors: [] };
  }

  let imported = 0;
  const errors: string[] = [];

  // Dynamically import api-client to avoid circular deps
  const { createCall, updateCallStage, closeCall } = await import("@/lib/api-client");

  for (const call of localCalls) {
    try {
      // Generate or preserve deterministic UUID
      const targetUUID = toDeterministicUUID(call.id);
      
      const created = await createCall({
        prospectName: call.prospectName,
        companyName: call.companyName,
        prospectRole: call.prospectRole,
        phoneNumber: call.phoneNumber,
        id: targetUUID,
        startedAt: call.startedAt,
      });

      // Import stage results
      if (call.stageResults) {
        for (let s = 1; s <= 8; s++) {
          const stageData = call.stageResults[s as StageNumber];
          if (stageData && (stageData.selectedOutcome || stageData.prospectWords)) {
            await updateCallStage(created.id, s, {
              stageOutcome: stageData.selectedOutcome,
              prospectWords: stageData.prospectWords,
              additionalData: stageData.extraData,
            });
          }
        }
      }

      // Close call if it was completed
      if (call.status === "completed" && call.finalOutcome) {
        await closeCall(created.id, {
          finalOutcome: call.finalOutcome,
          durationSeconds: call.durationSeconds,
          nextStepNotes: call.nextStepNotes,
          endedAt: call.endedAt,
        });
      }

      imported++;
    } catch (err: unknown) {
      errors.push(`Failed to migrate call "${call.prospectName}" (${call.id}): ${(err as Error)?.message || "Unknown error"}`);
    }
  }

  if (errors.length === 0) {
    window.localStorage.setItem(MIGRATION_FLAG_KEY, "true");
    return { success: true, totalFound: localCalls.length, importedCount: imported, alreadyMigrated: false, errors: [] };
  }

  return { success: false, totalFound: localCalls.length, importedCount: imported, alreadyMigrated: false, errors };
}

/**
 * Filter calls by search term, outcome, and furthest stage.
 */
export function filterCallSessions(
  calls: CallSession[],
  filters: {
    search?: string;
    outcome?: string;
    stage?: number | "all";
  }
): CallSession[] {
  return calls.filter((call) => {
    // 1. Search by prospect name or company
    if (filters.search && filters.search.trim() !== "") {
      const q = filters.search.toLowerCase().trim();
      const matchName = call.prospectName?.toLowerCase().includes(q);
      const matchCompany = call.companyName?.toLowerCase().includes(q);
      const matchRole = call.prospectRole?.toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchRole) {
        return false;
      }
    }

    // 2. Filter by final outcome
    if (filters.outcome && filters.outcome !== "all") {
      if (call.finalOutcome !== filters.outcome) {
        return false;
      }
    }

    // 3. Filter by furthest stage reached
    if (filters.stage && filters.stage !== "all") {
      if (call.furthestStageReached !== Number(filters.stage)) {
        return false;
      }
    }

    return true;
  });
}
