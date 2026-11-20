import { DESIGN_TOKENS } from "@/api/types";

export const SCENE_COLORS = {
  land: DESIGN_TOKENS.land,
  existing: DESIGN_TOKENS.existing,
  new: DESIGN_TOKENS.new,
  accent: DESIGN_TOKENS.accent,
  plate: "#0b1224",
  fog: "#05070f",
} as const;

export const CLASS_HEIGHT = {
  land: 0.06,
  existing: 0.85,
  new: 1.15,
} as const;
