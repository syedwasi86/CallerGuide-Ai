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
            className="h-4 w-4 text-slate-400"
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
        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full ring-1 ring-inset ring-amber-600/20">
          Draft Content
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Common phrases prospects say during <span className="font-medium text-slate-700">{stageTitle}</span>:
      </p>

      {/* Notice Banner regarding transcript requirement */}
      <div className="mt-2.5 rounded-lg border border-amber-200/70 bg-amber-50/60 p-2.5 text-[11px] text-amber-800 flex items-start gap-2">
        <span className="text-amber-500 mt-0.5">ℹ</span>
        <span>
          <strong>Dataset Notice:</strong> Initial specification proposals shown.
          The 100-transcript archive dataset was not present in workspace and is needed to validate verbatim quotations with transcript IDs.
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {examples.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50/80 p-3 transition hover:border-slate-200 hover:bg-slate-50"
          >
            <p className="text-xs italic text-slate-800 leading-relaxed">
              &ldquo;{item.quote}&rdquo;
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-1.5 text-[10px] text-slate-400">
              <span>Example {idx + 1}</span>
              <span className="italic">Draft Spec Proposal</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

