"use client";

import React from "react";

interface AiAssistantProps {
  isStage6: boolean;
  prospectWords: string;
  selectedOutcome: string | null;
}

export function AiAssistant({
  isStage6,
  prospectWords,
  selectedOutcome,
}: AiAssistantProps) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-xs transition ${
        isStage6
          ? "border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 ring-1 ring-indigo-200"
          : "border-slate-200 bg-white"
      }`}
    >
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              AI Response Assistant
            </h3>
            <span className="text-[11px] text-slate-500">
              {isStage6 ? "Primary objection-handling assistant" : "Contextual talking point generator"}
            </span>
          </div>
        </div>

        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          Planned for Phase 5
        </span>
      </div>

      <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-indigo-100/80 bg-white p-3">
        <div className="flex-1 text-xs text-slate-600">
          <p className="font-medium text-slate-900">
            {isStage6
              ? "Overcome objections with grounded, non-aggressive phrasing."
              : "Generate natural response options based on prospect statements."}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {selectedOutcome && (
              <span className="font-semibold text-indigo-700 mr-1.5">
                Outcome: {selectedOutcome} &bull;
              </span>
            )}
            {prospectWords
              ? `Context ready: "${prospectWords.slice(0, 50)}${prospectWords.length > 50 ? "..." : ""}"`
              : "Enter the prospect's words above to prime the AI assistant."}
          </p>
        </div>

        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3.5 py-2 text-xs font-semibold text-indigo-400 opacity-80"
          title="AI integration is scheduled for Phase 5"
        >
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
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
          Suggest a response (Phase 5)
        </button>
      </div>

      <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between px-1">
        <span>No mock or hardcoded AI responses are rendered.</span>
        <span>Provider: Backend LLM Service</span>
      </div>
    </div>
  );
}
