import { useMemo } from "react";

interface ConstructionHeatmapGridProps {
  yearlyData: Array<{
    year: number;
    built_up_pct: number;
  }>;
  selectedYear: number;
  availableYears: number[];
}

// Seeded random number generator for deterministic cell ordering
function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate deterministic cell order with seed 42
function generateCellOrder(seed: number = 42): number[] {
  const cells: number[] = [];
  for (let i = 0; i < 400; i++) {
    cells.push(i);
  }

  // Shuffle using seeded random
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  return cells;
}

export function ConstructionHeatmapGrid({
  yearlyData,
  selectedYear,
  availableYears
}: ConstructionHeatmapGridProps) {

  // Generate deterministic cell order once
  const cellOrder = useMemo(() => generateCellOrder(42), []);

  // Calculate cell states for each year cumulatively
  const cellStates = useMemo(() => {
    const states: { [cellIndex: number]: 'inactive' | 'existing' | 'new' } = {};

    // Initialize all cells as inactive
    for (let i = 0; i < 400; i++) {
      states[i] = 'inactive';
    }

    let previousActiveCells = 0;

    // Process years in order to build cumulative state
    const sortedYears = [...availableYears].sort((a, b) => a - b);

    for (const year of sortedYears) {
      const yearData = yearlyData.find(d => d.year === year);
      if (!yearData) continue;

      const builtUpPct = yearData.built_up_pct || 0;
      const currentActiveCells = Math.round((builtUpPct / 100) * 400);

      // Activate cells cumulatively - never deactivate previously active cells
      const cellsToActivate = Math.max(currentActiveCells, previousActiveCells);

      // Mark cells as existing (from previous years) or new (this year)
      for (let i = 0; i < cellsToActivate; i++) {
        const cellIndex = cellOrder[i];
        if (i < previousActiveCells) {
          // Cell was active in previous years
          if (year <= selectedYear) {
            states[cellIndex] = 'existing';
          }
        } else {
          // Cell is newly activated this year
          if (year === selectedYear) {
            states[cellIndex] = 'new';
          } else if (year < selectedYear) {
            states[cellIndex] = 'existing';
          }
        }
      }

      if (year <= selectedYear) {
        previousActiveCells = cellsToActivate;
      }
    }

    return states;
  }, [yearlyData, selectedYear, availableYears, cellOrder]);

  return (
    <div className="w-full aspect-square max-w-lg mx-auto">
      <div
        className="grid gap-0 w-full h-full border border-white/10 rounded-2xl overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(20, 1fr)',
          gridTemplateRows: 'repeat(20, 1fr)'
        }}
      >
        {Array.from({ length: 400 }, (_, index) => {
          const state = cellStates[index];

          let cellClass = "w-full aspect-square transition-colors duration-300";

          switch (state) {
            case 'inactive':
              cellClass += " bg-slate-950"; // #0f172a equivalent
              break;
            case 'existing':
              cellClass += " bg-orange-500"; // #f97316 equivalent
              break;
            case 'new':
              cellClass += " bg-red-500 animate-pulse"; // #ef4444 equivalent with pulse
              break;
          }

          return (
            <div
              key={index}
              className={cellClass}
              style={{
                backgroundColor:
                  state === 'inactive' ? '#0f172a' :
                    state === 'existing' ? '#f97316' :
                      state === 'new' ? '#ef4444' : '#0f172a'
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#0f172a' }}></div>
          <span className="text-slate-400">Non-built-up</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#f97316' }}></div>
          <span className="text-slate-400">Existing construction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm animate-pulse" style={{ backgroundColor: '#ef4444' }}></div>
          <span className="text-slate-400">New construction (this year)</span>
        </div>
      </div>
    </div>
  );
}