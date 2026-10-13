"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BoxGeometry, BufferGeometry, EdgesGeometry, Float32BufferAttribute, PMREMGenerator, Vector3, type PerspectiveCamera } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { formatMm } from "@/features/geometry/units";
import { gridStepMm } from "./grid";
import { surfaceAppearance, type StlViewerProps } from "./types";

/** Siatki z większą liczbą trójkątów nie dostają krawędzi CAD (koszt obliczeń). */
const EDGE_OVERLAY_LIMIT = 300_000;
const FOV = 35;

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** Oświetlenie studyjne: proceduralne otoczenie (bez pobierania HDR) + światła kierunkowe. */
function StudioLighting() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene, invalidate } = get();
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
      room.traverse((obj) => {
        if ("geometry" in obj) (obj as { geometry: { dispose(): void } }).geometry.dispose();
      });
    };
  }, [get]);
  return (
    <>
      <hemisphereLight args={["#ffffff", "#b8c0ca", 0.6]} />
      <directionalLight position={[4, 8, 6]} intensity={1.4} />
      <directionalLight position={[-6, 3, -4]} intensity={0.45} />
    </>
  );
}

/** Ustawia kamerę tak, aby cała część była widoczna; reaguje na `resetSignal`. */
function CameraRig({ size, resetSignal, reducedMotion }: { size: [number, number, number]; resetSignal: number; reducedMotion: boolean }) {
  const get = useThree((s) => s.get);
  // Subskrypcja tylko po to, by efekt uruchomił się ponownie, gdy OrbitControls się zarejestrują.
  const controlsReady = useThree((s) => s.controls !== null);
  const [sx, sy, sz] = size;

  useEffect(() => {
    // Obiekty sceny pobierane ze stanu R3F w efekcie (mutowalne obiekty Three.js, nie stan Reacta).
    const { camera: cam, controls: ctrl, invalidate } = get();
    const camera = cam as PerspectiveCamera;
    const controls = ctrl as OrbitControlsImpl | null;
    // Model stoi na siatce: w świecie (Y w górę) wysokość części to oś Z pliku.
    const radius = Math.max(Math.hypot(sx, sy, sz) / 2, 1e-6);
    const distance = (radius / Math.sin(((FOV / 2) * Math.PI) / 180)) * 1.15;
    const dir = { x: 0.62, y: 0.52, z: 0.78 };
    const len = Math.hypot(dir.x, dir.y, dir.z);
    const targetY = sz / 2;
    camera.position.set((dir.x / len) * distance, targetY + (dir.y / len) * distance, (dir.z / len) * distance);
    camera.near = distance / 200;
    camera.far = distance * 50;
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.set(0, targetY, 0);
      controls.minDistance = radius * 0.3;
      controls.maxDistance = distance * 6;
      controls.enableDamping = !reducedMotion;
      controls.update();
    } else {
      camera.lookAt(0, targetY, 0);
    }
    invalidate();
  }, [get, controlsReady, sx, sy, sz, resetSignal, reducedMotion]);

  return null;
}

function ModelMesh({
  positions,
  offset,
  appearance,
  wireframe,
}: {
  positions: Float32Array;
  offset: [number, number, number];
  appearance: StlViewerProps["appearance"];
  wireframe: boolean;
}) {
  const triangles = positions.length / 9;
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    // Atrybut korzysta z tej samej tablicy — bez kopiowania danych modelu.
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }, [positions]);

  const edges = useMemo(() => (triangles <= EDGE_OVERLAY_LIMIT ? new EdgesGeometry(geometry, 28) : null), [geometry, triangles]);

  // Zwolnienie pamięci GPU przy usunięciu/zmianie modelu.
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => edges?.dispose(), [edges]);

  const look = surfaceAppearance[appearance ?? "default"];

  return (
    <group position={offset}>
      <mesh geometry={geometry}>
        {wireframe ? (
          <meshBasicMaterial color="#2e3848" wireframe transparent opacity={0.55} />
        ) : (
          <meshStandardMaterial
            color={look.color}
            metalness={look.metalness}
            roughness={look.roughness}
            envMapIntensity={0.9}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        )}
      </mesh>
      {!wireframe && edges ? (
        <lineSegments geometry={edges}>
          <lineBasicMaterial color="#1c2635" transparent opacity={0.35} />
        </lineSegments>
      ) : null}
    </group>
  );
}


type LabelAnchor = [number, number, number];

/** Prostopadłościan gabarytowy (krawędzie). Opisy rysuje `DimensionLabels` poza canvasem. */
function BoundingBoxEdges({ size }: { size: [number, number, number] }) {
  const [sx, sy, sz] = size;
  const edges = useMemo(() => {
    const box = new BoxGeometry(sx, sy, sz);
    const e = new EdgesGeometry(box);
    box.dispose();
    return e;
  }, [sx, sy, sz]);
  useEffect(() => () => edges.dispose(), [edges]);
  return (
    <lineSegments geometry={edges} position={[0, 0, sz / 2]}>
      <lineBasicMaterial color="#2f66d0" transparent opacity={0.7} />
    </lineSegments>
  );
}

/** Punkty zaczepienia opisów X/Y/Z w układzie modelu (Z w górę, środek podstawy w 0). */
function labelAnchors([sx, sy, sz]: [number, number, number]): LabelAnchor[] {
  const pad = Math.max(sx, sy, sz) * 0.07;
  return [
    [0, -sy / 2 - pad, 0],
    [sx / 2 + pad, 0, 0],
    [sx / 2 + pad, -sy / 2 - pad, sz / 2],
  ];
}

/**
 * Pozycjonuje etykiety DOM (renderowane poza canvasem) nad punktami sceny.
 * Działa w każdej wyrenderowanej klatce — przy `frameloop="demand"` tylko przy ruchu kamery.
 */
function LabelProjector({ anchors, labels }: { anchors: LabelAnchor[]; labels: RefObject<(HTMLSpanElement | null)[]> }) {
  const invalidate = useThree((s) => s.invalidate);
  const v = useMemo(() => new Vector3(), []);
  useEffect(() => invalidate(), [anchors, invalidate]);
  useFrame(({ camera, size }) => {
    anchors.forEach(([x, y, z], i) => {
      const el = labels.current?.[i];
      if (!el) return;
      // Obrót grupy modelu (−90° wokół X): (x, y, z) → (x, z, −y)
      v.set(x, z, -y).project(camera);
      const px = ((v.x + 1) / 2) * size.width;
      const py = ((1 - v.y) / 2) * size.height;
      el.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%)`;
      el.style.opacity = v.z < 1 ? "1" : "0";
    });
  });
  return null;
}

function Scene(props: StlViewerProps & { labels: RefObject<(HTMLSpanElement | null)[]> }) {
  const { positions, min, max, unitToMm, appearance, wireframe, showDimensions, resetSignal, labels } = props;
  const reducedMotion = usePrefersReducedMotion();
  const size: [number, number, number] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  // Środek części w XY, spód na płaszczyźnie siatki.
  const offset: [number, number, number] = [-(min[0] + max[0]) / 2, -(min[1] + max[1]) / 2, -min[2]];
  const maxDim = Math.max(...size);
  const stepMm = gridStepMm(maxDim * unitToMm);
  const step = stepMm / unitToMm;
  const divisions = Math.max(10, Math.ceil((maxDim * 2.2) / step / 2) * 2);
  const [sx, sy, sz] = size;
  const anchors = useMemo(() => labelAnchors([sx, sy, sz]), [sx, sy, sz]);

  return (
    <>
      <StudioLighting />
      <gridHelper args={[step * divisions, divisions, "#9aa5b3", "#d3d9e0"]} />
      {/* Plik STL: oś Z w górę → obrót do układu Three.js (Y w górę). */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <ModelMesh positions={positions} offset={offset} appearance={appearance} wireframe={wireframe} />
        {showDimensions ? <BoundingBoxEdges size={size} /> : null}
        <axesHelper args={[maxDim * 0.35]} position={[-size[0] / 2 - maxDim * 0.08, -size[1] / 2 - maxDim * 0.08, 0]} />
      </group>
      {showDimensions ? <LabelProjector anchors={anchors} labels={labels} /> : null}
      <OrbitControls makeDefault enablePan screenSpacePanning dampingFactor={0.12} />
      <CameraRig size={size} resetSignal={resetSignal} reducedMotion={reducedMotion} />
    </>
  );
}

/** Interaktywny podgląd STL. Renderuje klatki tylko przy zmianie widoku (`frameloop="demand"`). */
export default function StlViewer(props: StlViewerProps) {
  const labels = useRef<(HTMLSpanElement | null)[]>([]);
  const [sx, sy, sz] = [props.max[0] - props.min[0], props.max[1] - props.min[1], props.max[2] - props.min[2]];
  const texts = [`X ${formatMm(sx * props.unitToMm)}`, `Y ${formatMm(sy * props.unitToMm)}`, `Z ${formatMm(sz * props.unitToMm)}`];

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ fov: FOV, position: [3, 3, 3] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        aria-label={props.label}
        role="img"
        fallback={
          <p className="grid h-full place-items-center p-6 text-center text-[13px] text-ink-600">
            Twoja przeglądarka nie obsługuje WebGL — podgląd 3D jest niedostępny. Wymiary i analiza modelu działają nadal.
          </p>
        }
      >
        <Scene {...props} labels={labels} />
      </Canvas>
      {props.showDimensions
        ? texts.map((text, i) => (
            <span
              key={text[0]}
              ref={(el) => {
                labels.current[i] = el;
              }}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 rounded-xs border border-accent/30 bg-white/95 px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap text-ink-900 opacity-0 shadow-card"
            >
              {text}
            </span>
          ))
        : null}
    </div>
  );
}
