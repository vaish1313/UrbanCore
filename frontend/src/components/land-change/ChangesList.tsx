import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronUp, 
  ChevronDown, 
  Filter, 
  SortAsc, 
  SortDesc,
  MapPin,
  Calendar,
  TrendingUp,
  Eye
} from "lucide-react";
import { useNewCells } from "@/hooks/useNewCells";
import { useLandChangeStore } from "@/store/landChangeStore";
import type { YearGrid, GridCell } from "@/api/types";

interface ChangesListProps {
  grids: YearGrid[];
  year: number;
  onCellSelect?: (cellId: string) => void;
}

type SortField = "row" | "col" | "detectionYear" | "height";
type SortDirection = "asc" | "desc";

export function ChangesList({ grids, year, onCellSelect }: ChangesListProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sortField, setSortField] = useState<SortField>("detectionYear");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterText, setFilterText] = useState("");
  
  const newCells = useNewCells(year, grids);
  const { selectedCellId, setSelectedCellId } = useLandChangeStore();
  
  // Sort and filter cells
  const filteredAndSortedCells = useMemo(() => {
    let filtered = newCells;
    
    // Apply text filter
    if (filterText.trim()) {
      const query = filterText.toLowerCase();
      filtered = filtered.filter(cell => 
        cell.id.toLowerCase().includes(query) ||
        cell.detectionYear.toString().includes(query)
      );
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      // Special handling for cell ID
      if (sortField === "row") {
        aVal = a.row;
        bVal = b.row;
      } else if (sortField === "col") {
        aVal = a.col;
        bVal = b.col;
      }
      
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [newCells, filterText, sortField, sortDirection]);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const handleCellClick = (cellId: string) => {
    setSelectedCellId(cellId);
    if (onCellSelect) {
      onCellSelect(cellId);
    }
  };
  
  const totalNewCells = newCells.length;
  
  if (totalNewCells === 0) {
    return (
      <div
        className="mt-4 p-4 text-center"
        style={{
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div className="text-sm mb-2" style={{ color: "#94a3b8" }}>
          No new construction detected in {year}
        </div>
        <div className="text-xs" style={{ color: "#64748b" }}>
          Try selecting a different year or location
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between transition-colors lce-inner-panel"
        style={{
          borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(56,189,248,0.35)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
              All Changes in {year}
            </span>
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#94a3b8",
            }}
          >
            {totalNewCells} new construction {totalNewCells === 1 ? "block" : "blocks"}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" style={{ color: "#64748b" }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: "#64748b" }} />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-3">
              {/* Search + sort — one row */}
              <div className="flex gap-2 items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter by cell ID or year..."
                    className="w-full text-sm focus:outline-none"
                    style={{
                      borderRadius: "10px",
                      border: "1px solid rgba(255,255,255,0.09)",
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      color: "#f1f5f9",
                      padding: "8px 12px 8px 36px",
                    }}
                  />
                  <Filter
                    className="absolute left-3 top-2.5 w-4 h-4"
                    style={{ color: "#64748b" }}
                  />
                </div>

                <button
                  onClick={() => handleSort("detectionYear")}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs transition shrink-0"
                  style={{
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.09)",
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    color: sortField === "detectionYear" ? "#38bdf8" : "#94a3b8",
                  }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Year</span>
                  {sortField === "detectionYear" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="w-3 h-3" style={{ color: "#38bdf8" }} />
                    ) : (
                      <SortDesc className="w-3 h-3" style={{ color: "#38bdf8" }} />
                    ))}
                </button>

                <button
                  onClick={() => handleSort("row")}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs transition shrink-0"
                  style={{
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.09)",
                    background: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    color: sortField === "row" ? "#38bdf8" : "#94a3b8",
                  }}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Grid</span>
                  {sortField === "row" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="w-3 h-3" style={{ color: "#38bdf8" }} />
                    ) : (
                      <SortDesc className="w-3 h-3" style={{ color: "#38bdf8" }} />
                    ))}
                </button>
              </div>

              {/* Cells list — taller scroll area */}
              <div
                className="overflow-y-auto"
                style={{
                  maxHeight: "460px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(56,189,248,0.3) transparent",
                }}
              >
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  {filteredAndSortedCells.map((cell) => {
                    const isSelected = selectedCellId === cell.id;

                    return (
                      <button
                        key={cell.id}
                        onClick={() => handleCellClick(cell.id)}
                        className="w-full p-3 text-left transition-colors"
                        style={{
                          background: isSelected
                            ? "rgba(56,189,248,0.08)"
                            : "transparent",
                          borderLeft: isSelected
                            ? "2px solid #38bdf8"
                            : "2px solid transparent",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                background: isSelected ? "#38bdf8" : "#ef4444",
                              }}
                            />
                            <div>
                              <div className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
                                {cell.id}
                              </div>
                              <div className="text-xs" style={{ color: "#64748b" }}>
                                Detected in {cell.detectionYear}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-xs" style={{ color: "#64748b" }}>
                              Height: {Math.round(cell.height * 100)}%
                            </div>
                            {isSelected && (
                              <Eye className="w-4 h-4" style={{ color: "#38bdf8" }} />
                            )}
                          </div>
                        </div>

                        {/* Thumbnail */}
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className="w-8 h-8 flex items-center justify-center"
                            style={{
                              borderRadius: "6px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              background:
                                "linear-gradient(135deg, rgba(239,68,68,0.20), rgba(239,68,68,0.08))",
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded-sm"
                              style={{ background: "rgba(239,68,68,0.5)" }}
                            />
                          </div>
                          <div className="text-xs" style={{ color: "#475569" }}>
                            Schematic preview · Cell {cell.row}, {cell.col}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {filteredAndSortedCells.length === 0 && (
                  <div className="p-4 text-center">
                    <div className="text-sm" style={{ color: "#94a3b8" }}>
                      No cells match "{filterText}"
                    </div>
                    <button
                      onClick={() => setFilterText("")}
                      className="mt-2 text-xs"
                      style={{ color: "#38bdf8" }}
                    >
                      Clear filter
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-xs text-center" style={{ color: "#475569" }}>
                Showing {filteredAndSortedCells.length} of {totalNewCells} cells
                {filterText && " (filtered)"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}