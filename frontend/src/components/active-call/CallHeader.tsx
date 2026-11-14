"use client";

import React from "react";
import Link from "next/link";

interface CallHeaderProps {
  prospectName: string;
  companyName: string;
  prospectRole?: string;
  phoneNumber?: string;
  durationSeconds: number;
  isCompleted: boolean;
  onEndCallClick: () => void;
}

export function CallHeader({
  prospectName,
  companyName,
  prospectRole,
  phoneNumber,
  durationSeconds,
  isCompleted,
  onEndCallClick,
}: CallHeaderProps) {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Branding & Prospect Details */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition hover:opacity-85"
            title="Return to Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-xs">
              CG
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-bold tracking-tight text-slate-900">
                CallGuide AI
              </span>
              <span className="ml-2 rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                Active Call
              </span>
            </div>
          </Link>

          <div className="h-6 w-px bg-slate-200"></div>

          {/* Prospect Meta */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                {prospectName || "Call Session"}
              </h1>
              {companyName && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">
                  {companyName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              {prospectRole && <span>{prospectRole}</span>}
              {prospectRole && phoneNumber && <span>•</span>}
              {phoneNumber && <span className="font-mono text-slate-600">📞 {phoneNumber}</span>}
            </div>
          </div>
        </div>

        {/* Right: Timer & End Call Action */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Demo state notice */}
          <span className="hidden items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Local / In-Memory Demo
          </span>

          {/* Running Timer */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-mono font-medium text-slate-700">
            <svg
              className={`h-4 w-4 ${isCompleted ? "text-slate-400" : "animate-pulse text-emerald-500"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 15" />
            </svg>
            <span>{formatTime(durationSeconds)}</span>
          </div>

          {/* Persistent End Call CTA */}
          {!isCompleted ? (
            <button
              onClick={onEndCallClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 active:bg-rose-800 sm:text-sm"
            >
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
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.22 3.684A1 1 0 008.28 3H5z"
                />
              </svg>
              <span>End Call</span>
            </button>
          ) : (
            <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              Call Completed
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

