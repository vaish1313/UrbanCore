import { create } from "zustand";

interface CellSelectionStore {
  selectedCellId: string | null; // Format: "R{row}-C{col}"
  hoveredCellId: string | null;
  setSelectedCellId: (cellId: string | null) => void;
  setHoveredCellId: (cellId: string | null) => void;
  clearSelection: () => void;
  clearHover: () => void;
}

export const useCellSelectionStore = create<CellSelectionStore>((set) => ({
  selectedCellId: null,
  hoveredCellId: null,
  setSelectedCellId: (cellId) => set({ selectedCellId: cellId }),
  setHoveredCellId: (cellId) => set({ hoveredCellId: cellId }),
  clearSelection: () => set({ selectedCellId: null }),
  clearHover: () => set({ hoveredCellId: null }),
}));