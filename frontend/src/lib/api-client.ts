import { CallSession, FinalOutcome, StageData, StageNumber } from "@/types";

export interface BackendStageResult {
  id: string;
  call_id: string;
  stage_number: number;
  stage_outcome: string | null;
  prospect_words: string | null;
  additional_data: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface BackendCallResponse {
  id: string;
  prospect_name: string;
  company_name: string;
  prospect_role: string;
  status: "in_progress" | "completed";
  current_stage: number;
  furthest_stage_reached: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  final_outcome: string | null;
  next_step_notes: string | null;
  created_at?: string;
  updated_at?: string;
  stage_results: BackendStageResult[];
}

export interface BackendCallListResponse {
  items: BackendCallResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, "");
  }
  return "http://localhost:8000";
}

/**
 * Maps backend call response to the frontend's CallSession domain model.
 */
export function mapBackendCallToSession(data: BackendCallResponse): CallSession {
  const stageResultsMap: Record<StageNumber, StageData> = {
    1: { selectedOutcome: null, prospectWords: "", extraData: {} },
    2: { selectedOutcome: null, prospectWords: "", extraData: {} },
    3: { selectedOutcome: null, prospectWords: "", extraData: {} },
    4: { selectedOutcome: null, prospectWords: "", extraData: {} },
    5: { selectedOutcome: null, prospectWords: "", extraData: {} },
    6: { selectedOutcome: null, prospectWords: "", extraData: {} },
    7: { selectedOutcome: null, prospectWords: "", extraData: {} },
    8: { selectedOutcome: null, prospectWords: "", extraData: {} },
  };

  if (Array.isArray(data.stage_results)) {
    for (const s of data.stage_results) {
      if (s.stage_number >= 1 && s.stage_number <= 8) {
        stageResultsMap[s.stage_number as StageNumber] = {
          selectedOutcome: s.stage_outcome || null,
          prospectWords: s.prospect_words || "",
          extraData: s.additional_data as Record<string, string> || {},
          updatedAt: s.updated_at,
        };
      }
    }
  }

  return {
    id: data.id,
    prospectName: data.prospect_name,
    companyName: data.company_name,
    prospectRole: data.prospect_role,
    status: data.status,
    currentStage: data.current_stage as StageNumber,
    furthestStageReached: data.furthest_stage_reached as StageNumber,
    startedAt: data.started_at,
    endedAt: data.ended_at || undefined,
    durationSeconds: data.duration_seconds || 0,
    finalOutcome: (data.final_outcome as FinalOutcome) || null,
    nextStepNotes: data.next_step_notes || undefined,
    stageResults: stageResultsMap,
  };
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Perform a fetch request to the FastAPI backend with timeout and error handling.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout for Render cold starts

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errMsg = `Request failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) {
          errMsg = errJson.detail;
        }
      } catch {
        // Fallback to text status
      }
      throw new ApiError(errMsg, res.status);
    }

    return await res.json();
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if ((err as Error)?.name === "AbortError") {
      throw new ApiError("Backend request timed out. Render free instance may be waking up.", 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError((err as Error)?.message || "Unable to reach backend service.", 503);
  }
}

// -------------------------------------------------------------
// Core REST API Methods
// -------------------------------------------------------------

export async function checkBackendHealth(): Promise<{ status: string; database?: string }> {
  return apiFetch<{ status: string; database?: string }>("/health");
}

export async function createCall(payload: {
  prospectName: string;
  companyName: string;
  prospectRole: string;
  id?: string;
  startedAt?: string;
}): Promise<CallSession> {
  const body = {
    prospect_name: payload.prospectName,
    company_name: payload.companyName,
    prospect_role: payload.prospectRole,
    id: payload.id,
    started_at: payload.startedAt,
  };

  const res = await apiFetch<BackendCallResponse>("/api/calls", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return mapBackendCallToSession(res);
}

export async function getCall(id: string): Promise<CallSession> {
  const res = await apiFetch<BackendCallResponse>(`/api/calls/${id}`);
  return mapBackendCallToSession(res);
}

export async function updateCallStage(
  callId: string,
  stageNumber: number,
  payload: {
    stageOutcome?: string | null;
    prospectWords?: string;
    additionalData?: Record<string, unknown>;
  }
): Promise<BackendStageResult> {
  const body = {
    stage_outcome: payload.stageOutcome,
    prospect_words: payload.prospectWords,
    additional_data: payload.additionalData,
  };

  return apiFetch<BackendStageResult>(`/api/calls/${callId}/stages/${stageNumber}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function closeCall(
  callId: string,
  payload: {
    finalOutcome: FinalOutcome;
    durationSeconds: number;
    nextStepNotes?: string;
    endedAt?: string;
  }
): Promise<CallSession> {
  const body = {
    final_outcome: payload.finalOutcome,
    duration_seconds: payload.durationSeconds,
    next_step_notes: payload.nextStepNotes,
    ended_at: payload.endedAt,
  };

  const res = await apiFetch<BackendCallResponse>(`/api/calls/${callId}/close`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return mapBackendCallToSession(res);
}

export async function listCalls(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  outcome?: string;
  stage?: number | "all";
} = {}): Promise<{
  items: CallSession[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  if (params.search && params.search.trim()) query.set("search", params.search.trim());
  if (params.outcome && params.outcome !== "all") query.set("outcome", params.outcome);
  if (params.stage && params.stage !== "all") query.set("stage", String(params.stage));

  const qs = query.toString() ? `?${query.toString()}` : "";
  const res = await apiFetch<BackendCallListResponse>(`/api/calls${qs}`);

  return {
    items: res.items.map(mapBackendCallToSession),
    total: res.total,
    page: res.page,
    pageSize: res.page_size,
    totalPages: res.total_pages,
  };
}
