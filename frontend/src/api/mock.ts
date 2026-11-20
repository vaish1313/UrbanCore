/**
 * Mock layer — only active when VITE_USE_MOCK=true. OFF by default.
 * Separated so the real UI never depends on this data path.
 */
import type {
  AnalysisRecord,
  AnalysisRequest,
  FeatureCollection,
  GeocodeResult,
} from "./types";

const YEARS = [2021, 2022, 2023, 2024, 2025, 2026];
const PCT = [68.2, 70.1, 71.4, 72.0, 72.6, 73.1];

let mockRecord: AnalysisRecord | null = null;

export async function mockSearchLocations(q: string): Promise<GeocodeResult[]> {
  await delay(200);
  return [
    {
      label: q || "Nashik, Maharashtra, India",
      latitude: 20.0059,
      longitude: 73.7912,
    },
  ];
}

export async function mockCreateAnalysis(
  body: AnalysisRequest,
): Promise<AnalysisRecord> {
  await delay(300);
  const end = body.end_year ?? new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => end - 5 + i);
  mockRecord = {
    id: "mock-analysis-id",
    status: "completed",
    latitude: body.latitude,
    longitude: body.longitude,
    radius_m: body.radius_m ?? 2000,
    start_year: end - 5,
    end_year: end,
    years,
    inference_results: Object.fromEntries(
      years.map((y, i) => [
        String(y),
        {
          total_pixels: 170850,
          construction_pixels: Math.round((PCT[i] ?? 70) * 1708.5),
          construction_percentage: PCT[i] ?? 70,
          metadata: {
            crs: "EPSG:4326",
            bounds: [73.77, 19.98, 73.81, 20.02] as [number, number, number, number],
            width: 40,
            height: 40,
          },
        },
      ]),
    ),
    visualization_results: {},
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return mockRecord;
}

export async function mockGetAnalysis(id: string): Promise<AnalysisRecord> {
  await delay(150);
  if (!mockRecord || mockRecord.id !== id) {
    // Auto-complete a completed mock if Scan was never called in this session
    mockRecord = await mockCreateAnalysis({
      latitude: 20.0059,
      longitude: 73.7912,
      radius_m: 2000,
    });
    mockRecord.id = id;
  }
  return mockRecord;
}

export async function mockGetGeoJson(
  _id: string,
  _year: number,
): Promise<FeatureCollection> {
  await delay(100);
  // Empty collection → client falls back to stats grid (documented path)
  return { type: "FeatureCollection", features: [] };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export { YEARS as MOCK_YEARS };
