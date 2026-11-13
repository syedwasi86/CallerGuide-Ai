/**
 * Core type definitions for CallGuide AI
 * Source of truth: doc/PRODUCT_SPEC.md
 */

export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type FinalOutcome =
  | "agreed_to_receive_report"
  | "next_step_agreed"
  | "interested"
  | "follow_up"
  | "call_again"
  | "not_interested"
  | "do_not_call"
  | "wrong_person"
  | "moved_company"
  | "not_logged";

export interface OutcomeOption {
  value: string;
  label: string;
  description?: string;
}

export interface ProspectExample {
  quote: string;
  context?: string;
  isDraft: boolean;
}

export interface StageConfig {
  stageNumber: StageNumber;
  slug: string;
  title: string;
  purpose: string;
  callerGuidance: string[];
  prospectExamples: ProspectExample[];
  outcomeOptions: OutcomeOption[];
  hasProminentNotes?: boolean;
  hasAiFocus?: boolean;
}

export interface StageData {
  selectedOutcome: string | null;
  prospectWords: string;
  extraData?: Record<string, string>;
  updatedAt?: string;
}

export interface CallSession {
  id: string;
  prospectName: string;
  companyName: string;
  prospectRole: string;
  status: "in_progress" | "completed";
  currentStage: StageNumber;
  furthestStageReached: StageNumber;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  finalOutcome?: FinalOutcome | null;
  nextStepNotes?: string;
  stageResults: Record<StageNumber, StageData>;
}
