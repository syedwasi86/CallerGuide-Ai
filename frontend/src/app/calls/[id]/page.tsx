"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FinalOutcome, StageData, StageNumber, CallSession } from "@/types";
import { STAGES_CONFIG, CANONICAL_OUTCOMES } from "@/config/stages";
import { CallHeader } from "@/components/active-call/CallHeader";
import { StageStepper } from "@/components/active-call/StageStepper";
import { StageCard } from "@/components/active-call/StageCard";
import { EndCallModal } from "@/components/active-call/EndCallModal";
import { StartCallModal } from "@/components/active-call/StartCallModal";
import {
  saveCompletedCall,
  getCallById,
  setActiveCallReference,
  clearActiveCallReference,
} from "@/lib/call-storage";
import {
  createCall as apiCreateCall,
  getCall as apiGetCall,
  updateCallStage as apiUpdateCallStage,
  closeCall as apiCloseCall,
} from "@/lib/api-client";

function ActiveCallContent() {
  void apiCreateCall;
  const params = useParams();
  const rawParamId = (params?.id as string) || "";

  // Prospect Metadata (dynamically loaded from call record)
  const [prospectName, setProspectName] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [prospectRole, setProspectRole] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // Call session status
  const [callFound, setCallFound] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active call ID (state in case auto-generated UUID changes from param)
  const [callId, setCallId] = useState<string>(rawParamId);

  // Modal controls
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  // Sync and connection status
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error" | "offline">("synced");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Start timestamp
  const startedAtRef = useRef<string>(new Date().toISOString());

  // Call Progression & Session State
  const [currentStage, setCurrentStage] = useState<StageNumber>(1);
  const [furthestStageReached, setFurthestStageReached] = useState<StageNumber>(1);
  const [status, setStatus] = useState<"in_progress" | "completed">("in_progress");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [finalOutcome, setFinalOutcome] = useState<FinalOutcome | null>(null);
  const [nextStepNotes, setNextStepNotes] = useState<string>("");

  // In-Memory Stage Results Map (1 through 8)
  const [stageResults, setStageResults] = useState<Record<StageNumber, StageData>>({
    1: { selectedOutcome: null, prospectWords: "", extraData: {} },
    2: { selectedOutcome: null, prospectWords: "", extraData: {} },
    3: { selectedOutcome: null, prospectWords: "", extraData: {} },
    4: { selectedOutcome: null, prospectWords: "", extraData: {} },
    5: { selectedOutcome: null, prospectWords: "", extraData: {} },
    6: { selectedOutcome: null, prospectWords: "", extraData: {} },
    7: { selectedOutcome: null, prospectWords: "", extraData: {} },
    8: { selectedOutcome: null, prospectWords: "", extraData: {} },
  });

  // Helper to test if a string is a valid UUID
  const isValidUUID = (str: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

  // 1. Initial Load: Fetch existing call from backend or local storage
  useEffect(() => {
    let isCancelled = false;

    async function initCall() {
      setIsLoading(true);

      // If valid UUID, attempt to fetch from backend
      if (isValidUUID(rawParamId)) {
        try {
          const backendCall = await apiGetCall(rawParamId);
          if (isCancelled) return;

          setCallId(backendCall.id);
          setProspectName(backendCall.prospectName);
          setCompanyName(backendCall.companyName);
          setProspectRole(backendCall.prospectRole || "");
          setPhoneNumber(backendCall.phoneNumber || "");
          setStatus(backendCall.status);
          setCurrentStage(backendCall.currentStage);
          setFurthestStageReached(backendCall.furthestStageReached);
          setDurationSeconds(backendCall.durationSeconds || 0);
          setFinalOutcome(backendCall.finalOutcome || null);
          setNextStepNotes(backendCall.nextStepNotes || "");
          setStageResults(backendCall.stageResults);
          if (backendCall.startedAt) {
            startedAtRef.current = backendCall.startedAt;
          }

          if (backendCall.status === "in_progress") {
            setActiveCallReference(backendCall.id);
          } else {
            clearActiveCallReference();
          }
          setSyncStatus("synced");
          setCallFound(true);
          setIsLoading(false);
          return;
        } catch {
          // Fall through to local check
        }
      }

      // Check localStorage for offline / seeded demo data
      const local = getCallById(rawParamId);
      if (local) {
        setCallId(local.id);
        setProspectName(local.prospectName);
        setCompanyName(local.companyName);
        setProspectRole(local.prospectRole || "");
        setPhoneNumber(local.phoneNumber || "");
        setStatus(local.status);
        setCurrentStage(local.currentStage);
        setFurthestStageReached(local.furthestStageReached);
        setDurationSeconds(local.durationSeconds || 0);
        setFinalOutcome(local.finalOutcome || null);
        setNextStepNotes(local.nextStepNotes || "");
        if (local.stageResults) setStageResults(local.stageResults);
        setCallFound(true);
        setIsLoading(false);
        return;
      }

      // If not found in backend or local storage, do NOT invent demo caller details
      if (!isCancelled) {
        setCallFound(false);
        setIsLoading(false);
      }
    }

    initCall();

    return () => {
      isCancelled = true;
    };
  }, [rawParamId]);

  // Call duration timer
  useEffect(() => {
    if (status === "completed") return;

    const timer = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Debounced backend sync for stage edits
  const syncStageToBackend = async (stageNum: number, data: StageData) => {
    if (!isValidUUID(callId)) return;
    try {
      setSyncStatus("saving");
      await apiUpdateCallStage(callId, stageNum, {
        stageOutcome: data.selectedOutcome,
        prospectWords: data.prospectWords,
        additionalData: data.extraData,
      });
      setSyncStatus("synced");
      setErrorMessage(null);
    } catch (err: unknown) {
      console.warn("Stage update sync error:", (err as Error)?.message);
      setSyncStatus("offline");
    }
  };

  // Stage Data Mutators
  const handleOutcomeChange = (outcome: string) => {
    const updatedStageData: StageData = {
      ...stageResults[currentStage],
      selectedOutcome: outcome,
      updatedAt: new Date().toISOString(),
    };

    setStageResults((prev) => ({
      ...prev,
      [currentStage]: updatedStageData,
    }));

    syncStageToBackend(currentStage, updatedStageData);
  };

  const handleNotesChange = (notes: string) => {
    const updatedStageData: StageData = {
      ...stageResults[currentStage],
      prospectWords: notes,
      updatedAt: new Date().toISOString(),
    };

    setStageResults((prev) => ({
      ...prev,
      [currentStage]: updatedStageData,
    }));

    syncStageToBackend(currentStage, updatedStageData);
  };

  const handleExtraDataChange = (key: string, value: string) => {
    const updatedStageData: StageData = {
      ...stageResults[currentStage],
      extraData: {
        ...(stageResults[currentStage].extraData || {}),
        [key]: value,
      },
    };

    setStageResults((prev) => ({
      ...prev,
      [currentStage]: updatedStageData,
    }));

    syncStageToBackend(currentStage, updatedStageData);
  };

  // Stage Navigation
  const handleNextStage = () => {
    if (currentStage < 8) {
      const nextStage = (currentStage + 1) as StageNumber;
      setCurrentStage(nextStage);
      setFurthestStageReached((prev) => (nextStage > prev ? nextStage : prev));

      // Advance stage in backend
      if (isValidUUID(callId)) {
        apiUpdateCallStage(callId, nextStage, {
          stageOutcome: stageResults[nextStage]?.selectedOutcome,
          prospectWords: stageResults[nextStage]?.prospectWords,
          additionalData: stageResults[nextStage]?.extraData,
        }).catch(() => {});
      }
    } else {
      setIsEndModalOpen(true);
    }
  };

  const handlePrevStage = () => {
    if (currentStage > 1) {
      const prevStage = (currentStage - 1) as StageNumber;
      setCurrentStage(prevStage);
      // Furthest stage reached is intentionally preserved monotonically
    }
  };

  const handleSelectStage = (stage: StageNumber) => {
    if (stage <= furthestStageReached) {
      setCurrentStage(stage);
    }
  };

  // End Call Confirmation - Persists to Backend API and LocalStorage fallback
  const handleConfirmEnd = async (outcome: FinalOutcome, notes: string) => {
    const endedAt = new Date().toISOString();
    setSyncStatus("saving");

    try {
      if (isValidUUID(callId)) {
        await apiCloseCall(callId, {
          finalOutcome: outcome,
          durationSeconds,
          nextStepNotes: notes,
          endedAt,
        });
      }
      setSyncStatus("synced");
      setErrorMessage(null);
    } catch (err: unknown) {
      console.warn("Backend close call error:", (err as Error)?.message);
      setSyncStatus("offline");
      setErrorMessage("Could not finalize to backend database; saved locally.");
    }

    // Always update local storage as reliable client backup
    const completedSession: CallSession = {
      id: callId,
      prospectName,
      companyName,
      prospectRole,
      phoneNumber: phoneNumber || undefined,
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
    clearActiveCallReference();

    setStatus("completed");
    setFinalOutcome(outcome);
    setNextStepNotes(notes);
    setIsEndModalOpen(false);
  };

  const handleStartFreshCall = () => {
    setIsStartModalOpen(true);
  };

  const currentStageConfig = STAGES_CONFIG[currentStage];
  const currentStageData = stageResults[currentStage];
  const isCompleted = status === "completed";

  const selectedOutcomeMeta = CANONICAL_OUTCOMES.find((o) => o.value === finalOutcome);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
          Loading call session...
        </div>
      </div>
    );
  }

  if (!callFound) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/calls" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              &larr; Back to Call History
            </Link>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 shadow-xs w-full">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Call Session Not Found
            </h1>
            <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
              No active call was found for ID <code className="font-mono text-slate-700">{callId}</code>. In CallGuide AI, all calls must be started by confirming prospect details.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsStartModalOpen(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
              >
                + Start Call with Prospect
              </button>
              <Link
                href="/calls"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                View Call History
              </Link>
            </div>
          </div>
        </main>

        <StartCallModal
          isOpen={isStartModalOpen}
          onClose={() => setIsStartModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* 1. Header */}
      <CallHeader
        prospectName={prospectName}
        companyName={companyName}
        prospectRole={prospectRole}
        phoneNumber={phoneNumber}
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

      {/* Sync Status Banner */}
      {errorMessage && (
        <div className="mx-auto mt-2 max-w-7xl px-4 sm:px-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-amber-900 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Workspace */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        {isCompleted ? (
          /* Call Completed Review Screen */
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs">
              <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    {syncStatus === "synced" ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Call Completed & Saved
                        </span>
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          FastAPI + Supabase PostgreSQL
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                          Saved Locally in Browser Only
                        </span>
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Backend Offline Fallback
                        </span>
                      </>
                    )}
                  </div>
                  {syncStatus !== "synced" && (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                      ⚠️ <strong>Database Sync Notice:</strong> This call session could not be finalized to Supabase PostgreSQL because the FastAPI backend was unreachable. It is preserved safely in local browser storage and can be imported to the database from Call History.
                    </div>
                  )}
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
                    {syncStatus === "synced"
                      ? "Persisted to Supabase PostgreSQL database."
                      : "Saved in browser local storage (FastAPI offline)."}
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
              prospectName={prospectName}
              companyName={companyName}
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
              <div className="hidden md:flex items-center gap-1.5 text-xs">
                {syncStatus === "saving" && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    <span className="text-amber-700">Saving to FastAPI...</span>
                  </>
                )}
                {syncStatus === "synced" && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-emerald-700">Synced &bull; FastAPI + Supabase</span>
                  </>
                )}
                {syncStatus === "offline" && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                    <span className="text-slate-600">Local Session Mode</span>
                  </>
                )}
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

      {/* 5. Start New Call Modal */}
      <StartCallModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
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
