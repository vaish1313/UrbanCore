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
  slope_score: number | null;
  flat_land_score: number | null;
  roughness_score: number | null;
  elevation_drainage_score: number | null;
  constraint_score: number | null;
}

export interface DetailedConstraintItem {
  type: string;
  name: string;
  status: "CLEAR" | "OVERLAP" | "NO_DATA" | "UNKNOWN";
  affected_area_ha: number | null;
  affected_percentage: number | null;
  description: string;
}

export interface DetailedConstraintsResponse {
  aoi_id: string;
  name: string;
  location?: string;
  status: "ASSESSED" | "UNAVAILABLE" | "INCOMPLETE";
  is_approximate_geometry?: boolean;
  aoi_area_ha?: number;
  overall_overlap_pct: number | null;
  constraint_score: number | null;
  blocker_status: "ASSESSED_NO_INTERSECTION" | "POTENTIAL_RESTRICTION_REVIEW" | "CONFIRMED_BLOCKER" | "UNAVAILABLE" | "INCOMPLETE";
  layers_analyzed: number;
  overlapping_layers: number;
  clear_layers: number;
  no_data_layers: number;
  constraints: DetailedConstraintItem[];
  factual_summary: string;
  reason?: string;
}

export interface BuilderSuitabilityResponse {
  aoi_id: string;
  overall_status: "ASSESSED" | "UNAVAILABLE" | "INCOMPLETE";
  overall_score: number | null;
  terrain_status: "ASSESSED" | "UNAVAILABLE" | "INCOMPLETE";
  terrain_score: number | null;
  constraint_status: "ASSESSED" | "UNAVAILABLE" | "INCOMPLETE";
  constraint_score: number | null;
  blocker_status: "ASSESSED_NO_INTERSECTION" | "POTENTIAL_RESTRICTION_REVIEW" | "CONFIRMED_BLOCKER" | "UNAVAILABLE" | "INCOMPLETE";
  is_approximate_geometry?: boolean;
  weights: {
    slope_score: number;
    flat_land_score: number;
    roughness_score: number;
    elevation_drainage_score: number;
  };
  factors: BuilderSuitabilityFactors;
  inputs: {
    mean_slope_deg: number | null;
    p85_slope_deg?: number | null;
    steep_slope_percentage?: number | null;
    flat_land_percentage: number | null;
    terrain_roughness_m: number | null;
    mean_elevation_m: number | null;
    restricted_intersection_percentage: number | null;
  };
  detailed_constraints?: DetailedConstraintsResponse;
  warnings?: string[];
  availability_reasons?: {
    terrain?: string;
    elevation_drainage?: string;
    terrain_score?: string;
    constraints?: string;
  };
  positive_factors: string[];
  negative_factors: string[];
  calculated_at: string;
}

export interface PointTerrainMetrics {
  lat: number;
  lng: number;
  elevation_m: number;
  min_elevation_m: number;
  max_elevation_m: number;
  slope_deg: number;
  terrain_roughness_m: number;
  is_flat: boolean;
  dem_source: string;
  is_preliminary: boolean;
  screening_type: string;
  screening_note: string;
  calculated_at: string;
}

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof HttpError && (error.status === 404 || error.status === 422)) {
    return false;
  }
  return failureCount < 2;
}

function isQueryAllowed(aoiId: string | undefined, enabled: boolean): boolean {
  return Boolean(aoiId && enabled && !aoiId.startsWith("aoi-"));
}

export function useBuilderTerrain(aoiId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["builder-terrain", aoiId],
    queryFn: async (): Promise<BuilderTerrainMetrics> => {
      if (!aoiId) throw new Error("No AOI ID provided");
      const response = await fetch(`${API_BASE_URL}/builder/aois/${aoiId}/terrain`);
      if (!response.ok) {
        throw new HttpError(`Failed to fetch terrain metrics for ${aoiId}`, response.status);
      }
      return response.json();
    },
    enabled: isQueryAllowed(aoiId, enabled),
    retry: shouldRetry,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBuilderPointTerrain(coords?: { lat: number; lng: number }, enabled = true) {
  const isValidCoord = Boolean(
    coords &&
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.lng) &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  );

  return useQuery({
    queryKey: ["builder-point-terrain", coords?.lat, coords?.lng],
    queryFn: async (): Promise<PointTerrainMetrics> => {
      if (!coords) throw new Error("No coordinates provided");
      const response = await fetch(`${API_BASE_URL}/builder/terrain/coordinate?lat=${coords.lat}&lng=${coords.lng}`);
      if (!response.ok) {
        throw new HttpError(`Failed to fetch coordinate terrain for (${coords.lat}, ${coords.lng})`, response.status);
      }
      return response.json();
    },
    enabled: Boolean(enabled && isValidCoord),
    retry: shouldRetry,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBuilderSuitability(aoiId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["builder-suitability", aoiId],
    queryFn: async (): Promise<BuilderSuitabilityResponse> => {
      if (!aoiId) throw new Error("No AOI ID provided");
      const response = await fetch(`${API_BASE_URL}/builder/aois/${aoiId}/suitability`);
      if (!response.ok) {
        throw new HttpError(`Failed to fetch suitability for ${aoiId}`, response.status);
      }
      return response.json();
    },
    enabled: isQueryAllowed(aoiId, enabled),
    retry: shouldRetry,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBuilderConstraints(aoiId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["builder-constraints", aoiId],
    queryFn: async (): Promise<DetailedConstraintsResponse> => {
      if (!aoiId) throw new Error("No AOI ID provided");
      const response = await fetch(`${API_BASE_URL}/violations/constraints/${aoiId}`);
      if (!response.ok) {
        throw new HttpError(`Failed to fetch constraints for ${aoiId}`, response.status);
      }
      return response.json();
    },
    enabled: isQueryAllowed(aoiId, enabled),
    retry: shouldRetry,
    staleTime: 5 * 60 * 1000,
  });
}

