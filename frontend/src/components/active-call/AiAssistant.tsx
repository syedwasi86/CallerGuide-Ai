"use client";

import React, { useState } from "react";
import { getAiSuggestion, AiSuggestionResult } from "@/lib/api-client";

interface AiAssistantProps {
  stageNumber: number;
  stageName?: string;
  stagePurpose?: string;
  selectedOutcome: string | null;
  prospectWords: string;
  prospectName?: string;
  companyName?: string;
}

export function AiAssistant({
  stageNumber,
  stageName,
  stagePurpose,
  selectedOutcome,
  prospectWords,
  prospectName,
  companyName,
}: AiAssistantProps) {
  const isStage6 = stageNumber === 6;

  const [isLoading, setIsLoading] = useState(false);
  const [suggestionData, setSuggestionData] = useState<AiSuggestionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateSuggestion = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await getAiSuggestion({
        stageNumber,
        stageName,
        stagePurpose,
        selectedOutcome,
        prospectWords,
        prospectName,
        companyName,
      });
      setSuggestionData(result);
    } catch (err: unknown) {
      setErrorMessage(
        (err as Error)?.message || "AI service temporarily unavailable. Please retry."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 shadow-xs transition ${
        isStage6
          ? "border-indigo-300 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 ring-1 ring-indigo-200"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              AI Response Assistant
              {isStage6 && (
                <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                  Objection Focus
                </span>
              )}
            </h3>
            <span className="text-[11px] text-slate-500">
              {isStage6
                ? "Contextual objection-handling phrasing"
                : "Stage-relevant talking points and next sentences"}
            </span>
          </div>
        </div>

        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          ● Ready
        </span>
      </div>

      {/* Action / Context Prompt Area */}
      {!suggestionData && (
        <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-indigo-100/80 bg-white p-3">
          <div className="flex-1 text-xs text-slate-600">
            <p className="font-medium text-slate-900">
              {isStage6
                ? "Generate grounded objection-handling phrasing based on prospect statements."
                : "Generate natural response guidance tailored to this stage."}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {selectedOutcome && (
                <span className="font-semibold text-indigo-700 mr-1.5">
                  Outcome: {selectedOutcome} &bull;
                </span>
              )}
              {prospectWords
                ? `Context ready: "${prospectWords.slice(0, 50)}${prospectWords.length > 50 ? "..." : ""}"`
                : "Tip: Capture prospect words or select an outcome above for higher relevance."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateSuggestion}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition ${
              isLoading
                ? "bg-indigo-400 cursor-wait"
                : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer active:scale-98"
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="h-3.5 w-3.5 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating AI suggestion...
              </>
            ) : (
              <>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Suggest a Response
              </>
            )}
          </button>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="mt-3 flex items-start justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
          <div className="flex items-start gap-2">
            <span className="font-bold text-red-500">⚠</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleGenerateSuggestion}
            disabled={isLoading}
            className="text-[11px] font-semibold text-red-800 underline hover:text-red-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Generated Suggestion Display */}
      {suggestionData && (
        <div className="mt-3.5 space-y-3">
          <div
            className={`rounded-lg border p-3.5 shadow-xs transition ${
              suggestionData.is_fallback
                ? "border-amber-200 bg-amber-50/20"
                : "border-indigo-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                Suggested Spoken Phrasing
              </span>

              <div className="flex items-center gap-2">
                {suggestionData.provider === "guardrail" ? (
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                    Ethical Guardrail
                  </span>
                ) : suggestionData.is_fallback ? (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    <span>⚠</span> Transcript-based Fallback
                  </span>
                ) : suggestionData.provider === "groq" ? (
                  <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                    Live Groq
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                    Live Gemini
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleCopy(suggestionData.suggestion)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer ml-1"
                >
                  {copied ? (
                    <span className="text-emerald-600 font-bold">✓ Copied</span>
                  ) : (
                    <>
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Fallback Notice Banner */}
            {suggestionData.is_fallback && (
              <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200/60">
                <span className="font-semibold">Notice:</span> Generated using transcript-grounded rule engine
                {suggestionData.fallback_reason ? ` (${suggestionData.fallback_reason})` : ""}.
              </div>
            )}

            {/* Primary Suggestion */}
            <div className="mt-2.5">
              <p className="text-sm font-semibold text-slate-900 leading-relaxed italic">
                &ldquo;{suggestionData.suggestion}&rdquo;
              </p>
            </div>

            {/* Alternative Phrasing */}
            {suggestionData.alternative && (
              <div className="mt-3 rounded-md bg-slate-50/80 p-2.5 text-xs text-slate-700 border border-slate-100">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
                  Alternative angle:
                </span>
                <p className="italic text-slate-800">
                  &ldquo;{suggestionData.alternative}&rdquo;
                </p>
              </div>
            )}

            {/* Rationale */}
            {suggestionData.rationale && (
              <div className="mt-2 text-[11px] text-slate-500 flex items-start gap-1.5 pt-1">
                <span className="font-semibold text-slate-600">Why this works:</span>
                <span>{suggestionData.rationale}</span>
              </div>
            )}
          </div>

          {/* Assistant Actions Bar */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-[11px] text-slate-400">
              Advisory suggestion. Notes and prospect words remain untouched.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSuggestionData(null)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleGenerateSuggestion}
                disabled={isLoading}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer text-[11px]"
              >
                {isLoading ? "Generating..." : suggestionData.is_fallback ? "↻ Retry with AI" : "↻ Regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
