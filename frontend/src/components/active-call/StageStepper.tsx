"use client";

import React from "react";
import { StageNumber } from "@/types";
import { STAGES_CONFIG } from "@/config/stages";

interface StageStepperProps {
  currentStage: StageNumber;
  furthestStageReached: StageNumber;
  onSelectStage: (stage: StageNumber) => void;
  isCallCompleted: boolean;
}

export function StageStepper({
  currentStage,
  furthestStageReached,
  onSelectStage,
  isCallCompleted,
}: StageStepperProps) {
  const stageNumbers: StageNumber[] = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="w-full border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Call Progression
          </span>
          <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full ring-1 ring-inset ring-indigo-700/10">
            Furthest Reached: Stage {furthestStageReached} of 8
          </span>
        </div>

        {/* Stepper Grid / Horizontal Scroll */}
        <nav aria-label="Stages" className="overflow-x-auto pb-1">
          <ol className="flex min-w-[700px] items-center justify-between gap-2">
            {stageNumbers.map((num) => {
              const stage = STAGES_CONFIG[num];
              const isCurrent = num === currentStage;
              const isVisited = num < furthestStageReached || (num === furthestStageReached && !isCurrent);
              const isFurthest = num === furthestStageReached;
              const isUpcoming = num > furthestStageReached;
              const isClickable = !isCallCompleted && num <= furthestStageReached;

              let statusClasses = "border-slate-200 bg-slate-50 text-slate-400";
              let badgeClasses = "bg-slate-200 text-slate-600";

              if (isCurrent) {
                statusClasses = "border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-600";
                badgeClasses = "bg-indigo-600 text-white font-bold";
              } else if (isVisited) {
                statusClasses = "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 cursor-pointer";
                badgeClasses = "bg-emerald-100 text-emerald-800 font-semibold";
              } else if (isUpcoming) {
                statusClasses = "border-slate-200/80 bg-slate-50/50 text-slate-400 cursor-not-allowed opacity-60";
                badgeClasses = "bg-slate-200 text-slate-500";
              }

              return (
                <li key={num} className="flex-1">
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => onSelectStage(num)}
                    className={`group flex w-full flex-col rounded-lg border p-2 text-left transition ${statusClasses}`}
                    title={
                      isUpcoming
                        ? `Stage ${num} (Advance through workflow to unlock)`
                        : `Switch to Stage ${num}: ${stage.title}`
                    }
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${badgeClasses}`}
                      >
                        {isVisited && !isCurrent ? (
                          <svg
                            className="h-3 w-3 stroke-[3]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          num
                        )}
                      </span>

                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-indigo-600 tracking-tight">
                          Active
                        </span>
                      )}
                      {!isCurrent && isFurthest && (
                        <span className="text-[10px] text-slate-400">
                          Max
                        </span>
                      )}
                    </div>
                    <span className="mt-1.5 truncate text-xs font-semibold">
                      {stage.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}

