import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export interface BuilderTerrainMetrics {
  aoi_id: string;
  mean_elevation_m: number;
  min_elevation_m: number;
  max_elevation_m: number;
  mean_slope_deg: number;
  max_slope_deg: number;
  flat_land_percentage: number;
  terrain_roughness_m: number;
  dem_source: string;
  calculated_at: string;
}

export interface BuilderSuitabilityFactors {
  slope_score: number;
  flat_land_score: number;
  roughness_score: number;
  elevation_score: number;
  constraint_score: number | null;
}

export interface BuilderSuitabilityResponse {
  aoi_id: string;
  overall_score: number | null;
  terrain_score: number;
  constraint_score: number | null;
  factors: BuilderSuitabilityFactors;
  inputs: {
    mean_slope_deg: number;
    flat_land_percentage: number;
    terrain_roughness_m: number;
    mean_elevation_m: number;
    restricted_intersection_percentage: number | null;
  };
  positive_factors: string[];
  negative_factors: string[];
  constraint_status: "ASSESSED" | "UNAVAILABLE";
  constraint_unavailable_reason: string | null;
  calculated_at: string;
}

export function useBuilderTerrain(aoiId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["builder-terrain", aoiId],
    queryFn: async (): Promise<BuilderTerrainMetrics> => {
      if (!aoiId) throw new Error("No AOI ID provided");
      const response = await fetch(`${API_BASE_URL}/builder/aois/${aoiId}/terrain`);
      if (!response.ok) throw new Error(`Failed to fetch terrain metrics for ${aoiId}`);
      return response.json();
    },
    enabled: !!aoiId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBuilderSuitability(aoiId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["builder-suitability", aoiId],
    queryFn: async (): Promise<BuilderSuitabilityResponse> => {
      if (!aoiId) throw new Error("No AOI ID provided");
      const response = await fetch(`${API_BASE_URL}/builder/aois/${aoiId}/suitability`);
      if (!response.ok) throw new Error(`Failed to fetch suitability for ${aoiId}`);
      return response.json();
    },
    enabled: !!aoiId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}
