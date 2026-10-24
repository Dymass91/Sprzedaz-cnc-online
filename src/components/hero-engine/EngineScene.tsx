"use client";

import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { TOUCH, type PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { EngineAssembly } from "./EngineAssembly";
import type { PencilParams, RenderStyle } from "./pencilStyle";

/** Ujęcie początkowe: widok 3/4 od strony przekroju, lekko z góry. */
const CAMERA = { fov: 30, position: [560, 360, 860] as const, target: [20, 80, 0] as const };

function CameraReset({ signal }: { signal: number }) {
  const get = useThree((s) => s.get);
  const controlsReady = useThree((s) => s.controls !== null);
  useEffect(() => {
    const { camera, controls, invalidate } = get();
    const cam = camera as PerspectiveCamera;
    cam.position.set(...CAMERA.position);
    const ctrl = controls as OrbitControlsImpl | null;
    if (ctrl) {
      ctrl.target.set(...CAMERA.target);
      // Aktualizacja bez tłumienia zeruje bezwładność obrotu — ujęcie wraca dokładnie do startu.
      const damping = ctrl.enableDamping;
      ctrl.enableDamping = false;
      ctrl.update();
      ctrl.enableDamping = damping;
    } else {
      cam.lookAt(...CAMERA.target);
    }
    invalidate();
  }, [get, controlsReady, signal]);
  return null;
}

/**
 * Ekrany dotykowe: jeden palec przewija stronę (nie blokujemy przewijania nad hero),
 * dwa palce obracają i przybliżają model.
 */
function TouchPolicy() {
  const get = useThree((s) => s.get);
  const controlsReady = useThree((s) => s.controls !== null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const { gl, controls } = get();
    const ctrl = controls as OrbitControlsImpl | null;
    if (!ctrl) return;
    ctrl.touches = { ONE: undefined as unknown as TOUCH, TWO: TOUCH.DOLLY_ROTATE };
    gl.domElement.style.touchAction = "pan-y";
  }, [get, controlsReady]);
  return null;
}

export type EngineSceneProps = {
  playing: boolean;
  speedRpm: number;
  reducedMotion: boolean;
  renderStyle: RenderStyle;
  pencilParams: PencilParams;
  /** Warstwy kreskowania: 2 na słabszych urządzeniach. */
  hatchLayers: number;
  /** Sekcja widoczna na ekranie — poza ekranem renderowanie jest wstrzymane. */
  visible: boolean;
  /** Pętla ciągła potrzebna (wejście, praca lub hamowanie wału). */
  animating: boolean;
  resetSignal: number;
  /** Scena wyrenderowała pierwsze klatki — można ją odsłonić. */
  onReady: () => void;
  /** Utrata kontekstu WebGL — hero wraca do statycznego szkicu. */
  onError: () => void;
  onIntroDone: () => void;
  onStopped: () => void;
};

/** Scena WebGL silnika — ładowana dynamicznie, wyłącznie po stronie klienta. */
export default function EngineScene(props: EngineSceneProps) {
  const { visible, animating } = props;
  return (
    <Canvas
      frameloop={!visible ? "never" : animating ? "always" : "demand"}
      // Tryb ołówka: niższy limit gęstości pikseli — kreski mają własny antyaliasing.
      dpr={[1, props.renderStyle === "pencil" ? 1.5 : 1.75]}
      camera={{ fov: CAMERA.fov, position: [...CAMERA.position], near: 20, far: 6000 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", () => props.onError(), { once: true });
      }}
      aria-label="Animowany przekrój czterocylindrowego silnika rzędowego w stylu rysunku ołówkiem"
      role="img"
    >
      <EngineAssembly
        playing={props.playing}
        speedRpm={props.speedRpm}
        reducedMotion={props.reducedMotion}
        renderStyle={props.renderStyle}
        pencilParams={props.pencilParams}
        hatchLayers={props.hatchLayers}
        onIntroDone={props.onIntroDone}
        onStopped={props.onStopped}
        // Gotowość = shadery skompilowane i pierwsze klatki wyrenderowane (nie samo utworzenie kontekstu).
        onFirstFrame={props.onReady}
      />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping={!props.reducedMotion}
        dampingFactor={0.1}
        minDistance={620}
        maxDistance={1500}
        minPolarAngle={0.35}
        maxPolarAngle={1.5}
        // Obrót ograniczony do strony przekroju — wnętrze silnika pozostaje widoczne.
        minAzimuthAngle={-0.75}
        maxAzimuthAngle={1.35}
        rotateSpeed={0.6}
        zoomSpeed={0.7}
      />
      <CameraReset signal={props.resetSignal} />
      <TouchPolicy />
    </Canvas>
  );
}
