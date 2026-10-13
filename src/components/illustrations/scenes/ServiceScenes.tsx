import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { box, circlePath, cylinder, iso, type Vec3 } from "@/lib/geometry/iso";
import { CylinderGradient, MetalDefs, metalPalettes } from "../metal";

/**
 * Ilustracje usług: frezowanie (wrzeciono nad półfabrykatem z kieszenią)
 * i toczenie (wałek w uchwycie tokarskim z nożem). Obie 400×300.
 */

const steel = metalPalettes.stainless;
const dark = metalPalettes.steel;

function useSvgId(prefix: string) {
  return `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

/** Siatka i linie rysunku w tle sceny. */
function SceneBlueprint({ variant }: { variant: "mill" | "turn" }) {
  return (
    <g fill="none" stroke="#7b8796" strokeWidth={0.6} opacity={0.55}>
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={300} strokeOpacity={0.35} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 40} x2={400} y2={i * 40} strokeOpacity={0.35} />
      ))}
      {variant === "mill" ? (
        <>
          <rect x={250} y={20} width={120} height={90} />
          <circle cx={310} cy={65} r={26} />
          <circle cx={310} cy={65} r={12} />
          <path d="M250 125h120M250 121v8M370 121v8" />
          <path d="M60 230h80l20 20h60" />
          <path d="M140 20v60M130 30h20" strokeDasharray="6 2 1 2" />
        </>
      ) : (
        <>
          <path d="M20 40h140v50H20z" />
          <path d="M20 65h140" strokeDasharray="8 3 2 3" />
          <path d="M60 40v50M110 40v50" />
          <path d="M20 250h120M20 246v8M140 246v8" />
          <circle cx={330} cy={50} r={22} />
        </>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------------ */
/* Frezowanie                                                                */
/* ------------------------------------------------------------------------ */

const STOCK = box([0, 0, 0], [120, 120, 44]);
const POCKET_OUTER = circlePath([60, 60, 44], 30, "xy");
const POCKET_STEP = circlePath([60, 60, 34], 30, "xy");
const POCKET_INNER = circlePath([60, 60, 34], 18, "xy");
const POCKET_FLOOR = circlePath([60, 60, 20], 18, "xy");
const STOCK_HOLES = ([
  [16, 16, 44],
  [104, 16, 44],
  [16, 104, 44],
  [104, 104, 44],
] as Vec3[]).map((c) => circlePath(c, 5, "xy"));
const TOOL = cylinder("z", [60, 60, 22], 70, 7.5);
const COLLET = cylinder("z", [60, 60, 92], 26, 13);
const HOLDER = cylinder("z", [60, 60, 118], 50, 24);
const SPINDLE = cylinder("z", [60, 60, 168], 90, 34);
const CONTACT = iso([60, 60, 24]);

/** Wióry: [dx, dy, obrót, skala, opóźnienie]. */
const CHIPS: [number, number, number, number, number][] = [
  [-44, -18, 20, 1, 0],
  [-60, 4, -30, 0.8, 0.6],
  [38, -26, 60, 1.1, 1.2],
  [56, -6, 10, 0.7, 0.3],
  [-28, -40, 80, 0.6, 1.8],
  [24, -48, -50, 0.9, 0.9],
  [70, 16, 30, 0.6, 1.5],
  [-74, 22, 0, 0.7, 2.1],
  [6, -60, 40, 0.5, 2.4],
  [-90, -10, -20, 0.5, 0.4],
  [88, -30, 70, 0.55, 1.1],
];

export function MillingScene({ className }: { className?: string }) {
  const id = useSvgId("mill");
  return (
    <svg viewBox="0 0 400 300" className={cn("h-full w-full", className)} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <MetalDefs id={id} palette={steel} />
        <CylinderGradient id={`${id}-tool`} from={TOOL.shadeFrom} to={TOOL.shadeTo} palette={steel} />
        <CylinderGradient id={`${id}-collet`} from={COLLET.shadeFrom} to={COLLET.shadeTo} palette={steel} />
        <CylinderGradient id={`${id}-holder`} from={HOLDER.shadeFrom} to={HOLDER.shadeTo} palette={dark} />
        <CylinderGradient id={`${id}-spindle`} from={SPINDLE.shadeFrom} to={SPINDLE.shadeTo} palette={dark} />
        <radialGradient id={`${id}-glint`}>
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.35" stopColor="#dbe8ff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <SceneBlueprint variant="mill" />
      <g transform="translate(240 150) scale(1.05)">
        <path d={STOCK.top} transform="translate(6 70)" fill="#1c2635" opacity={0.25} filter={`url(#${id}-shadow)`} />
        <g stroke={steel.outline} strokeWidth={0.5} strokeLinejoin="round">
          <path d={STOCK.front} fill={`url(#${id}-front)`} />
          <path d={STOCK.side} fill={`url(#${id}-side)`} />
          <path d={STOCK.top} fill={`url(#${id}-top)`} />
          {STOCK_HOLES.map((d, i) => (
            <path key={i} d={d} fill={`url(#${id}-bore)`} />
          ))}
          <path d={POCKET_OUTER} fill={steel.front[1]} />
          <path d={POCKET_STEP} fill={`url(#${id}-slope)`} />
          <path d={POCKET_INNER} fill={steel.bore[0]} />
          <path d={POCKET_FLOOR} fill={`url(#${id}-top)`} opacity={0.55} />
        </g>
        <path d={POCKET_OUTER} fill="none" stroke={steel.edge} strokeWidth={0.8} />
        <path d={STOCK.top} fill="none" stroke={steel.edge} strokeWidth={0.8} />

        {/* Narzędzie i wrzeciono */}
        <g stroke={dark.outline} strokeWidth={0.5}>
          <path d={TOOL.body} fill={`url(#${id}-tool)`} />
          <path d={COLLET.body} fill={`url(#${id}-collet)`} />
          <path d={COLLET.cap} fill={steel.top[1]} />
          <path d={HOLDER.body} fill={`url(#${id}-holder)`} />
          <path d={HOLDER.cap} fill={dark.top[1]} />
          <path d={SPINDLE.body} fill={`url(#${id}-spindle)`} />
        </g>
        {/* Spirala ostrza */}
        <g stroke="rgba(255,255,255,0.7)" strokeWidth={0.8} fill="none">
          {[0, 1, 2, 3, 4].map((i) => {
            const y0 = CONTACT[1] - 10 - i * 9;
            return <path key={i} d={`M${CONTACT[0] - 4} ${y0}q4 -3 8 -6`} />;
          })}
        </g>

        {/* Iskra w punkcie styku */}
        <circle cx={CONTACT[0]} cy={CONTACT[1] - 4} r={16} fill={`url(#${id}-glint)`} className="tech-pulse" />

        {/* Wióry */}
        {CHIPS.map(([dx, dy, rot, s, delay], i) => (
          <path
            key={i}
            d="M0 0l6 -2 3 4 -4 3z"
            fill={i % 3 === 0 ? steel.top[0] : i % 3 === 1 ? steel.side[0] : steel.front[0]}
            stroke={steel.outline}
            strokeWidth={0.3}
            transform={`translate(${CONTACT[0] + dx} ${CONTACT[1] + dy}) rotate(${rot}) scale(${s * 1.7})`}
            style={{ animationDelay: `${delay}s` } as CSSProperties}
            className="tech-pulse"
          />
        ))}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------------ */
/* Toczenie (widok z boku)                                                   */
/* ------------------------------------------------------------------------ */

const SHAFT_AXIS = 150;
/** Stopnie wałka: [x0, x1, promień]. */
const SHAFT_STEPS: [number, number, number][] = [
  [70, 128, 22],
  [128, 136, 30],
  [136, 196, 42],
  [196, 206, 34],
  [206, 262, 52],
  [262, 300, 58],
];

export function TurningScene({ className }: { className?: string }) {
  const id = useSvgId("turn");
  const shaftPath = SHAFT_STEPS.map(([x0, x1, r]) => `M${x0} ${SHAFT_AXIS - r}H${x1}V${SHAFT_AXIS + r}H${x0}Z`).join("");
  return (
    <svg viewBox="0 0 400 300" className={cn("h-full w-full", className)} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}-shaft`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b535c" />
          <stop offset="0.18" stopColor="#c9d0d7" />
          <stop offset="0.3" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#a3acb5" />
          <stop offset="0.78" stopColor="#5d6670" />
          <stop offset="0.92" stopColor="#8f98a2" />
          <stop offset="1" stopColor="#3d444c" />
        </linearGradient>
        <linearGradient id={`${id}-chuck`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2e3640" />
          <stop offset="0.3" stopColor="#7d8791" />
          <stop offset="0.45" stopColor="#c3cad1" />
          <stop offset="0.7" stopColor="#4f5862" />
          <stop offset="1" stopColor="#1f252c" />
        </linearGradient>
        <linearGradient id={`${id}-band`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={shaftPath} />
        </clipPath>
      </defs>
      <SceneBlueprint variant="turn" />

      {/* Uchwyt tokarski */}
      <g>
        <rect x={300} y={40} width={34} height={220} rx={4} fill={`url(#${id}-chuck)`} />
        <rect x={334} y={20} width={80} height={260} rx={6} fill={`url(#${id}-chuck)`} />
        <rect x={286} y={64} width={30} height={36} rx={2} fill="#3a424b" />
        <rect x={286} y={200} width={30} height={36} rx={2} fill="#3a424b" />
        <path d="M300 40v220M334 20v260" stroke="rgba(255,255,255,0.25)" />
      </g>

      {/* Wałek */}
      <g>
        <path d={shaftPath} fill={`url(#${id}-shaft)`} stroke="#3d444c" strokeWidth={0.6} />
        <g clipPath={`url(#${id}-clip)`}>
          <rect x={60} y={80} width={250} height={26} fill={`url(#${id}-band)`} className="turn-band" />
          {SHAFT_STEPS.map(([x0, , r]) => (
            <line key={x0} x1={x0 + 0.5} y1={SHAFT_AXIS - r} x2={x0 + 0.5} y2={SHAFT_AXIS + r} stroke="rgba(255,255,255,0.65)" />
          ))}
        </g>
        {/* Czoło z nakiełkiem */}
        <ellipse cx={70} cy={SHAFT_AXIS} rx={5} ry={22} fill="#b9c1c9" stroke="#3d444c" strokeWidth={0.6} />
        <ellipse cx={70} cy={SHAFT_AXIS} rx={2} ry={6} fill="#3d444c" />
        <line x1={40} y1={SHAFT_AXIS} x2={330} y2={SHAFT_AXIS} stroke="#2f66d0" strokeWidth={0.6} strokeDasharray="10 3 2 3" opacity={0.7} />
      </g>

      {/* Nóż tokarski */}
      <g>
        <path d="M150 300l-6 -88 28 -10 22 98z" fill="#4a535c" />
        <path d="M144 212l28 -10 2 8 -28 10z" fill="#7e8892" />
        <path d="M144 212l10 -18 12 6z" fill="#d4af37" stroke="#7a5f12" strokeWidth={0.5} />
        <path d="M150 300l-6 -88" stroke="rgba(255,255,255,0.3)" />
      </g>

      {/* Wiór */}
      <path
        d="M156 192c-14 4 -26 14 -22 26 4 10 18 8 20 -2 2 -8 -8 -12 -12 -6"
        fill="none"
        stroke="#c7ced6"
        strokeWidth={2.2}
        strokeLinecap="round"
        className="tech-pulse"
      />
      <circle cx={154} cy={193} r={10} fill="#fff" opacity={0.6} className="tech-pulse" />
    </svg>
  );
}
