import { AnimatedDrawing, BlueprintAnnotation, DimensionLine, TechnicalCrosshair, drawProps, fadeProps } from "@/components/engineering";
import { IsoBracket } from "@/components/illustrations/parts/IsoBracket";
import { anchors, bracketBounds } from "@/components/illustrations/parts/bracket-geometry";
import type { Vec2 } from "@/lib/geometry/iso";

/*
 * Kompozycja hero: rysunek techniczny (rzuty, osie, wymiary) rysowany
 * w czasie + część CNC na pierwszym planie. Oba poziomy dzielą układ
 * 720×520, więc linie wymiarowe trafiają w krawędzie części w każdej skali.
 */

const W = 720;
const H = 520;
const PART = { x: 188, y: 46, width: 468 };
const scale = PART.width / bracketBounds.width;
const toHero = ([x, y]: Vec2): Vec2 => [
  Math.round((PART.x + (x - bracketBounds.minX) * scale) * 10) / 10,
  Math.round((PART.y + (y - bracketBounds.minY) * scale) * 10) / 10,
];

const LINE = "#8592a2";
const INK = "#3a4556";

/** Linie płaszczyzny podstawy w kierunkach izometrycznych. */
const groundLines = Array.from({ length: 9 }, (_, i) => {
  const o = i * 46;
  return `M${120 + o} 520L${470 + o} 318`;
});

export function HeroVisual() {
  const p = {
    left: toHero(anchors.baseFrontLeftBottom),
    right: toHero(anchors.baseFrontRightBottom),
    back: toHero(anchors.baseRightBackBottom),
    bore: toHero(anchors.boreEdge),
    side: toHero(anchors.sideBossCenter),
    topC: toHero(anchors.topBossCenter),
    cb: toHero(anchors.counterbore),
    hole: toHero(anchors.smallHole),
  };

  return (
    <div className="relative aspect-[720/520] w-full">
      {/* Warstwa 1 — rysunek techniczny */}
      <AnimatedDrawing immediate viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <g fill="none" stroke={LINE} strokeWidth={0.7} opacity={0.75}>
          {/* Rzut z góry (prawy górny róg) */}
          <rect x={528} y={70} width={150} height={118} rx={10} {...drawProps(0.1, 1.8)} />
          <circle cx={603} cy={129} r={34} {...drawProps(0.3, 1.4)} />
          <circle cx={603} cy={129} r={18} {...drawProps(0.5, 1.2)} />
          <circle cx={548} cy={88} r={7} {...drawProps(0.7)} />
          <circle cx={658} cy={88} r={7} {...drawProps(0.75)} />
          <circle cx={548} cy={170} r={7} {...drawProps(0.8)} />
          <circle cx={658} cy={170} r={7} {...drawProps(0.85)} />
          <path d="M515 129h176M603 58v142" strokeDasharray="10 3 2 3" strokeWidth={0.5} {...drawProps(0.4, 2)} />
          <path d="M528 70H500M528 188H500" strokeWidth={0.5} {...drawProps(1)} />

          {/* Rzut boczny (prawy dolny) */}
          <path d="M600 262h96v70h-96zM612 262v-24h72v24M630 238v-14h36v14" {...drawProps(0.6, 1.8)} />
          <path d="M648 214v128" strokeDasharray="10 3 2 3" strokeWidth={0.5} {...drawProps(0.9)} />

          {/* Szkic w lewym górnym rogu */}
          <path d="M214 40h170M214 36v8M384 36v8" {...drawProps(0.5)} />
          <path d="M262 62l34 -18 46 0" {...drawProps(0.9)} />
          <path d="M392 40v58h56" strokeWidth={0.5} {...drawProps(1.1)} />

          {/* Płaszczyzna podstawy */}
          {groundLines.map((d, i) => (
            <path key={i} d={d}strokeWidth={0.45} opacity={0.55} {...drawProps(0.2 + i * 0.06, 1.6)} />
          ))}
          <path d="M150 480L600 220" strokeWidth={0.45} opacity={0.5} {...drawProps(0.3, 2)} />
          <path d="M260 520L700 266" strokeWidth={0.45} opacity={0.5} {...drawProps(0.5, 2)} />
        </g>

        {/* Wymiary w rzucie z góry */}
        <DimensionLine from={[528, 70]} to={[678, 70]} offset={-14} label="90" color={INK} delay={1.2} />
        <DimensionLine from={[569, 129]} to={[637, 129]} offset={-48} label="Ø40" color={INK} delay={1.4} fontSize={8} />
        <DimensionLine from={[678, 70]} to={[678, 188]} offset={-16} label="70" color={INK} delay={1.5} />
        <DimensionLine from={[600, 332]} to={[696, 332]} offset={-14} label="58" color={INK} delay={1.6} fontSize={8} />

        {/* Wymiary części */}
        <DimensionLine from={p.left} to={p.right} offset={22} label="172" color={INK} delay={1.8} />
        <DimensionLine from={p.right} to={p.back} offset={20} label="64" color={INK} delay={2} />

        <g fill={INK} fontFamily="var(--font-mono)" fontSize={9} {...fadeProps(2.4)}>
          <text x={226} y={58}>A</text>
          <text x={402} y={94}>(Ø16)</text>
          <text x={560} y={226}>Ra 0.8</text>
        </g>
      </AnimatedDrawing>

      {/* Warstwa 2 — część */}
      <div
        className="absolute animate-[float_9s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{ left: `${(PART.x / W) * 100}%`, top: `${(PART.y / H) * 100}%`, width: `${(PART.width / W) * 100}%` }}
      >
        <IsoBracket sheen title="Wizualizacja korpusu frezowanego CNC z aluminium" />
      </div>

      {/* Warstwa 3 — adnotacje na części */}
      <AnimatedDrawing immediate viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <TechnicalCrosshair x={p.side[0]} y={p.side[1]} r={22} reach={34} color={INK} rotating pulse delay={2.4} />
        <BlueprintAnnotation x={p.bore[0]} y={p.bore[1]} labelX={p.bore[0] - 44} labelY={p.bore[1] - 46} label="Ø32 H7" color={INK} delay={2.6} />
        <BlueprintAnnotation x={p.topC[0]} y={p.topC[1]} labelX={p.topC[0] - 60} labelY={p.topC[1] - 40} label="Ø19 H7" color={INK} delay={2.8} />
        <BlueprintAnnotation x={p.hole[0]} y={p.hole[1]} labelX={p.hole[0] + 40} labelY={p.hole[1] + 26} label="4× Ø8.4" color={INK} delay={3} />
        <BlueprintAnnotation x={p.cb[0]} y={p.cb[1]} labelX={p.cb[0] + 50} labelY={p.cb[1] - 40} label="⌴ Ø26" color={INK} delay={3.2} />
      </AnimatedDrawing>
    </div>
  );
}
