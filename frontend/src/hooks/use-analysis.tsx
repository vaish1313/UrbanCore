import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface YearData {
  year: number;
  construction_percentage: number;
  construction_pixels: number;
  total_pixels: number;
  geojson_path?: string;
  mask_path?: string;
  metadata?: {
    crs: string;
    transform: number[];
    bounds: number[];
    width: number;
    height: number;
  };
}

interface VisualizationData {
  geojson_path?: string;
  categories?: string[];
  statistics?: Record<string, { pixel_count: number; percentage: number }>;
}

interface AnalysisData {
  id: string;
  status: string;
  latitude: number;
  longitude: number;
  radius_m: number;
  start_year: number;
  end_year: number;
  years: number[];
  inference_results?: Record<string, YearData>;
  visualization_results?: Record<string, VisualizationData>;
  error?: string;
  message?: string;
  created_at: string;
  updated_at: string;
}

export function useAnalysis(analysisId: string | undefined) {
  return useQuery({
    queryKey: ["analysis", analysisId],
    queryFn: async (): Promise<AnalysisData> => {
      if (!analysisId) {
        throw new Error("No analysis ID provided");
      }

      const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch analysis data");
      }

      return response.json();
    },
    enabled: !!analysisId,
    refetchInterval: (data) => {
      // Keep polling if analysis is still in progress
      if (data?.status && !["completed", "failed"].includes(data.status)) {
        return 30000; // Poll every 30 seconds
      }
      return false; // Stop polling when completed or failed
    },
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

export function useAnalysisYearResult(analysisId: string | undefined, year: number | undefined) {
  return useQuery({
    queryKey: ["analysis-year", analysisId, year],
    queryFn: async () => {
      if (!analysisId || !year) {
        throw new Error("Analysis ID and year required");
      }

      const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}/results/${year}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Year data not available yet
        }
        throw new Error("Failed to fetch year results");
      }

      return response.json();
    },
    enabled: !!analysisId && !!year,
    staleTime: 5 * 60 * 1000, // Year results don't change often, cache for 5 minutes
  });
}

export function useAnalysisGeoJSON(
  analysisId: string | undefined,
  year: number | undefined,
  fileType: "inference" | "visualization" = "inference"
) {
  return useQuery({
    queryKey: ["analysis-geojson", analysisId, year, fileType],
    queryFn: async () => {
      if (!analysisId || !year) {
        throw new Error("Analysis ID and year required");
      }

      const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}/geojson/${year}/${fileType}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null; // GeoJSON not available yet
        }
        throw new Error(`Failed to fetch ${fileType} GeoJSON`);
      }

      return response.json();
    },
    enabled: !!analysisId && !!year,
    staleTime: 10 * 60 * 1000, // GeoJSON files are immutable, cache for 10 minutes
  });
}

export type { AnalysisData, YearData, VisualizationData };