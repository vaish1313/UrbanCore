import { create } from "zustand";

export type ViewMode = "3d" | "top";

interface LandChangeState {
  year: number;
  playing: boolean;
  viewMode: ViewMode;
  changesOnly: boolean;
  autoRotate: boolean;
  years: number[];
  selectedCellId: string | null; // Format: "R{row}-C{col}"
  hoveredCellId: string | null;
  /** When set, the map view is showing this cell */
  mapFocusCellId: string | null;
  setYear: (year: number) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setViewMode: (mode: ViewMode) => void;
  setChangesOnly: (v: boolean) => void;
  toggleChangesOnly: () => void;
  setAutoRotate: (v: boolean) => void;
  toggleAutoRotate: () => void;
  setYears: (years: number[]) => void;
  setSelectedCellId: (cellId: string | null) => void;
  setHoveredCellId: (cellId: string | null) => void;
  clearCellSelection: () => void;
  clearCellHover: () => void;
  setMapFocusCellId: (cellId: string | null) => void;
  resetUi: () => void;
}

const initial = {
  year: 0,
  playing: false,
  viewMode: "3d" as ViewMode,
  changesOnly: false,
  autoRotate: true,
  years: [] as number[],
  selectedCellId: null,
  hoveredCellId: null,
  mapFocusCellId: null,
};

export const useLandChangeStore = create<LandChangeState>((set, get) => ({
  ...initial,
  setYear: (year) => set({ 
    year,
    // Clear selection if the selected cell is not "new" in this year
    selectedCellId: null,
  }),
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set({ playing: !get().playing }),
  setViewMode: (viewMode) => set({ viewMode }),
  setChangesOnly: (changesOnly) => set({ changesOnly }),
  toggleChangesOnly: () => set({ changesOnly: !get().changesOnly }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  toggleAutoRotate: () => set({ autoRotate: !get().autoRotate }),
  setYears: (years) =>
    set({
      years,
      year: years.length ? (years[years.length - 1] ?? 0) : 0,
    }),
  setSelectedCellId: (cellId) => set({ 
    selectedCellId: cellId,
    // Pause auto-rotate when a cell is selected
    autoRotate: cellId ? false : get().autoRotate,
  }),
  setHoveredCellId: (cellId) => set({ hoveredCellId: cellId }),
  clearCellSelection: () => set({ 
    selectedCellId: null,
    // Restore auto-rotate
    autoRotate: initial.autoRotate,
  }),
  clearCellHover: () => set({ hoveredCellId: null }),
  setMapFocusCellId: (cellId) => set({ mapFocusCellId: cellId }),
  resetUi: () => set({ ...initial }),
}));
