import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const ease = [0.16, 1, 0.3, 1] as const;

type Building = {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  delay: number;
  tone: number;
};

const BUILDINGS: Building[] = Array.from({ length: 54 }, (_, index) => {
  const column = index % 9;
  const row = Math.floor(index / 9);
  const seed = (index * 47 + 19) % 101;
  const avenueGap = column > 4 ? 1.15 : 0;
  const crossGap = row > 2 ? 1.05 : 0;
  const center = Math.hypot(column - 4, row - 2.5);
  return {
    x: (column - 4) * 1.3 + avenueGap,
    z: (row - 2.5) * 1.45 + crossGap,
    width: 0.58 + (seed % 4) * 0.11,
    depth: 0.62 + ((seed * 3) % 5) * 0.09,
    height: Math.max(0.75, 5.8 - center * 0.82 + (seed % 6) * 0.38),
    delay: (Math.abs(column - 4) + Math.abs(row - 2.5)) * 0.08 + (seed % 7) * 0.035,
    tone: seed % 4,
  };
});

const ROAD_LINES = [
  { position: [0.62, 0.025, 0] as const, scale: [0.74, 0.04, 18] as const },
  { position: [-6.15, 0.026, 0] as const, scale: [0.3, 0.04, 18] as const },
  { position: [6.15, 0.026, 0] as const, scale: [0.3, 0.04, 18] as const },
  { position: [0, 0.027, 0.5] as const, scale: [20, 0.04, 0.72] as const },
  { position: [0, 0.028, -4.95] as const, scale: [20, 0.04, 0.28] as const },
  { position: [0, 0.029, 4.95] as const, scale: [20, 0.04, 0.28] as const },
];

function readScenePalette() {
  const styles = getComputedStyle(document.documentElement);
  const rgb = (name: string) => {
    const channels = styles.getPropertyValue(name).trim().split(" ").map(Number);
    return new THREE.Color(channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0);
  };
  return {
    ground: rgb("--scene-ground-rgb"),
    road: rgb("--scene-road-rgb"),
    building: rgb("--scene-building-rgb"),
    buildingAlt: rgb("--scene-building-alt-rgb"),
    glass: rgb("--scene-glass-rgb"),
    light: rgb("--scene-light-rgb"),
    scan: rgb("--scene-scan-rgb"),
  };
}

type Palette = ReturnType<typeof readScenePalette>;

function District({
  active,
  reducedMotion,
  palette,
}: {
  active: boolean;
  reducedMotion: boolean;
  palette: Palette;
}) {
  const buildingsRef = useRef<THREE.InstancedMesh>(null);
  const roofsRef = useRef<THREE.InstancedMesh>(null);
  const windowsRef = useRef<THREE.Points>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const progress = useRef(active || reducedMotion ? 1 : 0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const windowPositions = useMemo(() => {
    const points: number[] = [];
    BUILDINGS.forEach((building, index) => {
      const floors = Math.max(2, Math.floor(building.height / 0.62));
      for (let floor = 1; floor < floors; floor += 2) {
        const y = floor * 0.62;
        points.push(building.x - building.width * 0.22, y, building.z + building.depth * 0.51);
        points.push(building.x + building.width * 0.22, y, building.z + building.depth * 0.51);
        if (index % 2 === 0) {
          points.push(building.x + building.width * 0.51, y, building.z - building.depth * 0.2);
        }
      }
    });
    return new Float32Array(points);
  }, []);

  useEffect(() => {
    if (active) progress.current = reducedMotion ? 1 : 0;
  }, [active, reducedMotion]);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const target = active ? 1 : 0;
    progress.current += (target - progress.current) * (1 - Math.exp(-1.8 * dt));
    const master = reducedMotion && active ? 1 : progress.current;

    BUILDINGS.forEach((building, index) => {
      const local = THREE.MathUtils.smoothstep(
        master,
        building.delay,
        Math.min(1, building.delay + 0.42),
      );
      const rise = THREE.MathUtils.smootherstep(local, 0, 1);
      const height = Math.max(0.001, building.height * rise);
      dummy.position.set(building.x, height / 2, building.z);
      dummy.scale.set(building.width, height, building.depth);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      buildingsRef.current?.setMatrixAt(index, dummy.matrix);

      const crownVisible = THREE.MathUtils.smoothstep(local, 0.72, 1);
      dummy.position.set(building.x, height + 0.07, building.z);
      dummy.scale.set(
        building.width * 0.72 * crownVisible,
        0.12 * crownVisible,
        building.depth * 0.72 * crownVisible,
      );
      dummy.updateMatrix();
      roofsRef.current?.setMatrixAt(index, dummy.matrix);
    });

    if (buildingsRef.current) buildingsRef.current.instanceMatrix.needsUpdate = true;
    if (roofsRef.current) roofsRef.current.instanceMatrix.needsUpdate = true;
    if (windowsRef.current) {
      windowsRef.current.visible = master > 0.76;
      const material = windowsRef.current.material as THREE.PointsMaterial;
      material.opacity = THREE.MathUtils.smoothstep(master, 0.76, 1) * 0.88;
    }
    if (scanRef.current) {
      const pulse = (clock.elapsedTime * 0.17) % 1;
      scanRef.current.position.y = 0.08 + pulse * 6.4;
      const material = scanRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = active ? Math.sin(Math.PI * pulse) * 0.2 : 0;
    }
  });

  return (
    <group rotation-y={-0.12} scale={0.86}>
      <mesh receiveShadow position-y={-0.04}>
        <boxGeometry args={[15.5, 0.12, 11]} />
        <meshStandardMaterial color={palette.ground} roughness={0.92} metalness={0.05} />
      </mesh>

      {ROAD_LINES.map((road, index) => (
        <mesh key={index} position={road.position} scale={road.scale} receiveShadow>
          <boxGeometry />
          <meshStandardMaterial color={palette.road} roughness={0.72} metalness={0.18} />
        </mesh>
      ))}

      <gridHelper args={[20, 40, palette.scan, palette.road]} position={[0, 0.055, 0]} />

      <instancedMesh
        ref={buildingsRef}
        args={[undefined, undefined, BUILDINGS.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry />
        <meshStandardMaterial
          color={palette.building}
          roughness={0.36}
          metalness={0.58}
          envMapIntensity={1.3}
        />
      </instancedMesh>

      <instancedMesh ref={roofsRef} args={[undefined, undefined, BUILDINGS.length]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color={palette.buildingAlt} roughness={0.28} metalness={0.72} />
      </instancedMesh>

      <points ref={windowsRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[windowPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={palette.light}
          size={0.055}
          transparent
          opacity={0}
          sizeAttenuation
        />
      </points>

      <mesh ref={scanRef} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[3.5, 7.5, 64]} />
        <meshBasicMaterial
          color={palette.scan}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Scene({
  active,
  yaw,
  tilt,
  reducedMotion,
  palette,
}: {
  active: boolean;
  yaw: number;
  tilt: number;
  reducedMotion: boolean;
  palette: Palette;
}) {
  const root = useRef<THREE.Group>(null);

  useFrame(({ camera, clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    if (root.current) {
      const targetYaw = THREE.MathUtils.degToRad(yaw * 0.55);
      root.current.rotation.y += (targetYaw - root.current.rotation.y) * (1 - Math.exp(-4 * dt));
      root.current.position.y = reducedMotion
        ? -0.7
        : -0.7 + Math.sin(clock.elapsedTime * 0.45) * 0.06;
    }
    const targetY = 10.8 + tilt * 0.045;
    camera.position.y += (targetY - camera.position.y) * (1 - Math.exp(-3 * dt));
    camera.lookAt(0, 1.7, 0);
  });

  return (
    <>
      <ambientLight intensity={0.58} color={palette.glass} />
      <hemisphereLight args={[palette.glass, palette.ground, 1.15]} />
      <directionalLight
        position={[-7, 12, 8]}
        intensity={2.8}
        color={palette.light}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <pointLight position={[4, 3, 5]} intensity={35} distance={20} color={palette.scan} />
      <Environment resolution={64}>
        <Lightformer
          intensity={2.2}
          color={palette.glass}
          position={[0, 10, 2]}
          scale={[12, 12, 1]}
        />
        <Lightformer
          intensity={1.4}
          color={palette.scan}
          position={[-8, 2, 0]}
          rotation-y={Math.PI / 2}
          scale={[10, 2, 1]}
        />
      </Environment>
      <group ref={root}>
        <District active={active} reducedMotion={reducedMotion} palette={palette} />
      </group>
    </>
  );
}

export function RisingCity({
  visible,
  yaw,
  tilt,
}: {
  visible: boolean;
  yaw: number;
  tilt: number;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const [palette, setPalette] = useState<Palette | null>(null);

  useEffect(() => setPalette(readScenePalette()), []);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-10"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.96 }}
      transition={{ duration: 1.2, ease }}
      aria-hidden={!visible}
    >
      {palette && (
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [15.5, 10.8, 18.5], fov: 38, near: 0.1, far: 90 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          style={{ background: "transparent" }}
        >
          <Scene
            active={visible}
            yaw={yaw}
            tilt={tilt}
            reducedMotion={reducedMotion}
            palette={palette}
          />
        </Canvas>
      )}
      <div className="city-rise-horizon absolute inset-x-[18%] bottom-[18%] h-px" />
    </motion.div>
  );
}
