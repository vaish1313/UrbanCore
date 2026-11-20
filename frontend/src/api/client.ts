import {
  AnalysisRecordSchema,
  AnalysisRequestSchema,
  FeatureCollectionSchema,
  GeocodeResultSchema,
  YearResultsSchema,
  type AnalysisRecord,
  type AnalysisRequest,
  type FeatureCollection,
  type GeocodeResult,
  type YearResults,
} from "./types";
import { mockCreateAnalysis, mockGetAnalysis, mockGetGeoJson, mockSearchLocations } from "./mock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/**
 * Prefer VITE_API_URL. In dev, set to `/api/v1` and use the Vite proxy
 * so the browser never talks cross-origin to the backend.
 */
function apiBase(): string {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw || typeof raw !== "string" || raw.trim() === "") {
    throw new Error(
      "VITE_API_URL is not set. Add it to .env (e.g. VITE_API_URL=/api/v1).",
    );
  }
  return raw.replace(/\/$/, "");
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON from API (${res.status})`);
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  parse?: (data: unknown) => T,
): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ?? body?.message ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : `HTTP ${res.status}`);
  }

  const data = await parseJson(res);
  return parse ? parse(data) : (data as T);
}

export const api = {
  searchLocations(q: string): Promise<GeocodeResult[]> {
    if (USE_MOCK) return mockSearchLocations(q);
    return request(
      `/locations/search?q=${encodeURIComponent(q)}`,
      undefined,
      (data) => GeocodeResultSchema.array().parse(data),
    );
  },

  createAnalysis(body: AnalysisRequest): Promise<AnalysisRecord> {
    const payload = AnalysisRequestSchema.parse(body);
    if (USE_MOCK) return mockCreateAnalysis(payload);
    return request(
      "/analyses",
      { method: "POST", body: JSON.stringify(payload) },
      (data) => AnalysisRecordSchema.parse(data),
    );
  },

  getAnalysis(id: string): Promise<AnalysisRecord> {
    if (USE_MOCK) return mockGetAnalysis(id);
    return request(`/analyses/${id}`, undefined, (data) =>
      AnalysisRecordSchema.parse(data),
    );
  },

  getYearResults(id: string, year: number): Promise<YearResults> {
    return request(`/analyses/${id}/results/${year}`, undefined, (data) =>
      YearResultsSchema.parse(data),
    );
  },

  getGeoJson(
    id: string,
    year: number,
    fileType: "inference" | "visualization" = "inference",
  ): Promise<FeatureCollection> {
    if (USE_MOCK) return mockGetGeoJson(id, year);
    return request(
      `/analyses/${id}/geojson/${year}/${fileType}`,
      undefined,
      (data) => FeatureCollectionSchema.parse(data),
    );
  },
};

export { USE_MOCK };
