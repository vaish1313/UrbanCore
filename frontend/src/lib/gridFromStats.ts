import type { CellClass, GridCell, InferenceYearResult, YearGrid } from "@/api/types";

const DEFAULT_SIZE = 40;

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Deterministic shuffle of cell indices, seeded by location + constant. */
export function generateCellOrder(
  total: number,
  seed: number,
): number[] {
  const cells = Array.from({ length: total }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells;
}

function locationSeed(lat: number, lng: number): number {
  return Math.round((lat + 90) * 1e4 + (lng + 180) * 1e2) + 42;
}

/**
 * Build per-year grids from aggregate construction_percentage.
 * Mirrors the prior 2D heatmap: cells activate cumulatively; cells that
 * first appear in the selected year are "new", earlier ones "existing".
 */
export function buildGridsFromStats(opts: {
  years: number[];
  inference: Record<string, InferenceYearResult>;
  latitude: number;
  longitude: number;
  size?: number;
}): YearGrid[] {
  const size = opts.size ?? DEFAULT_SIZE;
  const total = size * size;
  const order = generateCellOrder(total, locationSeed(opts.latitude, opts.longitude));
  const sorted = [...opts.years].sort((a, b) => a - b);

  const activeCountByYear = new Map<number, number>();
  let prev = 0;
  for (const year of sorted) {
    const pct = opts.inference[String(year)]?.construction_percentage ?? 0;
    const count = Math.max(prev, Math.round((pct / 100) * total));
    activeCountByYear.set(year, count);
    prev = count;
  }

  return sorted.map((year) => {
    const active = activeCountByYear.get(year) ?? 0;
    const yearIdx = sorted.indexOf(year);
    const prevYear = yearIdx > 0 ? sorted[yearIdx - 1] : null;
    const prevActive = prevYear != null ? (activeCountByYear.get(prevYear) ?? 0) : 0;

    const cells: GridCell[] = [];
    for (let i = 0; i < total; i++) {
      const cellIndex = order[i];
      const row = Math.floor(cellIndex / size);
      const col = cellIndex % size;
      let cls: CellClass = "land";
      let height = 0.05;

      if (i < active) {
        if (i >= prevActive) {
          cls = "new";
          height = 0.95;
        } else {
          cls = "existing";
          height = 0.55 + seededRandom(cellIndex + year) * 0.35;
        }
      }

      cells.push({ row, col, class: cls, height });
    }

    // Sort spatially for stable instancing
    cells.sort((a, b) => a.row * size + a.col - (b.row * size + b.col));

    const inf = opts.inference[String(year)];
    return {
      year,
      cells,
      rows: size,
      cols: size,
      builtUpPct: inf?.construction_percentage ?? (active / total) * 100,
      constructionPixels: inf?.construction_pixels ?? active,
      totalPixels: inf?.total_pixels ?? total,
      source: "stats" as const,
    };
  });
}

export function classifyChangesOnly(cells: GridCell[]): GridCell[] {
  return cells.map((c) =>
    c.class === "new" ? c : { ...c, class: "land" as CellClass, height: 0.02 },
  );
}
