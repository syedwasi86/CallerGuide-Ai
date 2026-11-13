"use client";

import React, { useState } from "react";
import { FinalOutcome, StageNumber } from "@/types";
import { CANONICAL_OUTCOMES } from "@/config/stages";

interface EndCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnd: (outcome: FinalOutcome, nextStepNotes: string) => void;
  prospectName: string;
  companyName: string;
  furthestStageReached: StageNumber;
  currentDurationSeconds: number;
}

export function EndCallModal({
  isOpen,
  onClose,
  onConfirmEnd,
  prospectName,
  companyName,
  furthestStageReached,
  currentDurationSeconds,
}: EndCallModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<FinalOutcome | "">("");
  const [nextStepNotes, setNextStepNotes] = useState("");
  const [validationError, setValidationError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutcome) {
      setValidationError(true);
      return;
    }
    onConfirmEnd(selectedOutcome as FinalOutcome, nextStepNotes);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const isDoNotCall = selectedOutcome === "do_not_call";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-7 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Wrap Up & Outcome Recording
            </span>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              End Call with {prospectName}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {companyName} &bull; Call Duration: <span className="font-semibold text-slate-700">{formatDuration(currentDurationSeconds)}</span> &bull; Furthest Stage: <span className="font-semibold text-indigo-700">Stage {furthestStageReached}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Cancel and return to active call"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Canonical 10 Final Outcome Radio Grid */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Final Call Outcome <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Select one canonical value</span>
            </div>

            {validationError && !selectedOutcome && (
              <p className="mt-1.5 text-xs font-medium text-rose-600">
                Please select a final call outcome before closing.
              </p>
            )}

            <div className="mt-2.5 grid gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto pr-1">
              {CANONICAL_OUTCOMES.map((item) => {
                const isSelected = selectedOutcome === item.value;
                let borderTint = "border-slate-200 hover:border-slate-300";
                if (isSelected) {
                  borderTint = item.value === "do_not_call"
                    ? "border-rose-600 bg-rose-50/60 ring-1 ring-rose-600"
                    : "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600";
                }

                return (
                  <label
                    key={item.value}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition text-xs ${borderTint}`}
                  >
                    <input
                      type="radio"
                      name="finalOutcome"
                      value={item.value}
                      checked={isSelected}
                      onChange={() => {
                        setSelectedOutcome(item.value);
                        setValidationError(false);
                      }}
                      className="mt-0.5 h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-900 block">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Do Not Call Protection Warning */}
          {isDoNotCall && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800">
              <strong className="font-bold">Strict Policy Notice:</strong> Prospect requested not to be called.
              This outcome will be recorded directly. The application does not suggest further objection-handling or persuasion for this prospect.
            </div>
          )}

          {/* Optional Agreed Next-Step Notes */}
          <div>
            <label
              htmlFor="nextStepNotes"
              className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between"
            >
              <span>Agreed Next Step / Wrap-up Notes</span>
              <span className="text-[11px] font-normal text-slate-400">Optional</span>
            </label>
            <textarea
              id="nextStepNotes"
              rows={3}
              value={nextStepNotes}
              onChange={(e) => setNextStepNotes(e.target.value)}
              placeholder="e.g. 'Agreed to send technical overview PDF on WhatsApp by 4 PM today.'"
              className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Local state demo notice */}
          <div className="rounded-lg bg-slate-50 p-2.5 text-center text-[11px] text-slate-500">
            Note: This action records the outcome in local in-memory state for this demo session.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel & Return to Call
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 focus:outline-hidden"
            >
              Confirm & End Call
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

