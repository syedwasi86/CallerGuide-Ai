"use client";

import React from "react";
import { OutcomeOption } from "@/types";

interface OutcomeRadioProps {
  options: OutcomeOption[];
  selectedValue: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OutcomeRadio({
  options,
  selectedValue,
  onChange,
  disabled = false,
}: OutcomeRadioProps) {
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          What happened at this stage?
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">Single selection</span>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Choose the outcome that best describes the prospect&apos;s response:
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;

          return (
            <label
              key={option.value}
              className={`relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name="stage-outcome"
                value={option.value}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <div className="flex-1">
                <span className={`block text-xs font-semibold ${isSelected ? "text-indigo-950" : "text-slate-800"}`}>
                  {option.label}
                </span>
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                  {option.value}
                </span>
              </div>
              {isSelected && (
                <span className="text-indigo-600 text-xs">✓</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

