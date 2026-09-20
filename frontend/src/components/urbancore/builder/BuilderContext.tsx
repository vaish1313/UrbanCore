import { createContext, useContext } from "react";
import type { AOI } from "@/types/urbancore";

export interface BuilderContextType {
  selectedAoi: AOI;
  setSelectedAoi: (aoi: AOI) => void;
  setIsReportOpen: (open: boolean) => void;
}

export const BuilderContext = createContext<BuilderContextType | null>(null);

export function useBuilderContext() {
  const ctx = useContext(BuilderContext);
  if (!ctx) {
    throw new Error("useBuilderContext must be used within BuilderLayout / BuilderDashboard");
  }
  return ctx;
}
