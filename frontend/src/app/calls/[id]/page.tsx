"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FinalOutcome, StageData, StageNumber, CallSession } from "@/types";
import { STAGES_CONFIG, CANONICAL_OUTCOMES } from "@/config/stages";
import { CallHeader } from "@/components/active-call/CallHeader";
import { StageStepper } from "@/components/active-call/StageStepper";
import { StageCard } from "@/components/active-call/StageCard";
import { EndCallModal } from "@/components/active-call/EndCallModal";
import { saveCompletedCall, getCallById } from "@/lib/call-storage";

function ActiveCallContent() {
  const params = useParams();
  const router = useRouter();
  const callId = (params?.id as string) || "demo-call-1";

  // Demo Prospect Metadata
  const prospectName = "Rahul Sharma";
  const companyName = "Apex Industrial Solutions";
  const prospectRole = "VP of Operations";

  // Check if existing record is already in localStorage (initialized lazily)
  const existingRecord = useMemo(() => getCallById(callId), [callId]);
  const isExistingCompleted = existingRecord && existingRecord.status === "completed";

  // Start timestamp
  const startedAtRef = useRef<string>(
    isExistingCompleted && existingRecord.startedAt
      ? existingRecord.startedAt
      : new Date().toISOString()
  );

  // Call Progression & Session State (initialized from storage if available)
  const [currentStage, setCurrentStage] = useState<StageNumber>(
    isExistingCompleted ? existingRecord.currentStage : 1
  );
  const [furthestStageReached, setFurthestStageReached] = useState<StageNumber>(
    isExistingCompleted ? existingRecord.furthestStageReached : 1
  );
  const [status, setStatus] = useState<"in_progress" | "completed">(
    isExistingCompleted ? "completed" : "in_progress"
  );
  const [durationSeconds, setDurationSeconds] = useState(
    isExistingCompleted ? existingRecord.durationSeconds : 0
  );
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [finalOutcome, setFinalOutcome] = useState<FinalOutcome | null>(
    isExistingCompleted ? existingRecord.finalOutcome || null : null
  );
  const [nextStepNotes, setNextStepNotes] = useState<string>(
    isExistingCompleted ? existingRecord.nextStepNotes || "" : ""
  );

  // In-Memory Stage Results Map (1 through 8)
  const [stageResults, setStageResults] = useState<Record<StageNumber, StageData>>(
    isExistingCompleted && existingRecord.stageResults
      ? existingRecord.stageResults
      : {
          1: { selectedOutcome: null, prospectWords: "", extraData: {} },
          2: { selectedOutcome: null, prospectWords: "", extraData: {} },
          3: { selectedOutcome: null, prospectWords: "", extraData: {} },
          4: { selectedOutcome: null, prospectWords: "", extraData: {} },
          5: { selectedOutcome: null, prospectWords: "", extraData: {} },
          6: { selectedOutcome: null, prospectWords: "", extraData: {} },
          7: { selectedOutcome: null, prospectWords: "", extraData: {} },
          8: { selectedOutcome: null, prospectWords: "", extraData: {} },
        }
  );

  // Call duration timer
  useEffect(() => {
    if (status === "completed") return;

    const timer = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Stage Data Mutators
  const handleOutcomeChange = (outcome: string) => {
    setStageResults((prev) => ({
      ...prev,
      [currentStage]: {
        ...prev[currentStage],
        selectedOutcome: outcome,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const handleNotesChange = (notes: string) => {
    setStageResults((prev) => ({
      ...prev,
      [currentStage]: {
        ...prev[currentStage],
        prospectWords: notes,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const handleExtraDataChange = (key: string, value: string) => {
    setStageResults((prev) => ({
      ...prev,
      [currentStage]: {
        ...prev[currentStage],
        extraData: {
          ...(prev[currentStage].extraData || {}),
          [key]: value,
        },
      },
    }));
  };

  // Stage Navigation
  const handleNextStage = () => {
    if (currentStage < 8) {
      const nextStage = (currentStage + 1) as StageNumber;
      setCurrentStage(nextStage);
      setFurthestStageReached((prev) => (nextStage > prev ? nextStage : prev));
    } else {
      // If at Stage 8, trigger End Call
      setIsEndModalOpen(true);
    }
  };

  const handlePrevStage = () => {
    if (currentStage > 1) {
      const prevStage = (currentStage - 1) as StageNumber;
      setCurrentStage(prevStage);
      // Note: furthestStageReached is intentionally preserved and not decreased!
    }
  };

  const handleSelectStage = (stage: StageNumber) => {
    if (stage <= furthestStageReached) {
      setCurrentStage(stage);
    }
  };

  // End Call Confirmation - Persists to LocalStorage
  const handleConfirmEnd = (outcome: FinalOutcome, notes: string) => {
    const endedAt = new Date().toISOString();
    setStatus("completed");
    setFinalOutcome(outcome);
    setNextStepNotes(notes);
    setIsEndModalOpen(false);

    // Save completed session record to LocalStorage
    const completedSession: CallSession = {
      id: callId,
      prospectName,
      companyName,
      prospectRole,
      status: "completed",
      currentStage,
      furthestStageReached,
      startedAt: startedAtRef.current || new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endedAt,
      durationSeconds,
      finalOutcome: outcome,
      nextStepNotes: notes,
      stageResults,
    };

    saveCompletedCall(completedSession);
  };

  const handleStartFreshCall = () => {
    const newCallId = `call_${Date.now()}`;
    router.push(`/calls/${newCallId}`);
  };

  const currentStageConfig = STAGES_CONFIG[currentStage];
  const currentStageData = stageResults[currentStage];
  const isCompleted = status === "completed";

  const selectedOutcomeMeta = CANONICAL_OUTCOMES.find((o) => o.value === finalOutcome);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* 1. Header */}
      <CallHeader
        prospectName={prospectName}
        companyName={companyName}
        prospectRole={prospectRole}
        durationSeconds={durationSeconds}
        isCompleted={isCompleted}
        onEndCallClick={() => setIsEndModalOpen(true)}
      />

      {/* 2. Stepper */}
      <StageStepper
        currentStage={currentStage}
        furthestStageReached={furthestStageReached}
        onSelectStage={handleSelectStage}
        isCallCompleted={isCompleted}
      />

      {/* 3. Main Workspace */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        {isCompleted ? (
          /* Call Completed Review Screen */
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs">
              <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Call Completed & Saved
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Local Storage
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                    Call Record Summary: {prospectName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {companyName} &bull; Call ID: <span className="font-mono text-slate-700">{callId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleStartFreshCall}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
                  >
                    + Start New Call
                  </button>
                  <Link
                    href={`/calls/${callId}/details`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    View Full Audit Details &rarr;
                  </Link>
                  <Link
                    href="/calls"
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Call History
                  </Link>
                  <Link
                    href="/"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                  >
                    Home
                  </Link>
                </div>
              </div>

              {/* Outcome Badge Highlights */}
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Final Outcome Recorded
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">
                      {selectedOutcomeMeta?.label || finalOutcome}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedOutcomeMeta?.description}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Furthest Stage Reached
                  </span>
                  <div className="mt-1 text-base font-bold text-indigo-700">
                    Stage {furthestStageReached} of 8 ({STAGES_CONFIG[furthestStageReached]?.title})
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Progressed through {furthestStageReached} structured conversational milestone(s).
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Duration
                  </span>
                  <div className="mt-1 text-base font-bold text-slate-800 font-mono">
                    {Math.floor(durationSeconds / 60)}m {durationSeconds % 60}s
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Saved to local browser storage session history.
                  </p>
                </div>
              </div>

              {nextStepNotes && (
                <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Agreed Next-Step Notes
                  </span>
                  <p className="mt-1 text-xs text-slate-800 leading-relaxed">
                    {nextStepNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Stage-by-Stage Audit Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Conversation Audit by Stage
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review of what was captured across all reached stages in this session:
                  </p>
                </div>
                <Link
                  href={`/calls/${callId}/details`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Open Full Detail Page &rarr;
                </Link>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {([1, 2, 3, 4, 5, 6, 7, 8] as StageNumber[])
                  .filter((num) => num <= furthestStageReached)
                  .map((num) => {
                    const stage = STAGES_CONFIG[num];
                    const data = stageResults[num];
                    const selectedOption = stage.outcomeOptions.find(
                      (o) => o.value === data.selectedOutcome
                    );

                    return (
                      <div key={num} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                              {num}
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {stage.title}
                            </span>
                          </div>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {selectedOption ? selectedOption.label : "No outcome selected"}
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-slate-600 pl-7">
                          {data.prospectWords ? (
                            <p className="rounded-md bg-slate-50 p-2 italic text-slate-800">
                              &ldquo;{data.prospectWords}&rdquo;
                            </p>
                          ) : (
                            <p className="text-slate-400 italic">No verbatim notes recorded.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : (
          /* Active Call Work Area */
          <div className="space-y-6">
            <StageCard
              stage={currentStageConfig}
              stageData={currentStageData}
              onOutcomeChange={handleOutcomeChange}
              onNotesChange={handleNotesChange}
              onExtraDataChange={handleExtraDataChange}
              isCallCompleted={isCompleted}
            />

            {/* Bottom Floating Navigation Bar */}
            <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-lg backdrop-blur-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevStage}
                  disabled={currentStage === 1}
                  className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                    currentStage === 1
                      ? "cursor-not-allowed text-slate-300 opacity-60"
                      : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                  }`}
                >
                  &larr; Previous Stage
                </button>

                <span className="hidden sm:inline-flex text-xs text-slate-400 px-2">
                  Stage {currentStage} of 8
                </span>
              </div>

              {/* Status indicator */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Session Active &bull; Local State Synchronized</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEndModalOpen(true)}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 cursor-pointer"
                >
                  End Call
                </button>

                <button
                  type="button"
                  onClick={handleNextStage}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:bg-indigo-800 cursor-pointer"
                >
                  <span>
                    {currentStage === 8 ? "Review & End Call" : "Next Stage"}
                  </span>
                  <span className="text-indigo-200">&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. End Call Modal */}
      <EndCallModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        onConfirmEnd={handleConfirmEnd}
        prospectName={prospectName}
        companyName={companyName}
        furthestStageReached={furthestStageReached}
        currentDurationSeconds={durationSeconds}
      />
    </div>
  );
}

export default function ActiveCallPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
            Loading active call workspace...
          </div>
        </div>
      }
    >
      <ActiveCallContent />
    </Suspense>
  );
}
