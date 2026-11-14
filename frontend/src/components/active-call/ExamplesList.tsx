"use client";

import React from "react";
import { ProspectExample } from "@/types";

interface ExamplesListProps {
  examples: ProspectExample[];
  stageTitle: string;
}

export function ExamplesList({ examples, stageTitle }: ExamplesListProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <svg
            className="h-4 w-4 text-indigo-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Likely Prospect Responses
        </h3>
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          100-Transcript Dataset
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Empirical verbatim phrases prospects say during <span className="font-medium text-slate-700">{stageTitle}</span>:
      </p>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {examples.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/20"
          >
            <div>
              <p className="text-xs font-medium italic text-slate-900 leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </p>
              {item.explanation && (
                <p className="mt-1.5 text-[11px] text-slate-500 leading-normal">
                  {item.explanation}
                </p>
              )}
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/60 pt-1.5 text-[10px] text-slate-400">
              <span>Example {idx + 1}</span>
              {item.transcriptId ? (
                <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ring-1 ring-inset ring-indigo-600/10">
                  {item.transcriptId}
                </span>
              ) : (
                <span className="font-mono text-slate-400">Verified</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

