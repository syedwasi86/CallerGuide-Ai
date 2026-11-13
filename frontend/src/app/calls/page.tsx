"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FinalOutcome } from "@/types";
import { CANONICAL_OUTCOMES, STAGES_CONFIG } from "@/config/stages";
import {
  calculateCallMetrics,
  filterCallSessions,
  deleteCallById,
  subscribeToCalls,
  getCallsSnapshot,
  getServerCallsSnapshot,
} from "@/lib/call-storage";

export default function CallHistoryPage() {
  const router = useRouter();

  // Modern React 19 external store subscription without useEffect cascading renders
  const calls = useSyncExternalStore(
    subscribeToCalls,
    getCallsSnapshot,
    getServerCallsSnapshot
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState("all");
  const [selectedStage, setSelectedStage] = useState<number | "all">("all");

  const handleStartNewCall = () => {
    router.push(`/calls/call_${Date.now()}`);
  };

  // Filtered calls
  const filteredCalls = useMemo(() => {
    return filterCallSessions(calls, {
      search: searchQuery,
      outcome: selectedOutcome,
      stage: selectedStage,
    });
  }, [calls, searchQuery, selectedOutcome, selectedStage]);

  // Derived metrics
  const metrics = useMemo(() => {
    return calculateCallMetrics(calls);
  }, [calls]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedOutcome !== "all" ||
    selectedStage !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedOutcome("all");
    setSelectedStage("all");
  };

  const handleDeleteCall = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this call record from local storage?")) {
      deleteCallById(id);
    }
  };

  const getOutcomeMeta = (value?: FinalOutcome | null) => {
    return CANONICAL_OUTCOMES.find((o) => o.value === value) || {
      value: value || "not_logged",
      label: value || "Not Logged",
      category: "administrative" as const,
    };
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "positive":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      case "followup":
        return "bg-amber-50 text-amber-700 ring-amber-600/20";
      case "negative":
        return "bg-rose-50 text-rose-700 ring-rose-600/20";
      case "administrative":
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20";
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-xs group-hover:bg-indigo-700 transition">
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
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              &larr; Back to Home
            </Link>
            <button
              type="button"
              onClick={handleStartNewCall}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              + Start New Call
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6">
        {/* Page Title & Scope Notice */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Call History & Sessions
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review completed cold-call runs, stage progression milestones, and outcome analytics.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Storage: <strong>Browser localStorage</strong> (Demo Mode)</span>
          </div>
        </div>

        {/* 1. Summary Metrics Cards */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Metric 1: Total Completed Calls */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Completed Calls
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {metrics.totalCompletedCalls}
              </span>
              <span className="text-xs text-slate-500">sessions</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {metrics.totalCompletedCalls > 0
                ? "Saved to browser storage"
                : "No completed calls yet"}
            </p>
          </div>

          {/* Metric 2: Average Call Duration */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Average Call Duration
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 font-mono">
                {Math.floor(metrics.averageDurationSeconds / 60)}m{" "}
                {metrics.averageDurationSeconds % 60}s
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Calculated across completed calls
            </p>
          </div>

          {/* Metric 3: Most Frequent Stage */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Furthest Stage Milestone
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              {metrics.mostFrequentStage ? (
                <>
                  <span className="text-2xl font-extrabold text-indigo-600">
                    Stage {metrics.mostFrequentStage.stageNumber}
                  </span>
                  <span className="text-xs font-medium text-slate-600 truncate max-w-[130px]">
                    {metrics.mostFrequentStage.title}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-slate-400">N/A</span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {metrics.mostFrequentStage
                ? `Reached in ${metrics.mostFrequentStage.count} call session(s)`
                : "Requires at least 1 call"}
            </p>
          </div>

          {/* Metric 4: Recorded Outcome Types */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Outcome Types Recorded
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {metrics.outcomeDistribution.length}
              </span>
              <span className="text-xs text-slate-500">of 10 canonical</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Distinct outcomes logged
            </p>
          </div>
        </section>

        {/* 2. Outcome Distribution Section */}
        {metrics.outcomeDistribution.length > 0 && (
          <section className="mt-6 rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                  Canonical Outcome Distribution
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Breakdown of final dispositions across all completed calls (no fabricated data)
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {metrics.totalCompletedCalls} total
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.outcomeDistribution.map((item) => (
                <div
                  key={item.outcome}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${getCategoryBadgeClass(
                          item.category
                        )}`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 font-mono">
                      {item.outcome}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">
                      {item.count}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Search and Filter Bar */}
        <section className="mt-8 rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-xs font-medium text-slate-700">
                Search Calls
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by prospect name, company, or role..."
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Outcome Filter */}
            <div>
              <label htmlFor="outcomeFilter" className="block text-xs font-medium text-slate-700">
                Filter by Outcome
              </label>
              <select
                id="outcomeFilter"
                value={selectedOutcome}
                onChange={(e) => setSelectedOutcome(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="all">All Outcomes ({calls.length})</option>
                {CANONICAL_OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Furthest Stage Filter */}
            <div>
              <label htmlFor="stageFilter" className="block text-xs font-medium text-slate-700">
                Filter by Furthest Stage
              </label>
              <select
                id="stageFilter"
                value={selectedStage}
                onChange={(e) =>
                  setSelectedStage(e.target.value === "all" ? "all" : Number(e.target.value))
                }
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="all">All Stages</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Stage {s}: {STAGES_CONFIG[s]?.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Tags & Reset */}
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Showing {filteredCalls.length} of {calls.length} records</span>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>

        {/* 4. Table (Desktop) & Cards (Mobile) */}
        <section className="mt-4">
          {calls.length === 0 ? (
            /* Empty State: 0 Calls Ever */
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
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
                No Call Sessions Recorded Yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Complete your first outbound call session to begin tracking stage milestones, verbatim notes, and canonical outcomes.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href="/calls/demo-call-1"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                >
                  Launch Demo Call &rarr;
                </Link>
              </div>
            </div>
          ) : filteredCalls.length === 0 ? (
            /* Empty State: Filter Returned No Results */
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <h3 className="text-base font-semibold text-slate-900">
                No Call Records Match Your Criteria
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Try adjusting your search terms or clearing the stage/outcome filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            /* Call Records Table / Mobile Cards */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-3.5">
                        Prospect
                      </th>
                      <th scope="col" className="px-6 py-3.5">
                        Company & Role
                      </th>
                      <th scope="col" className="px-6 py-3.5">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3.5">
                        Duration
                      </th>
                      <th scope="col" className="px-6 py-3.5">
                        Furthest Stage
                      </th>
                      <th scope="col" className="px-6 py-3.5">
                        Final Outcome
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredCalls.map((call) => {
                      const outcomeMeta = getOutcomeMeta(call.finalOutcome);
                      const stageTitle = STAGES_CONFIG[call.furthestStageReached]?.title;

                      return (
                        <tr
                          key={call.id}
                          className="hover:bg-slate-50/80 transition group"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            <Link
                              href={`/calls/${call.id}/details`}
                              className="hover:text-indigo-600 transition"
                            >
                              {call.prospectName}
                            </Link>
                          </td>

                          <td className="px-6 py-4 text-slate-600">
                            <div>{call.companyName}</div>
                            <div className="text-[11px] text-slate-400">
                              {call.prospectRole}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                            {formatDate(call.endedAt || call.startedAt)}
                          </td>

                          <td className="px-6 py-4 font-mono text-slate-700 whitespace-nowrap">
                            {Math.floor(call.durationSeconds / 60)}m{" "}
                            {call.durationSeconds % 60}s
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                              Stage {call.furthestStageReached}: {stageTitle}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getCategoryBadgeClass(
                                outcomeMeta.category
                              )}`}
                            >
                              {outcomeMeta.label}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/calls/${call.id}/details`}
                                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                              >
                                View Details &rarr;
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteCall(call.id, e)}
                                title="Delete call from local storage"
                                className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Responsive Cards */}
              <div className="block lg:hidden divide-y divide-slate-100">
                {filteredCalls.map((call) => {
                  const outcomeMeta = getOutcomeMeta(call.finalOutcome);
                  const stageTitle = STAGES_CONFIG[call.furthestStageReached]?.title;

                  return (
                    <div key={call.id} className="p-4 sm:p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link
                            href={`/calls/${call.id}/details`}
                            className="text-base font-bold text-slate-900 hover:text-indigo-600 transition"
                          >
                            {call.prospectName}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {call.companyName} &bull; {call.prospectRole}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${getCategoryBadgeClass(
                            outcomeMeta.category
                          )}`}
                        >
                          {outcomeMeta.label}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700">
                          Stage {call.furthestStageReached}: {stageTitle}
                        </span>
                        <span className="font-mono text-slate-500">
                          ⏱ {Math.floor(call.durationSeconds / 60)}m{" "}
                          {call.durationSeconds % 60}s
                        </span>
                        <span className="text-slate-400">
                          {formatDate(call.endedAt || call.startedAt)}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {call.id}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/calls/${call.id}/details`}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                          >
                            View Details &rarr;
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCall(call.id, e)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        CallGuide AI MVP &bull; Phase 3 Session Dashboard &bull; Local Browser Storage Persistence
      </footer>
    </div>
  );
}
