import { z } from "zod";

export const GeocodeResultSchema = z.object({
  label: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});
export type GeocodeResult = z.infer<typeof GeocodeResultSchema>;

export const AnalysisRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius_m: z.number().int().min(100).max(2000).optional(),
  end_year: z.number().int().optional(),
});
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

export const InferenceMetadataSchema = z
  .object({
    crs: z.string().optional(),
    transform: z.array(z.number()).optional(),
    bounds: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .passthrough();

export const InferenceYearResultSchema = z
  .object({
    mask_path: z.string().optional(),
    geojson_path: z.string().optional(),
    total_pixels: z.number(),
    construction_pixels: z.number(),
    construction_percentage: z.number(),
    metadata: InferenceMetadataSchema.optional(),
    compliance: z.array(z.unknown()).optional(),
  })
  .passthrough();
export type InferenceYearResult = z.infer<typeof InferenceYearResultSchema>;

export const VisualizationYearResultSchema = z
  .object({
    geojson_path: z.string().optional(),
    categories: z.array(z.string()).optional(),
    statistics: z
      .record(
        z.object({
          pixel_count: z.number(),
          percentage: z.number(),
        }),
      )
      .optional(),
  })
  .passthrough()
  .nullable()
  .optional();

export const AnalysisStatusSchema = z.string();

export const AnalysisRecordSchema = z
  .object({
    id: z.string(),
    status: AnalysisStatusSchema,
    latitude: z.number(),
    longitude: z.number(),
    radius_m: z.number(),
    start_year: z.number(),
    end_year: z.number(),
    years: z.array(z.number()),
    gee_tasks: z.array(z.unknown()).optional(),
    downloads: z.record(z.string()).optional(),
    inference_results: z.record(InferenceYearResultSchema).default({}),
    visualization_results: z.record(z.unknown()).optional(),
    error: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();
export type AnalysisRecord = z.infer<typeof AnalysisRecordSchema>;

export const YearResultsSchema = z.object({
  year: z.number(),
  analysis_id: z.string(),
  inference: InferenceYearResultSchema,
  visualization: VisualizationYearResultSchema,
});
export type YearResults = z.infer<typeof YearResultsSchema>;

export const GeoJsonFeatureSchema = z
  .object({
    type: z.literal("Feature"),
    geometry: z
      .object({
        type: z.string(),
        coordinates: z.unknown(),
      })
      .passthrough(),
    properties: z
      .object({
        class: z.string().optional(),
        value: z.number().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const FeatureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(GeoJsonFeatureSchema),
  crs: z.unknown().optional(),
});
export type FeatureCollection = z.infer<typeof FeatureCollectionSchema>;

/** Frontend cell classes after year-diff */
export type CellClass = "land" | "existing" | "new";

export interface GridCell {
  row: number;
  col: number;
  class: CellClass;
  /** 0..1 relative height hint (backend has no per-cell height) */
  height: number;
}

export interface YearGrid {
  year: number;
  cells: GridCell[];
  rows: number;
  cols: number;
  builtUpPct: number;
  constructionPixels: number;
  totalPixels: number;
  source: "geojson" | "stats";
}

export const DESIGN_TOKENS = {
  land: "#22c55e",
  existing: "#f97316",
  new: "#ef4444",
  accent: "#38bdf8",
} as const;
