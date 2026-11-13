"use client";

import React from "react";
import { StageNumber } from "@/types";

interface NotesAreaProps {
  stageNumber: StageNumber;
  value: string;
  onChange: (value: string) => void;
  selectedOutcome: string | null;
  extraData?: Record<string, string>;
  onExtraDataChange?: (key: string, value: string) => void;
  disabled?: boolean;
}

export function NotesArea({
  stageNumber,
  value,
  onChange,
  selectedOutcome,
  extraData = {},
  onExtraDataChange,
  disabled = false,
}: NotesAreaProps) {
  const isStage5 = stageNumber === 5;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-xs transition ${
        isStage5
          ? "border-indigo-300 ring-2 ring-indigo-500/10 bg-gradient-to-b from-indigo-50/20 to-white"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor="prospect-words"
          className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
        >
          <svg
            className={`h-4 w-4 ${isStage5 ? "text-indigo-600" : "text-slate-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Prospect&apos;s Words
          {isStage5 && (
            <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              High Priority Verbatim Capture
            </span>
          )}
        </label>
        <span className="text-[11px] text-slate-400">
          {wordCount} words &bull; {value.length} chars
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {isStage5
          ? "Capture the prospect's exact statements about goals, challenges, or operational needs. Preserve original wording."
          : "Jot down the prospect's actual phrasing or key details shared during this stage."}
      </p>

      <textarea
        id="prospect-words"
        rows={isStage5 ? 5 : 3}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          isStage5
            ? "e.g., \"Our primary challenge right now is plant downtime in the secondary line; we are falling 15% behind scheduled deliveries...\""
            : "Type exact prospect words or relevant observations..."
        }
        className={`mt-2.5 w-full rounded-lg border p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 ${
          isStage5
            ? "border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500/20 text-sm font-normal"
            : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
        } ${disabled ? "bg-slate-50 cursor-not-allowed opacity-70" : "bg-white"}`}
      />

      {/* Conditional Extra Fields */}
      {stageNumber === 3 && selectedOutcome === "callback_requested" && onExtraDataChange && (
        <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
          <label className="block text-xs font-semibold text-indigo-950">
            Callback Details (As stated by prospect)
          </label>
          <input
            type="text"
            placeholder="e.g. 'Call after 2 PM' or 'Next Tuesday morning'"
            value={extraData.callback_time || ""}
            disabled={disabled}
            onChange={(e) => onExtraDataChange("callback_time", e.target.value)}
            className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}

      {stageNumber === 3 && selectedOutcome === "information_requested_first" && onExtraDataChange && (
        <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
          <label className="block text-xs font-semibold text-indigo-950">
            Preferred Channel / Destination
          </label>
          <input
            type="text"
            placeholder="e.g. 'WhatsApp to this number' or 'Email to rahul@apex.com'"
            value={extraData.channel_destination || ""}
            disabled={disabled}
            onChange={(e) => onExtraDataChange("channel_destination", e.target.value)}
            className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}

      {stageNumber === 7 && onExtraDataChange && selectedOutcome && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <label className="block text-xs font-semibold text-slate-800">
            Next Action Details (Timing & Channel)
          </label>
          <input
            type="text"
            placeholder="e.g. 'Zoom call on Friday 3 PM' or 'Send brochure via WhatsApp'"
            value={extraData.next_step_details || ""}
            disabled={disabled}
            onChange={(e) => onExtraDataChange("next_step_details", e.target.value)}
            className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}
    </div>
  );
}
