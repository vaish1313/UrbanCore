import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { useLandChangeStore } from "@/store/landChangeStore";
import type { YearGrid } from "@/api/types";

interface CellCalloutProps {
  grid: YearGrid;
}

function parseCellId(
  cellId: string | null,
  cells: YearGrid["cells"],
): (typeof cells)[number] | null {
  if (!cellId) return null;
  const match = cellId.match(/^R(\d+)-C(\d+)$/);
  if (!match || !match[1] || !match[2]) return null;
  const row = parseInt(match[1], 10);
  const col = parseInt(match[2], 10);
  return cells.find((c) => c.row === row && c.col === col) ?? null;
}

export function CellCallout({ grid }: CellCalloutProps) {
  const { selectedCellId, hoveredCellId } = useLandChangeStore();
  const ringRef = useRef<THREE.Mesh>(null);
  const outlineRef = useRef<THREE.Mesh>(null);
  const labelGroupRef = useRef<THREE.Group>(null);
  // Use a group to hold the line so we avoid the SVGLineElement JSX conflict
  const lineGroupRef = useRef<THREE.Group>(null);

  const half = (grid.cols - 1) / 2;
  const GAP = 0.08;
  const CELL = 1 - GAP;

  const selectedCell = parseCellId(selectedCellId, grid.cells);
  const hoveredCell = parseCellId(hoveredCellId, grid.cells);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
      ringRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }

    if (selectedCell && ringRef.current && outlineRef.current) {
      const x = selectedCell.col - half;
      const z = selectedCell.row - half;
      const y = 0.02;

      ringRef.current.position.set(x, y, z);
      outlineRef.current.position.set(x, selectedCell.height + 0.1, z);

      if (labelGroupRef.current) {
        labelGroupRef.current.position.set(x, selectedCell.height + 0.3, z);
      }
    }
  });

  if (!selectedCell) return null;

  const x = selectedCell.col - half;
  const z = selectedCell.row - half;
  const labelText = `NEW · R${selectedCell.row} · C${selectedCell.col}`;

  return (
    <group>
      {/* Pulsing ring on ground */}
      <mesh ref={ringRef} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[CELL * 0.7, CELL * 0.9, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* White cap on top of selected block */}
      <mesh ref={outlineRef} position={[x, selectedCell.height + 0.1, z]}>
        <boxGeometry args={[CELL + 0.05, 0.02, CELL + 0.05]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      {/* Callout label */}
      <group ref={labelGroupRef} position={[x, selectedCell.height + 0.3, z]}>
        {/* Background plane */}
        <mesh position={[0, -0.08, -0.01]}>
          <planeGeometry args={[2, 0.3]} />
          <meshBasicMaterial
            color="#0f1626"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Text
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#000000"
          outlineOpacity={0.8}
        >
          {labelText}
        </Text>
      </group>

      {/* Hover highlight for hovered cell (when different from selected) */}
      {hoveredCell &&
        `R${hoveredCell.row}-C${hoveredCell.col}` !== selectedCellId && (
          <mesh
            position={[
              hoveredCell.col - half,
              hoveredCell.height + 0.05,
              hoveredCell.row - half,
            ]}
          >
            <boxGeometry args={[CELL + 0.03, 0.02, CELL + 0.03]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
        )}
    </group>
  );
}
