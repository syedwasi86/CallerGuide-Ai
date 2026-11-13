"use client";

import React from "react";
import { StageConfig, StageData } from "@/types";
import { ExamplesList } from "./ExamplesList";
import { OutcomeRadio } from "./OutcomeRadio";
import { NotesArea } from "./NotesArea";
import { AiAssistant } from "./AiAssistant";

interface StageCardProps {
  stage: StageConfig;
  stageData: StageData;
  onOutcomeChange: (outcome: string) => void;
  onNotesChange: (notes: string) => void;
  onExtraDataChange?: (key: string, value: string) => void;
  isCallCompleted: boolean;
}

export function StageCard({
  stage,
  stageData,
  onOutcomeChange,
  onNotesChange,
  onExtraDataChange,
  isCallCompleted,
}: StageCardProps) {
  return (
    <div className="space-y-5">
      {/* Stage Header & Guidance Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Stage {stage.stageNumber} of 8
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {stage.title}
            </h2>
          </div>
          <span className="inline-flex self-start sm:self-auto items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-600">
            slug: {stage.slug}
          </span>
        </div>

        {/* Purpose Statement */}
        <div className="mt-3.5 rounded-lg bg-indigo-50/60 p-3 text-xs sm:text-sm text-indigo-950 font-medium border border-indigo-100/70">
          <span className="font-bold text-indigo-700">Purpose: </span>
          {stage.purpose}
        </div>

        {/* Practical Caller Guidance */}
        <div className="mt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Caller Guidance:
          </h4>
          <ul className="grid gap-2 sm:grid-cols-2 text-xs text-slate-600">
            {stage.callerGuidance.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold mt-0.5">&bull;</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Prospect Responses Examples */}
      <ExamplesList
        examples={stage.prospectExamples}
        stageTitle={stage.title}
      />

      {/* Outcome Selector ("What happened?") */}
      <OutcomeRadio
        options={stage.outcomeOptions}
        selectedValue={stageData.selectedOutcome}
        onChange={onOutcomeChange}
        disabled={isCallCompleted}
      />

      {/* Prospect Verbatim Words Capture */}
      <NotesArea
        stageNumber={stage.stageNumber}
        value={stageData.prospectWords}
        onChange={onNotesChange}
        selectedOutcome={stageData.selectedOutcome}
        extraData={stageData.extraData}
        onExtraDataChange={onExtraDataChange}
        disabled={isCallCompleted}
      />

      {/* AI Response Assistant Placeholder */}
      <AiAssistant
        isStage6={stage.stageNumber === 6}
        prospectWords={stageData.prospectWords}
        selectedOutcome={stageData.selectedOutcome}
      />
    </div>
  );
}
