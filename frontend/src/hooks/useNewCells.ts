import { useMemo } from "react";
import type { YearGrid } from "@/api/types";
import { useLandChangeStore } from "@/store/landChangeStore";

export interface NewCell {
  id: string;
  row: number;
  col: number;
  detectionYear: number; // Year this cell was first detected as "new"
  height: number;
  index: number; // position in sorted list
}

export function useNewCells(year: number, grids: YearGrid[]) {
  return useMemo(() => {
    const currentGrid = grids.find((g) => g.year === year);
    if (!currentGrid) return [];

    const newCells: NewCell[] = [];
    
    // Find all "new" cells in the current year
    currentGrid.cells.forEach((cell) => {
      if (cell.class === "new") {
        // Find the year this cell was first detected as "new"
        let detectionYear = year;
        for (const grid of grids) {
          if (grid.year < year) {
            const cellInYear = grid.cells.find(
              (c) => c.row === cell.row && c.col === cell.col
            );
            if (cellInYear?.class === "new") {
              detectionYear = grid.year;
            }
          }
        }
        
        newCells.push({
          id: `R${cell.row}-C${cell.col}`,
          row: cell.row,
          col: cell.col,
          detectionYear,
          height: cell.height,
          index: newCells.length,
        });
      }
    });

    // Sort by detection year, then row, then column
    return newCells.sort((a, b) => {
      if (a.detectionYear !== b.detectionYear) return a.detectionYear - b.detectionYear;
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    }).map((cell, index) => ({
      ...cell,
      index, // Update index after sorting
    }));
  }, [year, grids]);
}

export function useSelectedCell() {
  const selectedCellId = useLandChangeStore.getState().selectedCellId;
  const setSelectedCellId = useLandChangeStore.getState().setSelectedCellId;
  
  const clearSelection = () => setSelectedCellId(null);
  
  return {
    selectedCellId,
    setSelectedCellId,
    clearSelection,
  };
}