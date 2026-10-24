"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AnimatedDrawing, DimensionLine, drawProps, fadeProps, TechnicalCrosshair } from "@/components/engineering";
import { bounds, box, circle3d, cylinder, iso, pathFrom2d, type Vec2, type Vec3 } from "@/lib/geometry/iso";
import { ENGINE_DIMENSIONS, PROTOTYPE_RIG } from "@/lib/engine/rig";
import type { RenderStyle } from "../pencilStyle";

/**
 * Szkice części silnika obok animowanego modelu: tłok, korbowód, wał korbowy.
 * Geometria i wymiary pochodzą z tego samego modelu (`ENGINE_DIMENSIONS`,
 * `PROTOTYPE_RIG`) — to rysunki poglądowe, nie dokumentacja produkcyjna.
 *
 * Tryb „pencil”: lekkie falowanie linii (deterministyczny szum SVG),
 * drugie pociągnięcie ołówka i nieregularne kreskowanie. Tryb „cad”:
 * jednolite, precyzyjne kontury. Animacja rysowania wykonuje się raz.
 */

const D = ENGINE_DIMENSIONS;
const R_CRANK = PROTOTYPE_RIG.crank.crankRadius;
const ROD_L = PROTOTYPE_RIG.crank.rodLength;
const PAPER_HALO = "#f3f5f7";
/** Start rysowania szkiców (s) — po konturach silnika, żeby nie konkurowały z jego wejściem. */
const SKETCH_START = 1.2;

type SketchStyle = { ink: string; width: number; pencil: boolean };

function sketchStyle(style: RenderStyle): SketchStyle {
  return style === "pencil" ? { ink: "#363c45", width: 1.05, pencil: true } : { ink: "#2e3848", width: 0.8, pencil: false };
}

/* ------------------------------------------------------------------------ */
/* Wspólne elementy: filtr ołówka, kreskowanie, podwójne pociągnięcie        */
/* ------------------------------------------------------------------------ */

function SketchDefs({ id, s }: { id: string; s: SketchStyle }) {
  return (
    <defs>
      {/* Lekkie falowanie linii — stały seed, więc rysunek jest za każdym razem identyczny */}
      <filter id={`${id}-wobble`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {s.pencil ? (
        <pattern id={`${id}-hatch`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(42)">
          {/* Kreski o różnym nacisku i długości — wzór ręcznego kreskowania */}
          <line x1="0" y1="1" x2="14" y2="1" stroke={s.ink} strokeWidth="0.55" strokeOpacity="0.55" />
          <line x1="2" y1="4.6" x2="12" y2="4.6" stroke={s.ink} strokeWidth="0.5" strokeOpacity="0.38" />
          <line x1="0" y1="8.1" x2="14" y2="8.1" stroke={s.ink} strokeWidth="0.6" strokeOpacity="0.5" />
          <line x1="1" y1="11.4" x2="10" y2="11.4" stroke={s.ink} strokeWidth="0.45" strokeOpacity="0.32" />
        </pattern>
      ) : (
        <pattern id={`${id}-hatch`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke={s.ink} strokeWidth="0.5" strokeOpacity="0.55" />
        </pattern>
      )}
    </defs>
  );
}

/** Kontur części: w trybie ołówka z drugim, lżejszym pociągnięciem. */
function Stroke({
  d,
  s,
  delay,
  width = 1,
  dashed = false,
}: {
  d: string;
  s: SketchStyle;
  delay: number;
  width?: number;
  dashed?: boolean;
}) {
  const common = { fill: "none", stroke: s.ink, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (dashed) {
    return (
      <path d={d} {...common} strokeWidth={s.width * 0.6 * width} strokeDasharray="3 2.5" opacity={0.55} {...fadeProps(delay + 0.8)} />
    );
  }
  return (
    <>
      <path d={d} {...common} strokeWidth={s.width * width} {...drawProps(delay, 1.3)} />
      {s.pencil ? (
        <path
          d={d}
          {...common}
          strokeWidth={s.width * width * 0.55}
          opacity={0.35}
          transform="translate(0.6 0.45)"
          {...drawProps(delay + 0.25, 1.3)}
        />
      ) : null}
    </>
  );
}

function arc(points: Vec2[]) {
  return pathFrom2d(points, false);
}

/** Widoczna (przednia) część okręgu poziomego w rzucie izometrycznym: θ ∈ (−45°, 135°). */
function frontArc(center: Vec3, r: number, front = true, segments = 40): Vec2[] {
  const pts: Vec2[] = [];
  const start = front ? -Math.PI / 4 : (3 * Math.PI) / 4;
  for (let i = 0; i <= segments; i++) {
    const a = start + (i / segments) * Math.PI;
    pts.push(iso([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r, center[2]]));
  }
  return pts;
}

/* ------------------------------------------------------------------------ */
/* Tłok — rzut izometryczny                                                  */
/* ------------------------------------------------------------------------ */

const PISTON = (() => {
  const r = D.bore / 2 - 0.5;
  const crown = D.pinToCrown;
  const skirt = -(D.pistonHeight - D.pinToCrown);
  const body = cylinder("z", [0, 0, skirt], D.pistonHeight, r);
  const cap = circle3d([0, 0, crown], r, "xy").map(iso);
  const xs = cap.map((p) => p[0]);
  const top = Math.min(...cap.map((p) => p[1]));
  const capRight: Vec2 = [Math.max(...xs), iso([0, 0, crown])[1]];
  const bottomRight: Vec2 = [capRight[0], iso([0, 0, skirt])[1]];
  return {
    r,
    body: body.body,
    cap: pathFrom2d(cap),
    rings: [crown - 6, crown - 11, crown - 16].map((z) => arc(frontArc([0, 0, z], r + 0.2))),
    skirtFront: arc(frontArc([0, 0, skirt], r)),
    skirtBack: arc(frontArc([0, 0, skirt], r, false)),
    pinOuter: pathFrom2d(circle3d([r, 0, 0], 11, "yz", 32).map(iso)),
    pinInner: pathFrom2d(circle3d([r, 0, 0], 6.5, "yz", 24).map(iso)),
    axisTop: iso([0, 0, crown + 22]),
    axisBottom: iso([0, 0, skirt - 14]),
    diaFrom: [Math.min(...xs), top] as Vec2,
    diaTo: [Math.max(...xs), top] as Vec2,
    capRight,
    bottomRight,
  };
})();

function PistonSketch({ s, id, t0 }: { s: SketchStyle; id: string; t0: number }) {
  const p = PISTON;
  return (
    <g>
      <g filter={s.pencil ? `url(#${id}-wobble)` : undefined}>
        <path d={p.body} fill={PAPER_HALO} stroke="none" />
        {/* Cień po stronie odwróconej od światła — kreskowanie */}
        <clipPath id={`${id}-pclip`}>
          <path d={p.body} />
        </clipPath>
        <g clipPath={`url(#${id}-pclip)`} {...fadeProps(t0 + 1.6)}>
          <rect x={p.capRight[0] - p.r * 0.75} y={-200} width={p.r * 2} height={400} fill={`url(#${id}-hatch)`} />
        </g>
        <path d={p.cap} fill={PAPER_HALO} stroke="none" />
        <Stroke d={p.body} s={s} delay={t0} width={1.15} />
        <Stroke d={p.cap} s={s} delay={t0 + 0.15} />
        {p.rings.map((d, i) => (
          <Stroke key={i} d={d} s={s} delay={t0 + 0.35 + i * 0.1} width={0.7} />
        ))}
        <Stroke d={p.skirtBack} s={s} delay={t0 + 0.5} dashed />
        <Stroke d={p.pinOuter} s={s} delay={t0 + 0.6} width={0.85} />
        <Stroke d={p.pinInner} s={s} delay={t0 + 0.7} width={0.7} />
      </g>
      <line
        x1={p.axisTop[0]}
        y1={p.axisTop[1]}
        x2={p.axisBottom[0]}
        y2={p.axisBottom[1]}
        stroke={s.ink}
        strokeWidth={0.45}
        strokeDasharray="8 2.5 1.5 2.5"
        opacity={0.6}
        {...fadeProps(t0 + 0.9)}
      />
      <DimensionLine
        from={p.diaFrom}
        to={p.diaTo}
        offset={-12}
        label={`Ø${p.r * 2}`}
        color={s.ink}
        fontSize={9}
        delay={t0 + 1.1}
        halo={PAPER_HALO}
      />
      <DimensionLine
        from={p.capRight}
        to={p.bottomRight}
        offset={-14}
        label={`${D.pistonHeight}`}
        color={s.ink}
        fontSize={9}
        delay={t0 + 1.3}
        halo={PAPER_HALO}
      />
    </g>
  );
}

/* ------------------------------------------------------------------------ */
/* Korbowód — widok z przodu                                                 */
/* ------------------------------------------------------------------------ */

const ROD = (() => {
  const big = { r: 31, hole: 21.5 };
  const small = { r: 16, hole: 10.5, y: -ROD_L };
  const bigY = -Math.sqrt(big.r ** 2 - 13 ** 2);
  const smallY = small.y + Math.sqrt(small.r ** 2 - 8.5 ** 2);
  const outline = [
    `M13 ${bigY}`,
    `A${big.r} ${big.r} 0 1 1 -13 ${bigY}`,
    `L-8.5 ${smallY}`,
    `A${small.r} ${small.r} 0 1 1 8.5 ${smallY}`,
    "Z",
  ].join(" ");
  // Wybranie dwuteownika w trzonie
  const web = `M-8 ${bigY - 6} L8 ${bigY - 6} L4.5 ${smallY + 8} L-4.5 ${smallY + 8} Z`;
  return { big, small, outline, web, bigY, smallY };
})();

function RodSketch({ s, id, t0 }: { s: SketchStyle; id: string; t0: number }) {
  const r = ROD;
  return (
    <g>
      <g filter={s.pencil ? `url(#${id}-wobble)` : undefined}>
        <path d={r.outline} fill={PAPER_HALO} stroke="none" />
        <path d={r.web} fill={`url(#${id}-hatch)`} stroke="none" {...fadeProps(t0 + 1.6)} />
        <Stroke d={r.outline} s={s} delay={t0} width={1.15} />
        <Stroke d={r.web} s={s} delay={t0 + 0.35} width={0.6} />
        <Stroke
          d={`M${-r.big.hole} 0 A${r.big.hole} ${r.big.hole} 0 1 0 ${r.big.hole} 0 A${r.big.hole} ${r.big.hole} 0 1 0 ${-r.big.hole} 0`}
          s={s}
          delay={t0 + 0.2}
        />
        <Stroke
          d={`M${-r.small.hole} ${r.small.y} A${r.small.hole} ${r.small.hole} 0 1 0 ${r.small.hole} ${r.small.y} A${r.small.hole} ${r.small.hole} 0 1 0 ${-r.small.hole} ${r.small.y}`}
          s={s}
          delay={t0 + 0.3}
        />
        {/* Linia podziału pokrywy i śruby */}
        <Stroke d={`M${-r.big.r - 6} 0 H${-r.big.hole} M${r.big.hole} 0 H${r.big.r + 6}`} s={s} delay={t0 + 0.45} width={0.7} />
        {[-1, 1].map((side) => (
          <Stroke key={side} d={`M${side * 28} -11 H${side * 37} V14 H${side * 28}`} s={s} delay={t0 + 0.55} width={0.8} />
        ))}
      </g>
      <TechnicalCrosshair x={0} y={0} r={r.big.hole} reach={14} color={s.ink} delay={t0 + 0.9} />
      <TechnicalCrosshair x={0} y={r.small.y} r={r.small.hole} reach={10} color={s.ink} delay={t0 + 1} />
      <line
        x1={0}
        y1={18}
        x2={0}
        y2={r.small.y - 20}
        stroke={s.ink}
        strokeWidth={0.45}
        strokeDasharray="8 2.5 1.5 2.5"
        opacity={0.55}
        {...fadeProps(t0 + 1)}
      />
      <DimensionLine
        from={[0, 0]}
        to={[0, r.small.y]}
        offset={52}
        label={`${ROD_L}`}
        color={s.ink}
        fontSize={9}
        delay={t0 + 1.2}
        halo={PAPER_HALO}
      />
    </g>
  );
}

/* ------------------------------------------------------------------------ */
/* Wał korbowy — rzut izometryczny (oś wału wzdłuż X)                       */
/* ------------------------------------------------------------------------ */

/** Skala szkicu wału: mm → jednostki rysunku (czytelne grubości linii i podpisy). */
const CS = 0.3;

type CrankPart = { x: number; paths: { d: string; fill: "paper" | "hatch" }[] };

const CRANK = (() => {
  const v = (x: number, y: number, z: number): Vec3 => [x * CS, y * CS, z * CS];
  const pitch = D.cylinderPitch;
  const journalW = pitch - 48;
  const parts: CrankPart[] = [];
  const points: Vec2[] = [];
  const cyl = (x0: number, length: number, r: number, z = 0) => {
    const c = cylinder("x", v(x0, 0, z), length * CS, r * CS);
    circle3d(v(x0, 0, z), r * CS, "yz").forEach((p) => points.push(iso(p)));
    circle3d(v(x0 + length, 0, z), r * CS, "yz").forEach((p) => points.push(iso(p)));
    parts.push({
      x: x0 + length / 2,
      paths: [
        { d: c.body, fill: "paper" },
        { d: c.cap, fill: "paper" },
      ],
    });
  };
  for (const k of [-2, -1, 0, 1, 2]) cyl(k * pitch - journalW / 2, journalW, 26);
  PROTOTYPE_RIG.cylinderX.forEach((xc, i) => {
    const up = Math.cos(PROTOTYPE_RIG.phases[i]) >= 0 ? 1 : -1; // wykorbienie w górę (1, 4) lub w dół (2, 3)
    cyl(xc - 11, 22, 21, up * R_CRANK);
    for (const side of [-1, 1]) {
      const x0 = xc + side * 17.5 - 6.5;
      const zTop = up > 0 ? R_CRANK + 25 : 54;
      const zBottom = up > 0 ? -54 : -(R_CRANK + 25);
      const b = box(v(x0, -27, zBottom), v(x0 + 13, 27, zTop));
      parts.push({
        x: x0 + 6.5,
        paths: [
          { d: b.front, fill: "hatch" },
          { d: b.top, fill: "paper" },
          { d: b.side, fill: "paper" },
        ],
      });
    }
  });
  const front = -2 * pitch - journalW / 2;
  const rear = 2 * pitch + journalW / 2;
  cyl(front - 40, 40, 18);
  cyl(front - 58, 18, 50);
  cyl(rear, 12, 34);
  cyl(rear + 12, 16, 100);
  // Kolejność malowania: od dalszego (mniejsze x) do bliższego obserwatorowi
  parts.sort((a, b) => a.x - b.x);
  const b = bounds(points, 10);
  const axisFrom = iso(v(front - 75, 0, 0));
  const axisTo = iso(v(rear + 45, 0, 0));
  return {
    parts,
    viewBox: `${b.minX - 4} ${b.minY - 6} ${b.width + 22} ${b.height + 12}`,
    axisFrom,
    axisTo,
  };
})();

function CrankSketch({ s, id, t0 }: { s: SketchStyle; id: string; t0: number }) {
  const c = CRANK;
  return (
    <g>
      <line
        x1={c.axisFrom[0]}
        y1={c.axisFrom[1]}
        x2={c.axisTo[0]}
        y2={c.axisTo[1]}
        stroke={s.ink}
        strokeWidth={0.45}
        strokeDasharray="9 2.5 1.5 2.5"
        opacity={0.6}
        {...fadeProps(t0 + 0.1)}
      />
      <g filter={s.pencil ? `url(#${id}-wobble)` : undefined}>
        {c.parts.map((p, i) => (
          <g key={i}>
            {p.paths.map((path, j) => (
              <path key={`f${j}`} d={path.d} fill={PAPER_HALO} stroke="none" />
            ))}
            {p.paths
              .filter((path) => path.fill === "hatch")
              .map((path, j) => (
                <path key={`h${j}`} d={path.d} fill={`url(#${id}-hatch)`} stroke="none" {...fadeProps(t0 + 1.5)} />
              ))}
            {p.paths.map((path, j) => (
              <Stroke key={`s${j}`} d={path.d} s={s} delay={t0 + 0.03 * i} width={0.8} />
            ))}
          </g>
        ))}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------------ */
/* Kompozycja                                                                */
/* ------------------------------------------------------------------------ */

function SketchCard({
  index,
  title,
  viewBox,
  children,
  className,
}: {
  index: string;
  title: string;
  viewBox: string;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = `sk${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <figure className={cn("relative flex min-w-0 flex-col", className)}>
      <AnimatedDrawing viewBox={viewBox} className="h-auto w-full overflow-visible" aria-hidden="true">
        {children(id)}
      </AnimatedDrawing>
      <figcaption className="mt-1 flex items-baseline gap-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-500 uppercase">
        <span className="text-ink-300">{index}</span>
        {title}
      </figcaption>
    </figure>
  );
}

export type PartSketchesProps = {
  style: RenderStyle;
  /** Układ: kolumna obok silnika (desktop) lub rząd pod silnikiem (tablet). */
  className?: string;
};

/** Trzy szkice części silnika (tłok, korbowód, wał korbowy) — drugi plan wobec modelu 3D. */
export function PartSketches({ style, className }: PartSketchesProps) {
  const s = sketchStyle(style);
  return (
    <aside aria-label="Szkice części silnika: tłok, korbowód, wał korbowy" className={className}>
      <SketchCard index="01" title="Tłok" viewBox="-78 -76 160 140" className="xl:mx-auto xl:w-[84%]">
        {(id) => (
          <>
            <SketchDefs id={id} s={s} />
            <PistonSketch s={s} id={id} t0={SKETCH_START} />
          </>
        )}
      </SketchCard>
      <SketchCard index="02" title="Korbowód" viewBox="-80 -160 150 200" className="xl:mx-auto xl:w-[64%]">
        {(id) => (
          <>
            <SketchDefs id={id} s={s} />
            <RodSketch s={s} id={id} t0={SKETCH_START + 0.7} />
          </>
        )}
      </SketchCard>
      <SketchCard index="03" title="Wał korbowy" viewBox={CRANK.viewBox}>
        {(id) => (
          <>
            <SketchDefs id={id} s={s} />
            <CrankSketch s={s} id={id} t0={SKETCH_START + 1.4} />
          </>
        )}
      </SketchCard>
      <p className="col-span-full font-mono text-[9.5px] leading-snug text-ink-400">Wymiary modelu poglądowego, mm</p>
    </aside>
  );
}
