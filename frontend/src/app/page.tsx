import React from "react";
import Link from "next/link";

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-xs">
              CG
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                CallGuide AI
              </span>
              <span className="ml-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                Phase 3
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/calls"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Call History Dashboard
            </Link>
            <Link
              href="/calls/demo-call-1"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
            >
              Launch Active Call &rarr;
            </Link>
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
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Structured 8-Stage Methodology
              </p>
              <Link
                href="/calls/demo-call-1"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Test in Live Demo Call &rarr;
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {stages.map((stage) => (
                <Link
                  key={stage.num}
                  href={`/calls/demo-call-1`}
                  className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-center transition hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                    {stage.num}
                  </span>
                  <span className="mt-1.5 text-xs font-medium text-slate-800">
                    {stage.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Call History & Sessions Section */}
        <section className="mt-8 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Call History & Sessions
              </h2>
              <p className="text-sm text-slate-500">
                Track previous call runs, furthest stages reached, and canonical outcomes stored in local browser storage.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/calls"
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                View Call History
              </Link>
              <Link
                href="/calls/demo-call-1"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
              >
                + Start Demo Call
              </Link>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Call History Dashboard & Analytics
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xl">
                    View completed calls, filter by prospect name or canonical outcome, review stage-by-stage audits, and inspect real-time duration and milestone metrics.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/calls"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                >
                  Open Call History &rarr;
                </Link>
              </div>
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
