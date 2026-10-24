"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferGeometry, Group, LineSegments, Mesh, type Material, type ShaderMaterial } from "three";
import { easeInOut, rpmToRadPerSecond } from "@/lib/engine/kinematics";
import { applyEngineState, PROTOTYPE_RIG, type EngineParts } from "@/lib/engine/rig";
import { buildBlock, buildConnectingRod, buildCrankshaft, buildPiston, buildSketchLines } from "./engineGeometry";
import { createPencilLineMaterial, createPencilOutlineMaterial, createPencilSurfaceMaterial } from "./pencilMaterials";
import { DEFAULT_PENCIL_PARAMS, DEFAULT_RENDER_STYLE, type PencilParams, type RenderStyle } from "./pencilStyle";
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
/** > 1 — ostatnie odcinki muszą dokończyć „pociągnięcie”. */
const REVEAL_END = 1.12;
/** Bazowa grubość sylwetek w trybie ołówka (px) — skalowana przez `outlineStrength`. */
const PENCIL_OUTLINE_WIDTH = { crank: 1.7, rods: 1.5, pistons: 1.6 } as const;
const HATCH_SPACING_MM = 3.4;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

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
  /** Podmienia materiały (ta sama geometria, ten sam stan animacji). */
  setStyle: (style: RenderStyle) => void;
  setPencilParams: (params: PencilParams, hatchLayers: number) => void;
  dispose: () => void;
};

/** Element sceny z dwoma wariantami materiału: CAD i ołówek. */
type Slot = { object: Mesh | LineSegments; cad: ShaderMaterial; pencil: ShaderMaterial };

function createProceduralEngine(): Engine {
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const track = <T extends BufferGeometry | Material>(x: T): T => {
    if ("isMaterial" in x) materials.push(x as Material);
    else geometries.push(x as BufferGeometry);
    return x;
  };

  // Para materiałów na każdą rolę: [CAD, ołówek]
  const pair = (cad: ShaderMaterial, pencil: ShaderMaterial) => ({ cad: track(cad), pencil: track(pencil) });
  const lines = pair(createLineMaterial({ opacity: 0.82 }), createPencilLineMaterial({ opacity: 0.78 }));
  const axes = pair(createLineMaterial({ opacity: 0.4, dash: 26 }), createPencilLineMaterial({ opacity: 0.32, dash: 26 }));
  /** Drugie, lżejsze pociągnięcie ołówka (tylko tryb ołówka). */
  const secondStroke = track(createPencilLineMaterial({ opacity: 0.3, offsetPx: [0.7, -0.45] }));
  const section = pair(createSurfaceMaterial({ section: true }), createPencilSurfaceMaterial({ section: true }));
  const interior = pair(createSurfaceMaterial({ tone: 0.94, doubleSided: true }), createPencilSurfaceMaterial({ tone: 0.86, doubleSided: true }));
  const crankSurface = pair(createSurfaceMaterial({ tone: 0.95 }), createPencilSurfaceMaterial({ tone: 0.93 }));
  const rodSurface = pair(createSurfaceMaterial({ tone: 1 }), createPencilSurfaceMaterial({ tone: 1 }));
  const pistonSurface = pair(createSurfaceMaterial({ tone: 0.985 }), createPencilSurfaceMaterial({ tone: 0.985 }));
  const outlineCrank = pair(createOutlineMaterial(1.3), createPencilOutlineMaterial(PENCIL_OUTLINE_WIDTH.crank));
  const outlineRods = pair(createOutlineMaterial(1.2), createPencilOutlineMaterial(PENCIL_OUTLINE_WIDTH.rods));
  const outlinePistons = pair(createOutlineMaterial(1.25), createPencilOutlineMaterial(PENCIL_OUTLINE_WIDTH.pistons));

  const slots: Slot[] = [];
  const secondStrokes: LineSegments[] = [];
  const mesh = (geometry: BufferGeometry, m: { cad: ShaderMaterial; pencil: ShaderMaterial }) => {
    const object = new Mesh(geometry, m.cad);
    slots.push({ object, cad: m.cad, pencil: m.pencil });
    return object;
  };
  const lineSet = (geometry: BufferGeometry, m: { cad: ShaderMaterial; pencil: ShaderMaterial }, withSecondStroke = true) => {
    const object = new LineSegments(geometry, m.cad);
    slots.push({ object, cad: m.cad, pencil: m.pencil });
    const out: LineSegments[] = [object];
    if (withSecondStroke) {
      const second = new LineSegments(geometry, secondStroke);
      second.visible = false;
      secondStrokes.push(second);
      out.push(second);
    }
    return out;
  };

  const root = new Group();
  root.name = "engine_prototype";

  const part = (
    name: string,
    surface: BufferGeometry,
    material: { cad: ShaderMaterial; pencil: ShaderMaterial },
    outline: { cad: ShaderMaterial; pencil: ShaderMaterial },
    lineGeometry: BufferGeometry,
  ) => {
    const g = new Group();
    g.name = name;
    g.add(mesh(surface, material), mesh(surface, outline), ...lineSet(lineGeometry, lines));
    return g;
  };

  // Blok (nieruchomy)
  const block = buildBlock();
  const blockGroup = new Group();
  blockGroup.name = "engine_block";
  blockGroup.add(mesh(track(block.section), section), mesh(track(block.interior), interior));
  blockGroup.add(...lineSet(track(buildSketchLines(block.lines, ORDER.block)), lines));
  blockGroup.add(...lineSet(track(buildSketchLines(block.axes, ORDER.axes)), axes, false));
  root.add(blockGroup);

  // Wał korbowy
  const crank = buildCrankshaft();
  const crankshaft = part("crankshaft", track(crank.surface), crankSurface, outlineCrank, track(buildSketchLines(crank.lines, ORDER.crank)));
  root.add(crankshaft);

  // Korbowody i tłoki — jedna geometria powierzchni na typ części
  const rod = buildConnectingRod();
  const piston = buildPiston();
  track(rod.surface);
  track(piston.surface);
  const rods: Group[] = [];
  const pistons: Group[] = [];
  for (let i = 0; i < 4; i++) {
    const r = part(`connecting_rod_${i + 1}`, rod.surface, rodSurface, outlineRods, track(buildSketchLines(rod.lines, ORDER.rod(i))));
    const p = part(`piston_${i + 1}`, piston.surface, pistonSurface, outlinePistons, track(buildSketchLines(piston.lines, ORDER.piston(i))));
    rods.push(r);
    pistons.push(p);
    root.add(r, p);
  }

  const parts: EngineParts = { crankshaft, rods, pistons, block: blockGroup };
  const lineMaterials = [lines.cad, lines.pencil, axes.cad, axes.pencil, secondStroke];
  const pencilLineMaterials = [lines.pencil, axes.pencil, secondStroke];
  const surfaces = [section, interior, crankSurface, rodSurface, pistonSurface];
  const surfaceMaterials = surfaces.flatMap((s) => [s.cad, s.pencil]);
  const outlines = [
    { m: outlineCrank, start: ORDER.crank.start, width: PENCIL_OUTLINE_WIDTH.crank },
    { m: outlineRods, start: ORDER.rod(0).start, width: PENCIL_OUTLINE_WIDTH.rods },
    { m: outlinePistons, start: ORDER.piston(0).start, width: PENCIL_OUTLINE_WIDTH.pistons },
  ];
  let outlineStrength = 1;

  return {
    root,
    parts,
    update: ({ reveal, shade, shaftAngle, pixelRatio, width, height }) => {
      for (const m of lineMaterials) m.uniforms.uReveal.value = reveal;
      for (const m of pencilLineMaterials) m.uniforms.uResolution.value.set(width, height);
      for (const m of surfaceMaterials) {
        m.uniforms.uShade.value = shade;
        m.uniforms.uPixelRatio.value = pixelRatio;
      }
      const sectionReveal = easeInOut((reveal - 0.35) / 0.4);
      section.cad.uniforms.uSectionReveal.value = sectionReveal;
      section.pencil.uniforms.uSectionReveal.value = sectionReveal;
      for (const o of outlines) {
        const opacity = 0.85 * clamp01((reveal - o.start) / 0.3);
        o.m.cad.uniforms.uOpacity.value = opacity;
        o.m.pencil.uniforms.uOpacity.value = Math.min(1, opacity * (0.75 + 0.25 * outlineStrength));
        o.m.cad.uniforms.uResolution.value.set(width, height);
        o.m.pencil.uniforms.uResolution.value.set(width, height);
      }
      applyEngineState(parts, PROTOTYPE_RIG, shaftAngle);
    },
    setStyle: (style) => {
      for (const s of slots) s.object.material = style === "pencil" ? s.pencil : s.cad;
      for (const l of secondStrokes) l.visible = style === "pencil";
    },
    setPencilParams: (p, hatchLayers) => {
      outlineStrength = p.outlineStrength;
      for (const s of surfaces) {
        const u = s.pencil.uniforms;
        u.uGraphiteStrength.value = p.graphiteStrength;
        u.uHatchSpacing.value = HATCH_SPACING_MM / Math.max(0.25, p.hatchingDensity);
        u.uPaperStrength.value = p.paperTextureStrength;
        u.uIrregularity.value = p.lineIrregularity;
        u.uLayers.value = hatchLayers;
      }
      for (const m of pencilLineMaterials) {
        m.uniforms.uStrength.value = p.outlineStrength;
        m.uniforms.uIrregularity.value = p.lineIrregularity;
      }
      for (const o of outlines) {
        o.m.pencil.uniforms.uWidth.value = o.width * p.outlineStrength;
        o.m.pencil.uniforms.uIrregularity.value = p.lineIrregularity;
      }
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
  /** Styl renderowania — przełączany bez resetu animacji i kamery. */
  renderStyle?: RenderStyle;
  /** Parametry szkicu ołówkiem (tryb "pencil"). */
  pencilParams?: PencilParams;
  /** Liczba warstw kreskowania (2 na słabszych urządzeniach, 3 domyślnie). */
  hatchLayers?: number;
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
export function EngineAssembly({
  playing,
  speedRpm,
  reducedMotion,
  renderStyle = DEFAULT_RENDER_STYLE,
  pencilParams = DEFAULT_PENCIL_PARAMS,
  hatchLayers = 3,
  onIntroDone,
  onStopped,
}: EngineAssemblyProps) {
  const engine = useMemo(() => createProceduralEngine(), []);
  useEffect(() => () => engine.dispose(), [engine]);
  const invalidate = useThree((s) => s.invalidate);

  // Styl i parametry szkicu — zmiana nie dotyka stanu symulacji ani kamery.
  useEffect(() => {
    engine.setStyle(renderStyle);
    invalidate();
  }, [engine, renderStyle, invalidate]);
  useEffect(() => {
    engine.setPencilParams(pencilParams, hatchLayers);
    invalidate();
  }, [engine, pencilParams, hatchLayers, invalidate]);

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
