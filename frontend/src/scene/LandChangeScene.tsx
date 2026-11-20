import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { YearGrid } from "@/api/types";
import type { ViewMode } from "@/store/landChangeStore";
import { useLandChangeStore } from "@/store/landChangeStore";
import { BasePlate, GridBlocks, SoftGlow } from "./GridBlocks";
import { CellCallout } from "./CellCallout";
import { SCENE_COLORS } from "./colors";

interface SceneProps {
  grid: YearGrid;
  viewMode: ViewMode;
  autoRotate: boolean;
  changesOnly: boolean;
  reduceMotion: boolean;
  onCellSelect?: ((row: number, col: number, cellId: string) => void) | undefined;
  onCellHover?: ((row: number | null, col: number | null, cellId: string | null) => void) | undefined;
}

function CameraRig({ viewMode, size }: { viewMode: ViewMode; size: number }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));
  const pos3d = useRef(new THREE.Vector3(size * 0.9, size * 0.75, size * 0.9));
  const posTop = useRef(new THREE.Vector3(0, size * 1.6, 0.01));

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const from = cam.position.clone();
    const to = viewMode === "top" ? posTop.current : pos3d.current;
    const start = performance.now();
    const dur = 280;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      cam.position.lerpVectors(from, to, e);
      cam.lookAt(target.current);
      cam.updateProjectionMatrix();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [viewMode, camera, size]);

  return null;
}

function SceneInner({
  grid,
  viewMode,
  autoRotate,
  changesOnly,
  reduceMotion,
  onCellSelect,
  onCellHover,
}: SceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const size = grid.cols;

  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    if (viewMode === "top") {
      c.enableRotate = false;
      c.minPolarAngle = 0;
      c.maxPolarAngle = 0.15;
    } else {
      c.enableRotate = true;
      c.minPolarAngle = 0.2;
      c.maxPolarAngle = Math.PI / 2.1;
    }
  }, [viewMode]);

  return (
    <>
      <color attach="background" args={[SCENE_COLORS.fog]} />
      <fog attach="fog" args={[SCENE_COLORS.fog, size * 2.2, size * 5]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[size, size * 1.4, size * 0.6]}
        intensity={1.15}
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight args={["#94a3b8", "#0f172a", 0.35]} />

      <CameraRig viewMode={viewMode} size={size} />
      <SoftGlow size={size} />
      <BasePlate size={size} />
      <GridBlocks
        grid={grid}
        changesOnly={changesOnly}
        reduceMotion={reduceMotion}
        onCellSelect={onCellSelect}
        onCellHover={onCellHover}
      />
      <CellCallout grid={grid} />
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.35}
        scale={size * 1.4}
        blur={2.2}
        far={size}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate && viewMode === "3d" && !reduceMotion}
        autoRotateSpeed={0.55}
        minDistance={size * 0.55}
        maxDistance={size * 2.8}
        target={[0, 0, 0]}
      />
    </>
  );
}

export function LandChangeScene(props: SceneProps) {
  const [hoveredNewCell, setHoveredNewCell] = useState(false);
  const selectedCellId = useLandChangeStore((s) => s.selectedCellId);

  // Count red cells so we can show the hint
  const redCount = props.grid.cells.filter((c) => c.class === "new").length;

  const handleCellHover = (
    row: number | null,
    col: number | null,
    cellId: string | null,
  ) => {
    setHoveredNewCell(cellId !== null);
    if (props.onCellHover) props.onCellHover(row, col, cellId);
  };

  return (
    <div
      className="relative h-full w-full min-h-[320px] overflow-hidden rounded-2xl"
      style={{ cursor: hoveredNewCell ? "pointer" : "grab" }}
    >
      {/* Radial glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(56,189,248,0.12) 0%, rgba(5,7,15,0.0) 55%, rgba(5,7,15,0.85) 100%)",
        }}
      />

      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{
          position: [
            props.grid.cols * 0.9,
            props.grid.cols * 0.75,
            props.grid.cols * 0.9,
          ],
          fov: 42,
          near: 0.1,
          far: 500,
        }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      >
        <Suspense fallback={null}>
          <SceneInner
            {...props}
            onCellHover={handleCellHover}
          />
        </Suspense>
      </Canvas>

      {/* Click-hint tooltip — only shown when no cell is selected and red cells exist */}
      {!selectedCellId && redCount > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 backdrop-blur-sm border border-white/10">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-200">
            Click a red block to inspect
          </span>
        </div>
      )}
    </div>
  );
}
