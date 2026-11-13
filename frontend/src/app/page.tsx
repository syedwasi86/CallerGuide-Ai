import React from "react";

export default function Home() {
  const stages = [
    { num: 1, name: "Opening" },
    { num: 2, name: "Purpose" },
    { num: 3, name: "Permission" },
    { num: 4, name: "Their Business" },
    { num: 5, name: "Their Need" },
    { num: 6, name: "Objection" },
    { num: 7, name: "Next Step" },
    { num: 8, name: "Close" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-sm">
              CG
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                CallGuide AI
              </span>
              <span className="ml-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                MVP Foundation
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Phase 1 Scaffold Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8">
        {/* Product Identity Hero */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xs">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wider text-indigo-600 uppercase">
              Sales Conversation Companion
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Real-time cold-call guidance designed for the speed of speech.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              CallGuide AI keeps a structured methodology beside outbound sales
              calls—surfacing stage objectives, anticipated prospect responses,
              verbatim note capture, and contextual AI response suggestions.
            </p>
          </div>

          {/* 8-Stage Architecture Flow Preview */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Structured 8-Stage Methodology
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {stages.map((stage) => (
                <div
                  key={stage.num}
                  className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-center transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                    {stage.num}
                  </span>
                  <span className="mt-1.5 text-xs font-medium text-slate-800">
                    {stage.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call History Placeholder Area */}
        <section className="mt-8 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Call History & Sessions
              </h2>
              <p className="text-sm text-slate-500">
                Track previous call runs, furthest stages reached, and canonical outcomes.
              </p>
            </div>
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-400 shadow-xs"
              title="Active call workflow will be enabled in Phase 2"
            >
              + Start New Call
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">
              Call History will appear here
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Phase 1 established project setup and runtime skeletons.
              Database persistence (Supabase) and the Active Call workflow will be
              connected in subsequent phases.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                Phase 1: Project Setup & Skeletons Complete
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        CallGuide AI MVP &bull; Development Reference &bull; 48-Hour Build Window
      </footer>
    </div>
  );
}
