import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GridCell, YearGrid } from "@/api/types";
import { CLASS_HEIGHT, SCENE_COLORS } from "./colors";
import { useCellPicking } from "./useCellPicking";
import { useLandChangeStore } from "@/store/landChangeStore";

const GAP = 0.08;
const CELL = 1 - GAP;

interface Props {
  grid: YearGrid;
  changesOnly: boolean;
  reduceMotion: boolean;
  onCellSelect?: ((row: number, col: number, cellId: string) => void) | undefined;
  onCellHover?: ((row: number | null, col: number | null, cellId: string | null) => void) | undefined;
}

function colorFor(cls: GridCell["class"], changesOnly: boolean): THREE.Color {
  if (changesOnly && cls !== "new") {
    return new THREE.Color("#1e293b");
  }
  switch (cls) {
    case "existing":
      return new THREE.Color(SCENE_COLORS.existing);
    case "new":
      return new THREE.Color(SCENE_COLORS.new);
    default:
      return new THREE.Color(SCENE_COLORS.land);
  }
}

function targetHeight(cell: GridCell, changesOnly: boolean): number {
  if (changesOnly && cell.class !== "new") return 0.03;
  if (cell.class === "land") return CLASS_HEIGHT.land;
  if (cell.class === "new") return CLASS_HEIGHT.new * cell.height;
  return CLASS_HEIGHT.existing * cell.height;
}

/**
 * Single InstancedMesh for all cells. Heights / colors update when year changes
 * without remounting React children (keeps 60fps).
 */
export function GridBlocks({ grid, changesOnly, reduceMotion, onCellSelect, onCellHover }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const heightsRef = useRef<Float32Array | null>(null);
  const targetsRef = useRef<Float32Array | null>(null);
  const colorsRef = useRef<Float32Array | null>(null);
  const classRef = useRef<Uint8Array | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  const count = grid.rows * grid.cols;
  const half = (grid.cols - 1) / 2;

  // Setup cell picking
  const { handlePointerMove, handlePointerDown, handlePointerUp, handlePointerOut } = useCellPicking(
    grid,
    changesOnly,
    (result) => {
      if (onCellSelect) {
        onCellSelect(result.row, result.col, result.cellId);
      }
    },
    (result) => {
      if (onCellHover) {
        if (result) {
          onCellHover(result.row, result.col, result.cellId);
        } else {
          onCellHover(null, null, null);
        }
      }
    },
  );

  // Allocate buffers once per grid size
  useEffect(() => {
    heightsRef.current = new Float32Array(count);
    targetsRef.current = new Float32Array(count);
    colorsRef.current = new Float32Array(count * 3);
    classRef.current = new Uint8Array(count);
  }, [count]);

  // Push new targets whenever year / mode changes
  useEffect(() => {
    const mesh = meshRef.current;
    const targets = targetsRef.current;
    const colors = colorsRef.current;
    const classes = classRef.current;
    if (!mesh || !targets || !colors || !classes) return;

    for (let i = 0; i < grid.cells.length; i++) {
      const cell = grid.cells[i];
      if (!cell) continue;
      const idx = cell.row * grid.cols + cell.col;
      targets[idx] = targetHeight(cell, changesOnly);
      classes[idx] = cell.class === "new" ? 2 : cell.class === "existing" ? 1 : 0;
      const c = colorFor(cell.class, changesOnly);
      colors[idx * 3] = c.r;
      colors[idx * 3 + 1] = c.g;
      colors[idx * 3 + 2] = c.b;
      mesh.setColorAt(idx, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [grid, changesOnly]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const heights = heightsRef.current;
    const targets = targetsRef.current;
    const colors = colorsRef.current;
    const classes = classRef.current;
    if (!mesh || !heights || !targets || !colors || !classes) return;

    const speed = reduceMotion ? 1 : Math.min(1, delta * 4);

    for (let i = 0; i < count; i++) {
      const curH = heights[i] ?? 0;
      const tgt = targets[i] ?? 0;
      heights[i] = curH + (tgt - curH) * speed;

      const row = Math.floor(i / grid.cols);
      const col = i % grid.cols;
      const h = Math.max(0.02, heights[i] ?? 0);
      dummy.position.set(col - half, h / 2, row - half);
      dummy.scale.set(CELL, h, CELL);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if ((classes[i] ?? 0) === 2 && !reduceMotion) {
        const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 3 + i * 0.05) * 0.15;
        tempColor.setRGB(
          (colors[i * 3] ?? 0) * pulse,
          (colors[i * 3 + 1] ?? 0) * pulse,
          (colors[i * 3 + 2] ?? 0) * pulse,
        );
        mesh.setColorAt(i, tempColor);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow
      receiveShadow
      frustumCulled={false}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerOut}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        roughness={0.45}
        metalness={0.15}
        toneMapped
      />
    </instancedMesh>
  );
}

export function BasePlate({ size }: { size: number }) {
  const dim = size + 1.5;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[dim, dim]} />
      <meshStandardMaterial
        color={SCENE_COLORS.plate}
        roughness={0.9}
        metalness={0.05}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}

export function SoftGlow({ size }: { size: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
      <circleGeometry args={[size * 0.85, 48]} />
      <meshBasicMaterial
        color={SCENE_COLORS.accent}
        transparent
        opacity={0.08}
        depthWrite={false}
      />
    </mesh>
  );
}
