"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Group, LineSegments, Mesh, type Material, type ShaderMaterial } from "three";
import { easeInOut, rpmToRadPerSecond } from "@/lib/engine/kinematics";
import { applyEngineState, PROTOTYPE_RIG, type EngineParts } from "@/lib/engine/rig";
import { buildBlock, buildConnectingRod, buildCrankshaft, buildPiston, buildSketchLines } from "./engineGeometry";
import { createLineMaterial, createOutlineMaterial, createSurfaceMaterial } from "./sketchMaterials";

/** Oś czasu sekwencji wejścia (s). */
const INTRO = {
  drawDuration: 2.8, // faza 1: kontury
  shadeStart: 2.2, // faza 2: cieniowanie
  shadeDuration: 1.4,
  motionStart: 3.4, // faza 3: start wału
  motionRamp: 2.6,
  done: 6.2, // faza 4: spokojna praca
} as const;

/** Kolejność rysowania grup linii (ułamek postępu szkicu). */
const ORDER = {
  axes: { start: 0, span: 0.18 },
  block: { start: 0.02, span: 0.45 },
  crank: { start: 0.3, span: 0.3 },
  rod: (i: number) => ({ start: 0.5 + i * 0.05, span: 0.2, seed: 11 + i }),
  piston: (i: number) => ({ start: 0.56 + i * 0.05, span: 0.24, seed: 23 + i }),
};
const REVEAL_END = 1.12;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v)); // > 1 — ostatnie odcinki muszą dokończyć „pociągnięcie”

/** Parametry jednej klatki — wyliczane przez oś czasu w EngineAssembly. */
type FrameState = {
  reveal: number;
  shade: number;
  shaftAngle: number;
  pixelRatio: number;
  width: number;
  height: number;
};

type Engine = {
  root: Group;
  parts: EngineParts;
  /** Aktualizuje uniformy i ustawienie części — wywoływane w pętli renderowania. */
  update: (frame: FrameState) => void;
  dispose: () => void;
};

function createProceduralEngine(): Engine {
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const track = <T extends BufferGeometry | Material>(x: T): T => {
    if ("isMaterial" in x) materials.push(x as Material);
    else geometries.push(x as BufferGeometry);
    return x;
  };

  const lineMaterial = track(createLineMaterial({ opacity: 0.82 }));
  const axesMaterial = track(createLineMaterial({ opacity: 0.4, dash: 26 }));
  const sectionMaterial = track(createSurfaceMaterial({ section: true }));
  const interiorMaterial = track(createSurfaceMaterial({ tone: 0.94, doubleSided: true }));
  const crankMaterial = track(createSurfaceMaterial({ tone: 0.95 }));
  const rodMaterial = track(createSurfaceMaterial({ tone: 1 }));
  const pistonMaterial = track(createSurfaceMaterial({ tone: 0.985 }));
  const outlineCrank = track(createOutlineMaterial(1.3));
  const outlineRods = track(createOutlineMaterial(1.2));
  const outlinePistons = track(createOutlineMaterial(1.25));

  const root = new Group();
  root.name = "engine_prototype";

  const part = (name: string, surface: BufferGeometry, material: ShaderMaterial, outline: ShaderMaterial | null, lines: BufferGeometry) => {
    const g = new Group();
    g.name = name;
    g.add(new Mesh(surface, material));
    if (outline) g.add(new Mesh(surface, outline));
    g.add(new LineSegments(lines, lineMaterial));
    return g;
  };

  // Blok (nieruchomy)
  const block = buildBlock();
  const blockGroup = new Group();
  blockGroup.name = "engine_block";
  blockGroup.add(new Mesh(track(block.section), sectionMaterial));
  blockGroup.add(new Mesh(track(block.interior), interiorMaterial));
  blockGroup.add(new LineSegments(track(buildSketchLines(block.lines, ORDER.block)), lineMaterial));
  blockGroup.add(new LineSegments(track(buildSketchLines(block.axes, ORDER.axes)), axesMaterial));
  root.add(blockGroup);

  // Wał korbowy
  const crank = buildCrankshaft();
  const crankshaft = part("crankshaft", track(crank.surface), crankMaterial, outlineCrank, track(buildSketchLines(crank.lines, ORDER.crank)));
  root.add(crankshaft);

  // Korbowody i tłoki — jedna geometria powierzchni na typ części
  const rod = buildConnectingRod();
  const piston = buildPiston();
  track(rod.surface);
  track(piston.surface);
  const rods: Group[] = [];
  const pistons: Group[] = [];
  for (let i = 0; i < 4; i++) {
    const r = part(`connecting_rod_${i + 1}`, rod.surface, rodMaterial, outlineRods, track(buildSketchLines(rod.lines, ORDER.rod(i))));
    const p = part(`piston_${i + 1}`, piston.surface, pistonMaterial, outlinePistons, track(buildSketchLines(piston.lines, ORDER.piston(i))));
    rods.push(r);
    pistons.push(p);
    root.add(r, p);
  }

  const parts: EngineParts = { crankshaft, rods, pistons, block: blockGroup };
  const lineMaterials = [lineMaterial, axesMaterial];
  const surfaceMaterials = [sectionMaterial, interiorMaterial, crankMaterial, rodMaterial, pistonMaterial];
  const outlines = [
    { material: outlineCrank, start: ORDER.crank.start },
    { material: outlineRods, start: ORDER.rod(0).start },
    { material: outlinePistons, start: ORDER.piston(0).start },
  ];

  return {
    root,
    parts,
    update: ({ reveal, shade, shaftAngle, pixelRatio, width, height }) => {
      for (const m of lineMaterials) m.uniforms.uReveal.value = reveal;
      for (const m of surfaceMaterials) {
        m.uniforms.uShade.value = shade;
        m.uniforms.uPixelRatio.value = pixelRatio;
      }
      sectionMaterial.uniforms.uSectionReveal.value = easeInOut((reveal - 0.35) / 0.4);
      for (const o of outlines) {
        o.material.uniforms.uOpacity.value = 0.85 * clamp01((reveal - o.start) / 0.3);
        o.material.uniforms.uResolution.value.set(width, height);
      }
      applyEngineState(parts, PROTOTYPE_RIG, shaftAngle);
    },
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

export type EngineAssemblyProps = {
  playing: boolean;
  speedRpm: number;
  /** Pominięcie sekwencji wejścia i ruchu startowego (prefers-reduced-motion). */
  reducedMotion: boolean;
  /** Sekwencja wejścia zakończona. */
  onIntroDone?: () => void;
  /** Wał całkowicie się zatrzymał (po pauzie). */
  onStopped?: () => void;
};

/**
 * Silnik R4 w przekroju: model proceduralny + oś czasu „rysunek ożywa”.
 * Ruch wszystkich części wynika z jednego kąta wału (`applyEngineState`).
 * Aktualizacje odbywają się w pętli renderowania — bez stanu React na klatkę.
 */
export function EngineAssembly({ playing, speedRpm, reducedMotion, onIntroDone, onStopped }: EngineAssemblyProps) {
  const engine = useMemo(() => createProceduralEngine(), []);
  useEffect(() => () => engine.dispose(), [engine]);

  // Bieżące wartości sterowania czytane w pętli renderowania
  const control = useRef({ playing, speedRpm, reducedMotion, onIntroDone, onStopped });
  useEffect(() => {
    control.current = { playing, speedRpm, reducedMotion, onIntroDone, onStopped };
  }, [playing, speedRpm, reducedMotion, onIntroDone, onStopped]);

  const sim = useRef({ time: 0, theta: 0, omega: 0, introReported: false, stoppedReported: true });

  useFrame((state, delta) => {
    const c = control.current;
    const s = sim.current;
    const dt = Math.min(delta, 0.05);
    s.time += dt;
    const t = c.reducedMotion ? INTRO.done + 1 : s.time;

    // Faza 1–2: kontury, przekrój, cieniowanie
    const reveal = clamp01(t / INTRO.drawDuration) * REVEAL_END;
    const shade = easeInOut((t - INTRO.shadeStart) / INTRO.shadeDuration);

    // Faza 3–4: start wału i praca; płynne przyspieszanie i hamowanie
    const motionGate = easeInOut((t - INTRO.motionStart) / INTRO.motionRamp);
    const target = c.playing ? rpmToRadPerSecond(c.speedRpm) * motionGate : 0;
    s.omega += (target - s.omega) * Math.min(1, dt * 1.6);
    // Hamowanie kończy się zatrzymaniem (bez nieskończenie wolnego „pełzania” wału).
    if (target === 0 && Math.abs(s.omega) < 0.03) s.omega = 0;
    s.theta = (s.theta + s.omega * dt) % (Math.PI * 2);
    engine.update({
      reveal,
      shade,
      shaftAngle: s.theta,
      pixelRatio: state.gl.getPixelRatio(),
      width: state.size.width,
      height: state.size.height,
    });

    if (!s.introReported && t >= INTRO.done) {
      s.introReported = true;
      c.onIntroDone?.();
    }
    if (s.omega === 0 && !c.playing && !s.stoppedReported) {
      s.stoppedReported = true;
      c.onStopped?.();
    }
    if (s.omega !== 0) s.stoppedReported = false;
  });

  return <primitive object={engine.root} />;
}
