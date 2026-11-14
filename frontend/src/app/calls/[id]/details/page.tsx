"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CallSession, StageNumber } from "@/types";
import { STAGES_CONFIG, CANONICAL_OUTCOMES } from "@/config/stages";
import { getCallById, deleteCallById } from "@/lib/call-storage";
import { getCall as apiGetCall } from "@/lib/api-client";
import { StartCallModal } from "@/components/active-call/StartCallModal";

function CallDetailContent() {
  const params = useParams();
  const router = useRouter();
  const callId = (params?.id as string) || "";

  const [call, setCall] = useState<CallSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"backend" | "local">("backend");
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function loadCall() {
      if (!callId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // 1. Try fetching from FastAPI backend
      try {
        const backendCall = await apiGetCall(callId);
        if (isCancelled) return;
        setCall(backendCall);
        setDataSource("backend");
        setIsLoading(false);
        return;
      } catch {
        // Fall through to local fallback
      }

      // 2. Try fetching from localStorage
      const local = getCallById(callId);
      if (!isCancelled) {
        setCall(local);
        setDataSource("local");
        setIsLoading(false);
      }
    }

    loadCall();

    return () => {
      isCancelled = true;
    };
  }, [callId]);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this call record?")) {
      deleteCallById(callId);
      router.push("/calls");
    }
  };

  const handleStartAnotherCall = () => {
    setIsStartModalOpen(true);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
          Loading call record from database...
        </div>
      </div>
    );
  }

  // Not Found State
  if (!call) {
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Call Record Not Found
            </h1>
            <p className="mt-2 text-xs text-slate-500">
              No completed call with ID <code className="font-mono text-slate-700">{callId}</code> was found in the database or local storage.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/calls"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                Return to Call History
              </Link>
              <button
                type="button"
                onClick={() => setIsStartModalOpen(true)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                + Start New Call
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const outcomeMeta = CANONICAL_OUTCOMES.find((o) => o.value === call.finalOutcome) || {
    value: call.finalOutcome || "not_logged",
    label: call.finalOutcome || "Not Logged",
    description: "Outcome unrecorded",
    category: "administrative" as const,
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "positive":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      case "followup":
        return "bg-amber-50 text-amber-700 ring-amber-600/20";
      case "negative":
        return "bg-rose-50 text-rose-700 ring-rose-600/20";
      case "administrative":
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20";
    }
  };

  const allStages: StageNumber[] = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/calls"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
            >
              &larr; Back to Call History
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-mono text-slate-400">ID: {call.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/calls/${call.id}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Reopen in Active Call View
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              Delete Record
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 space-y-6">
        {/* 1. Call Overview Card */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Call Record Detail
                </span>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  {dataSource === "backend" ? "FastAPI + Supabase PostgreSQL" : "Local Storage Fallback"}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {call.prospectName}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {call.prospectRole} &bull; <strong className="text-slate-800">{call.companyName}</strong>
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end">
              <span
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ring-inset ${getCategoryBadgeClass(
                  outcomeMeta.category
                )}`}
              >
                {outcomeMeta.label}
              </span>
              <span className="text-xs text-slate-500 mt-1.5">
                {outcomeMeta.description}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Furthest Stage
              </span>
              <div className="mt-1 text-base font-bold text-indigo-700">
                Stage {call.furthestStageReached} of 8
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                {STAGES_CONFIG[call.furthestStageReached]?.title}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Call Duration
              </span>
              <div className="mt-1 text-base font-bold font-mono text-slate-900">
                {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Total call time recorded
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Started At
              </span>
              <div className="mt-1 text-xs font-medium text-slate-800">
                {formatDate(call.startedAt)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Ended At
              </span>
              <div className="mt-1 text-xs font-medium text-slate-800">
                {formatDate(call.endedAt)}
              </div>
            </div>
          </div>

          {/* Agreed Next-Step Notes */}
          {call.nextStepNotes && (
            <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Agreed Next-Step Notes
              </span>
              <p className="mt-1.5 text-xs text-slate-800 leading-relaxed font-medium">
                {call.nextStepNotes}
              </p>
            </div>
          )}
        </section>

        {/* 2. Stage-by-Stage Conversational Audit (All 8 Stages) */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Stage-by-Stage Conversational Audit
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Step-by-step record of progression across the 8-stage cold-call framework. Stages beyond the furthest reached milestone are explicitly marked as not reached.
            </p>
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            {allStages.map((stageNum) => {
              const stageConfig = STAGES_CONFIG[stageNum];
              const isReached = stageNum <= call.furthestStageReached;
              const stageData = call.stageResults ? call.stageResults[stageNum] : undefined;
              const selectedOutcomeOption = stageConfig.outcomeOptions.find(
                (o) => o.value === stageData?.selectedOutcome
              );

              return (
                <div
                  key={stageNum}
                  className={`py-5 first:pt-0 last:pb-0 transition ${
                    isReached ? "opacity-100" : "opacity-50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isReached
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {stageNum}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {stageConfig.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {stageConfig.purpose}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isReached ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          ✓ Reached
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                          Not reached
                        </span>
                      )}
                    </div>
                  </div>

                  {isReached && (
                    <div className="mt-4 pl-10 space-y-3">
                      {/* Selected Stage Outcome */}
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Selected Stage Outcome
                        </span>
                        <div className="mt-1 text-xs font-semibold text-slate-900">
                          {selectedOutcomeOption
                            ? selectedOutcomeOption.label
                            : stageData?.selectedOutcome
                            ? stageData.selectedOutcome
                            : "No outcome chosen during call"}
                        </div>
                      </div>

                      {/* Verbatim Prospect Words */}
                      {stageData?.prospectWords ? (
                        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Captured Prospect Statements / Verbatim Notes
                          </span>
                          <blockquote className="mt-1 text-xs text-slate-800 italic border-l-2 border-indigo-400 pl-3">
                            &ldquo;{stageData.prospectWords}&rdquo;
                          </blockquote>
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-400">
                          No verbatim notes captured for this stage.
                        </p>
                      )}

                      {/* Extra Data fields if any */}
                      {stageData?.extraData &&
                        Object.keys(stageData.extraData).length > 0 && (
                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              Additional Captured Attributes
                            </span>
                            <div className="mt-1 space-y-1">
                              {Object.entries(stageData.extraData).map(([k, v]) => (
                                <div key={k} className="text-xs text-slate-700">
                                  <strong className="text-slate-900">{k}:</strong> {v}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {!isReached && (
                    <div className="mt-2 pl-10 text-xs italic text-slate-400">
                      Call terminated or concluded before Stage {stageNum} ({stageConfig.title}) was reached.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Back Button */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/calls"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            &larr; Return to Call History
          </Link>

          <button
            type="button"
            onClick={handleStartAnotherCall}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            Start Another Call &rarr;
          </button>
        </div>
      </main>

      <StartCallModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
      />
    </div>
  );
}

export default function CallDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></span>
            Loading call details...
          </div>
        </div>
      }
    >
      <CallDetailContent />
    </Suspense>
  );
}
