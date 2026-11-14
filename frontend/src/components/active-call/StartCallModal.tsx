"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createCall, getPreviousProspects, ProspectSummary } from "@/lib/api-client";
import { getDistinctProspectsFromLocal, setActiveCallReference } from "@/lib/call-storage";

interface StartCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (callId: string) => void;
}

export function StartCallModal({ isOpen, onClose, onSuccess }: StartCallModalProps) {
  const router = useRouter();

  // Active Tab: "new" | "existing"
  const [activeTab, setActiveTab] = useState<"new" | "existing">("new");

  // New Prospect Form State
  const [prospectName, setProspectName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [prospectRole, setProspectRole] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Validation Errors
  const [errors, setErrors] = useState<{ prospectName?: string; companyName?: string }>({});

  // Submission & API state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Existing Prospects State
  const [existingProspects, setExistingProspects] = useState<ProspectSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingProspects, setIsLoadingProspects] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<ProspectSummary | null>(null);

  // Load existing prospects when modal opens or query changes
  useEffect(() => {
    let isCancelled = false;
    if (isOpen && activeTab === "existing") {
      const timer = setTimeout(() => {
        if (!isCancelled) setIsLoadingProspects(true);
      }, 0);
      getPreviousProspects(searchQuery)
        .then((data) => {
          if (!isCancelled) {
            setExistingProspects(data);
            setIsLoadingProspects(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            const local = getDistinctProspectsFromLocal(searchQuery);
            setExistingProspects(local);
            setIsLoadingProspects(false);
          }
        });
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, [isOpen, activeTab, searchQuery]);

  // Clean reset when closing
  const handleModalClose = useCallback(() => {
    setProspectName("");
    setCompanyName("");
    setProspectRole("");
    setPhoneNumber("");
    setErrors({});
    setSubmissionError(null);
    setSelectedProspect(null);
    setSearchQuery("");
    setActiveTab("new");
    onClose();
  }, [onClose]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        handleModalClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, handleModalClose]);

  if (!isOpen) return null;

  // Validation
  const validateForm = () => {
    const newErrors: { prospectName?: string; companyName?: string } = {};
    if (!prospectName.trim()) {
      newErrors.prospectName = "Prospect name is required";
    }
    if (!companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Start Call Handler (New or Existing)
  const handleStartCall = async (allowLocalFallback = false) => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmissionError(null);

    const payload = {
      prospectName: prospectName.trim(),
      companyName: companyName.trim(),
      prospectRole: prospectRole.trim() || "Caller",
      phoneNumber: phoneNumber.trim() || undefined,
    };

    try {
      const newCall = await createCall(payload);
      setActiveCallReference(newCall.id);
      setIsSubmitting(false);
      onClose();

      if (onSuccess) {
        onSuccess(newCall.id);
      } else {
        router.push(`/calls/${newCall.id}`);
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = (err as Error)?.message || "Failed to start call on backend.";

      if (allowLocalFallback) {
        // Explicit user opt-in for local fallback call
        const localId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `call_${Date.now()}`;
        setActiveCallReference(localId);
        onClose();
        if (onSuccess) {
          onSuccess(localId);
        } else {
          router.push(`/calls/${localId}`);
        }
        return;
      }

      setSubmissionError(`Backend connection failed: ${msg}. Call was not started.`);
    }
  };

  // Select existing prospect
  const handleSelectProspect = (p: ProspectSummary) => {
    setSelectedProspect(p);
    setProspectName(p.prospect_name);
    setCompanyName(p.company_name);
    setProspectRole(p.prospect_role || "");
    setPhoneNumber(p.phone_number || "");
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 transition-all overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-call-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="start-call-title" className="text-xl font-bold tracking-tight text-slate-900">
              Start Outbound Call
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Enter details for a new prospect or select a previously recorded contact.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 pt-3">
          <nav className="flex space-x-6" aria-label="Prospect Options">
            <button
              type="button"
              onClick={() => {
                setActiveTab("new");
                setSelectedProspect(null);
                setSubmissionError(null);
              }}
              className={`pb-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === "new"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              + New Prospect
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("existing");
                setSubmissionError(null);
              }}
              className={`pb-3 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeTab === "existing"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>Select Existing Prospect</span>
              {existingProspects.length > 0 && (
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {existingProspects.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Submission Error Banner */}
        {submissionError && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            <div className="flex items-start justify-between">
              <div>
                <strong>Call Initialization Blocked:</strong>
                <p className="mt-1 text-rose-700 leading-relaxed">{submissionError}</p>
              </div>
              <button
                type="button"
                onClick={() => setSubmissionError(null)}
                className="text-rose-500 hover:text-rose-700 font-bold ml-2"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartCall(false)}
                className="rounded-md bg-rose-600 px-3 py-1 font-semibold text-white shadow-xs hover:bg-rose-700 transition"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => handleStartCall(true)}
                className="rounded-md border border-rose-300 bg-white px-3 py-1 font-semibold text-rose-800 hover:bg-rose-50 transition"
              >
                Start in Offline Demo Mode
              </button>
            </div>
          </div>
        )}

        {/* Dialog Body */}
        <div className="p-6">
          {activeTab === "new" ? (
            /* TAB 1: NEW PROSPECT FORM */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStartCall(false);
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="prospectName" className="block text-xs font-semibold text-slate-800">
                  Prospect Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="prospectName"
                  type="text"
                  autoFocus
                  value={prospectName}
                  onChange={(e) => {
                    setProspectName(e.target.value);
                    if (errors.prospectName) setErrors((prev) => ({ ...prev, prospectName: undefined }));
                  }}
                  placeholder="e.g. Rahul Sharma"
                  className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden ${
                    errors.prospectName
                      ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/20"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  }`}
                />
                {errors.prospectName && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.prospectName}</p>
                )}
              </div>

              <div>
                <label htmlFor="companyName" className="block text-xs font-semibold text-slate-800">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: undefined }));
                  }}
                  placeholder="e.g. Apex Industrial Solutions"
                  className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden ${
                    errors.companyName
                      ? "border-rose-400 ring-1 ring-rose-400 bg-rose-50/20"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  }`}
                />
                {errors.companyName && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.companyName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="prospectRole" className="block text-xs font-semibold text-slate-800">
                    Prospect Role / Designation <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="prospectRole"
                    type="text"
                    value={prospectRole}
                    onChange={(e) => setProspectRole(e.target.value)}
                    placeholder="e.g. VP of Operations"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-xs font-semibold text-slate-800">
                    Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      <span>Creating Call...</span>
                    </>
                  ) : (
                    <span>Start Call &rarr;</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: SELECT EXISTING PROSPECT */
            <div className="space-y-4">
              {/* Search Bar */}
              <div>
                <label htmlFor="searchProspects" className="block text-xs font-semibold text-slate-800">
                  Search Previous Prospects
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="searchProspects"
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by prospect name, company, or phone..."
                    className="block w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Prospect Results List */}
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {isLoadingProspects ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent inline-block mr-2"></span>
                    Loading previous prospects...
                  </div>
                ) : existingProspects.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs font-medium text-slate-600">
                      {searchQuery.trim()
                        ? `No prospects match "${searchQuery}".`
                        : "No previous prospects recorded yet."}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {searchQuery.trim()
                        ? "Try a different search term or add them as a new prospect."
                        : "Switch to 'New Prospect' to enter details for your first call."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("new")}
                      className="mt-3 inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                    >
                      + Create New Prospect Instead
                    </button>
                  </div>
                ) : (
                  existingProspects.map((p) => {
                    const isSelected =
                      selectedProspect?.prospect_name === p.prospect_name &&
                      selectedProspect?.company_name === p.company_name;

                    return (
                      <div
                        key={`${p.prospect_name}-${p.company_name}`}
                        onClick={() => handleSelectProspect(p)}
                        className={`flex items-center justify-between p-3.5 transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-50/80 border-l-4 border-indigo-600"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {p.prospect_name}
                            </span>
                            {p.total_calls > 1 && (
                              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 font-medium">
                                {p.total_calls} calls
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {p.company_name} {p.prospect_role ? `• ${p.prospect_role}` : ""}
                          </p>
                          {p.phone_number && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              📞 {p.phone_number}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {isSelected ? "✓ Selected" : "Select"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Prospect Review & Confirmation Card */}
              {selectedProspect && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                      Selected Prospect Confirmation
                    </span>
                    <span className="text-[10px] text-indigo-600 font-medium">
                      Will create a new call record
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px]">Prospect:</span>
                      <p className="font-bold text-slate-900">{prospectName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Company:</span>
                      <p className="font-bold text-slate-900">{companyName}</p>
                    </div>
                    {prospectRole && (
                      <div>
                        <span className="text-slate-400 text-[11px]">Role:</span>
                        <p className="text-slate-700">{prospectRole}</p>
                      </div>
                    )}
                    {phoneNumber && (
                      <div>
                        <span className="text-slate-400 text-[11px]">Phone:</span>
                        <p className="text-slate-700 font-mono">{phoneNumber}</p>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500 italic">
                    Note: A brand new call record with a unique UUID will be created. Prior call history remains intact.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedProspect || isSubmitting}
                  onClick={() => handleStartCall(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      <span>Starting Call...</span>
                    </>
                  ) : (
                    <span>
                      Start Call with {selectedProspect ? selectedProspect.prospect_name : "Prospect"} &rarr;
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
