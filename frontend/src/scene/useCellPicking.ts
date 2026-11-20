import { useCallback, useRef, useEffect } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { YearGrid } from "@/api/types";
import { useLandChangeStore } from "@/store/landChangeStore";

export interface CellPickResult {
  row: number;
  col: number;
  cellId: string;
  distance: number;
  point: THREE.Vector3;
}

/**
 * Picks only "new" cells. Uses pointerDown + pointerUp pair to distinguish
 * a real click from an orbit drag (if pointer moved > 4px it's a drag, not a click).
 */
export function useCellPicking(
  grid: YearGrid,
  changesOnly: boolean,
  onCellSelect?: (result: CellPickResult) => void,
  onCellHover?: (result: CellPickResult | null) => void,
) {
  const half = (grid.cols - 1) / 2;

  // Track pointer-down position to distinguish click vs drag
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const pendingPickRef = useRef<CellPickResult | null>(null);

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastHoverRef = useRef<string | null>(null);

  const newCells = grid.cells.filter((c) => c.class === "new");

  /** Extract a CellPickResult from any ThreeEvent, or null if not a selectable cell */
  const extractCell = useCallback(
    (event: ThreeEvent<PointerEvent | MouseEvent>): CellPickResult | null => {
      // Find the first intersection that is an InstancedMesh
      const hit = event.intersections.find(
        (i) => i.object instanceof THREE.InstancedMesh,
      );
      if (!hit) return null;

      const instanceId = hit.instanceId;
      if (instanceId === undefined || instanceId === null) return null;

      const row = Math.floor(instanceId / grid.cols);
      const col = instanceId % grid.cols;

      const cell = grid.cells.find((c) => c.row === row && c.col === col);
      if (!cell || cell.class !== "new") return null;

      return {
        row,
        col,
        cellId: `R${row}-C${col}`,
        distance: hit.distance,
        point: hit.point.clone(),
      };
    },
    [grid],
  );

  // ── Hover ────────────────────────────────────────────────────────────────
  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const result = extractCell(event);

      if (!result) {
        if (onCellHover) onCellHover(null);
        lastHoverRef.current = null;
        return;
      }

      if (lastHoverRef.current === result.cellId) return;
      lastHoverRef.current = result.cellId;

      if (hoverTimeoutRef.current !== undefined) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        if (onCellHover) onCellHover(result);
      }, 30);
    },
    [extractCell, onCellHover],
  );

  // ── Click (down + up pair, ignores drags) ────────────────────────────────
  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // Stop propagation so OrbitControls doesn't eat the event
      event.stopPropagation();
      pointerDownPos.current = { x: event.clientX, y: event.clientY };
      pendingPickRef.current = extractCell(event);
    },
    [extractCell],
  );

  const handlePointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      const down = pointerDownPos.current;
      const pick = pendingPickRef.current;
      pointerDownPos.current = null;
      pendingPickRef.current = null;

      if (!down || !pick) return;

      // If pointer moved more than 5px it was a drag — ignore
      const dx = event.clientX - down.x;
      const dy = event.clientY - down.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return;

      if (onCellSelect) onCellSelect(pick);
    },
    [onCellSelect],
  );

  const handlePointerOut = useCallback(() => {
    if (onCellHover) onCellHover(null);
    lastHoverRef.current = null;
  }, [onCellHover]);

  // ── Keyboard navigation ──────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { selectedCellId } = useLandChangeStore.getState();
      if (!newCells.length) return;

      switch (event.key) {
        case "Escape":
          useLandChangeStore.getState().clearCellSelection();
          return;
        case "ArrowLeft":
        case "[":
        case "ArrowRight":
        case "]":
          break;
        default:
          return;
      }

      if (!selectedCellId) return;

      const match = selectedCellId.match(/^R(\d+)-C(\d+)$/);
      if (!match || !match[1] || !match[2]) return;

      const currentRow = parseInt(match[1], 10);
      const currentCol = parseInt(match[2], 10);
      const currentIndex = newCells.findIndex(
        (c) => c.row === currentRow && c.col === currentCol,
      );
      if (currentIndex === -1) return;

      const dir = event.key === "ArrowLeft" || event.key === "[" ? -1 : 1;
      const nextIndex = (currentIndex + dir + newCells.length) % newCells.length;
      const nextCell = newCells[nextIndex];
      if (!nextCell) return;

      const cellId = `R${nextCell.row}-C${nextCell.col}`;
      useLandChangeStore.getState().setSelectedCellId(cellId);
      if (onCellSelect) {
        onCellSelect({
          row: nextCell.row,
          col: nextCell.col,
          cellId,
          distance: 10,
          point: new THREE.Vector3(nextCell.col - half, nextCell.height, nextCell.row - half),
        });
      }
    },
    [newCells, half, onCellSelect],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current !== undefined) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return { handlePointerMove, handlePointerDown, handlePointerUp, handlePointerOut };
}
