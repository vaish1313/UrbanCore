import { useMemo } from "react";
import type { YearGrid } from "@/api/types";

export interface CellChangeData {
  cellId: string;
  row: number;
  col: number;
  
  // Years
  currentYear: number;
  detectionYear: number; // First year cell was "new"
  beforeYear: number | null; // Last year cell was NOT "new"
  afterYear: number; // First year cell WAS "new" (same as detectionYear)
  
  // Classification history
  classes: Array<{ year: number; class: "land" | "existing" | "new" }>;
  
  // Stats
  cellHeight: number;
  confidence: null; // Not available in backend
  builtUpShare: number; // Approximate % of cell that is built-up (0-1)
  
  // Coordinate approximation
  approximateLat: number | null;
  approximateLng: number | null;
  approximateBbox: [number, number, number, number] | null;
  
  // Status
  isNewInCurrentYear: boolean;
  hasImagery: boolean;
}

export function useCellChange(
  cellId: string | null,
  year: number,
  grids: YearGrid[],
  analysisLat?: number,
  analysisLng?: number,
  analysisRadius?: number
): CellChangeData | null {
  return useMemo(() => {
    if (!cellId) return null;
    
    // Parse cell ID like "R7-C9"
    const match = cellId.match(/^R(\d+)-C(\d+)$/);
    if (!match || !match[1] || !match[2]) return null;

    const row = parseInt(match[1], 10);
    const col = parseInt(match[2], 10);
    
    // Get sorted years
    const sortedYears = [...grids.map(g => g.year)].sort((a, b) => a - b);
    const sortedGrids = [...grids].sort((a, b) => a.year - b.year);
    
    // Find cell in each year
    const classes = sortedGrids.map(grid => {
      const cell = grid.cells.find(c => c.row === row && c.col === col);
      return {
        year: grid.year,
        class: cell?.class || "land",
      };
    });
    
    // Find detection year (first "new")
    const newEntry = classes.find(c => c.class === "new");
    const detectionYear = newEntry?.year || year;
    
    // Find before year (last non-"new")
    const beforeEntry = [...classes]
      .reverse()
      .find(c => c.year < detectionYear && c.class !== "new");
    const beforeYear = beforeEntry?.year || null;
    
    // Get cell from current year for height
    const currentGrid = grids.find(g => g.year === year);
    const currentCell = currentGrid?.cells.find(c => c.row === row && c.col === col);
    const cellHeight = currentCell?.height || 0.5;
    
    // Approximate coordinates if analysis location is available
    let approximateLat: number | null = null;
    let approximateLng: number | null = null;
    let approximateBbox: [number, number, number, number] | null = null;
    
    if (analysisLat !== undefined && analysisLng !== undefined && analysisRadius !== undefined) {
      // Approximate degrees from meters (near equator/Nashik)
      const dLat = analysisRadius / 111320; // meters per degree latitude
      const dLng = analysisRadius / (111320 * Math.cos((analysisLat * Math.PI) / 180));
      
      // Grid is 40x40
      const cellSizeLat = (dLat * 2) / 40;
      const cellSizeLng = (dLng * 2) / 40;
      
      // Cell center
      approximateLat = analysisLat - dLat + (row + 0.5) * cellSizeLat;
      approximateLng = analysisLng - dLng + (col + 0.5) * cellSizeLng;
      
      // Cell bounding box
      approximateBbox = [
        approximateLng - cellSizeLng / 2, // west
        approximateLat - cellSizeLat / 2, // south
        approximateLng + cellSizeLng / 2, // east
        approximateLat + cellSizeLat / 2, // north
      ];
    }
    
    return {
      cellId,
      row,
      col,
      currentYear: year,
      detectionYear,
      beforeYear,
      afterYear: detectionYear,
      classes,
      cellHeight,
      confidence: null,
      builtUpShare: currentCell?.class === "new" ? 0.9 : currentCell?.class === "existing" ? 0.6 : 0.1,
      approximateLat,
      approximateLng,
      approximateBbox,
      isNewInCurrentYear: currentCell?.class === "new",
      hasImagery: false, // No imagery per cell in current backend
    };
  }, [cellId, year, grids, analysisLat, analysisLng, analysisRadius]);
}