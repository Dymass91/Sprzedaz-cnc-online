import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { bounds, box, circle3d, circlePath, cylinder, iso, pathFrom2d, polygon, ringPath, type Vec3 } from "@/lib/geometry/iso";
import { CylinderGradient, MetalDefs, metalPalettes, type MetalName, type MetalPalette } from "../metal";

/**
 * Zestaw mniejszych części w rzucie izometrycznym: blok materiału,
 * koło zębate, tuleja, kołnierz i kątownik montażowy.
 */

type PartProps = {
  className?: string;
  metal?: MetalName;
  title?: string;
};

function useSvgId(prefix: string) {
  return `${prefix}${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

function PartSvg({
  viewBox,
  className,
  title,
  children,
}: {
  viewBox: string;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={cn("h-auto w-full", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {children}
    </svg>
  );
}

function ContactShadow({ d, id, dx = 4, dy = 14, opacity = 0.2 }: { d: string; id: string; dx?: number; dy?: number; opacity?: number }) {
  return <path d={d} transform={`translate(${dx} ${dy})`} fill="#1c2635" opacity={opacity} filter={`url(#${id}-shadow)`} />;
}

/* ------------------------------------------------------------------------ */
/* Blok materiału                                                            */
/* ------------------------------------------------------------------------ */

const BLOCK = box([0, 0, 0], [100, 100, 58]);
const BLOCK_BOUNDS = bounds(
  ([
    [0, 0, 0],
    [100, 0, 0],
    [100, 100, 0],
    [0, 100, 0],
    [0, 0, 58],
    [100, 0, 58],
    [0, 100, 58],
  ] as Vec3[]).map(iso),
  10,
);
/** Ślady frezowania na górnej powierzchni. */
const BLOCK_MARKS = Array.from({ length: 9 }, (_, i) => {
  const y = 10 + i * 10;
  return pathFrom2d([iso([4, y, 58]), iso([96, y, 58])], false);
});

export function MaterialBlock({ className, metal = "aluminium", title }: PartProps) {
  const id = useSvgId("m");
  const p = metalPalettes[metal];
  return (
    <PartSvg viewBox={`${BLOCK_BOUNDS.minX} ${BLOCK_BOUNDS.minY} ${BLOCK_BOUNDS.width} ${BLOCK_BOUNDS.height + 8}`} className={className} title={title}>
      <defs>
        <MetalDefs id={id} palette={p} />
      </defs>
      <ContactShadow d={BLOCK.top} id={id} dy={62} dx={2} opacity={0.25} />
      <g stroke={p.outline} strokeWidth={0.5} strokeLinejoin="round">
        <path d={BLOCK.front} fill={`url(#${id}-front)`} />
        <path d={BLOCK.side} fill={`url(#${id}-side)`} />
        <path d={BLOCK.top} fill={`url(#${id}-top)`} />
      </g>
      <g stroke={p.edge} strokeWidth={0.35} opacity={0.5}>
        {BLOCK_MARKS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <path d={BLOCK.top} fill="none" stroke={p.edge} strokeWidth={0.9} />
    </PartSvg>
  );
}

/* ------------------------------------------------------------------------ */
/* Koło zębate                                                               */
/* ------------------------------------------------------------------------ */

const GEAR_TEETH = 18;
const GEAR_H = 16;

function gearProfile(z: number): Vec3[] {
  const pts: Vec3[] = [];
  const rOuter = 50;
  const rRoot = 42;
  for (let i = 0; i < GEAR_TEETH; i++) {
    const a0 = (i / GEAR_TEETH) * Math.PI * 2;
    const step = (Math.PI * 2) / GEAR_TEETH;
    const pairs: [number, number][] = [
      [0, rRoot],
      [0.18, rRoot],
      [0.3, rOuter],
      [0.62, rOuter],
      [0.74, rRoot],
    ];
    for (const [t, r] of pairs) {
      const a = a0 + t * step;
      pts.push([Math.cos(a) * r, Math.sin(a) * r, z]);
    }
  }
  return pts;
}

const GEAR_LAYERS = Array.from({ length: GEAR_H * 3 }, (_, i) => polygon(gearProfile(i / 3)));
const GEAR_TOP = polygon(gearProfile(GEAR_H));
const GEAR_HUB = cylinder("z", [0, 0, GEAR_H], 8, 20);
const GEAR_BORE = circlePath([0, 0, GEAR_H + 8], 9, "xy");
const GEAR_KEY = polygon([
  [-3, 7, GEAR_H + 8],
  [3, 7, GEAR_H + 8],
  [3, 12, GEAR_H + 8],
  [-3, 12, GEAR_H + 8],
]);
const GEAR_HOLES = Array.from({ length: 5 }, (_, i) => {
  const a = (i / 5) * Math.PI * 2 + 0.3;
  return circlePath([Math.cos(a) * 31, Math.sin(a) * 31, GEAR_H], 6, "xy", 28);
});
const GEAR_BOUNDS = bounds([...gearProfile(0), ...gearProfile(GEAR_H + 8)].map(iso), 8);

export function GearPart({ className, metal = "steel", title }: PartProps) {
  const id = useSvgId("g");
  const p = metalPalettes[metal];
  return (
    <PartSvg viewBox={`${GEAR_BOUNDS.minX} ${GEAR_BOUNDS.minY} ${GEAR_BOUNDS.width} ${GEAR_BOUNDS.height + 6}`} className={className} title={title}>
      <defs>
        <MetalDefs id={id} palette={p} />
        <CylinderGradient id={`${id}-hub`} from={GEAR_HUB.shadeFrom} to={GEAR_HUB.shadeTo} palette={p} />
      </defs>
      <ContactShadow d={GEAR_LAYERS[0]} id={id} dy={6} />
      {GEAR_LAYERS.map((d, i) => (
        <path key={i} d={d} fill={i < 3 ? p.side[1] : p.front[1]} stroke={i === 0 ? p.outline : "none"} strokeWidth={0.5} />
      ))}
      <path d={GEAR_TOP} fill={`url(#${id}-top)`} stroke={p.outline} strokeWidth={0.5} />
      <path d={GEAR_TOP} fill="none" stroke={p.edge} strokeWidth={0.6} />
      {GEAR_HOLES.map((d, i) => (
        <path key={i} d={d} fill={`url(#${id}-bore)`} stroke={p.outline} strokeWidth={0.4} />
      ))}
      <path d={GEAR_HUB.body} fill={`url(#${id}-hub)`} stroke={p.outline} strokeWidth={0.5} />
      <path d={GEAR_HUB.cap} fill={`url(#${id}-top)`} stroke={p.outline} strokeWidth={0.5} />
      <path d={GEAR_BORE} fill={`url(#${id}-bore)`} />
      <path d={GEAR_KEY} fill={p.bore[0]} />
    </PartSvg>
  );
}

/* ------------------------------------------------------------------------ */
/* Tuleja                                                                    */
/* ------------------------------------------------------------------------ */

const BUSH = cylinder("z", [0, 0, 0], 52, 40);
const BUSH_RING = ringPath([0, 0, 52], 40, 27, "xy");
const BUSH_BORE = circlePath([0, 0, 52], 27, "xy");
const BUSH_CHAMFER = circlePath([0, 0, 52], 37, "xy");
const BUSH_GROOVE = pathFrom2d(
  circle3d([0, 0, 14], 40, "xy")
    .map(iso)
    .filter(([, y], i, arr) => y >= arr.reduce((s, q) => s + q[1], 0) / arr.length - 0.01)
    .sort((a, b) => a[0] - b[0]),
  false,
);
const BUSH_BOUNDS = bounds([...circle3d([0, 0, 0], 40, "xy"), ...circle3d([0, 0, 52], 40, "xy")].map(iso), 8);

function bushingInnerWall(p: MetalPalette, id: string) {
  // Widoczna wewnętrzna ścianka otworu: otwór przesunięty w dół, przycięty do otworu
  return (
    <g clipPath={`url(#${id}-boreclip)`}>
      <path d={BUSH_BORE} fill={p.bore[0]} />
      <path d={BUSH_BORE} transform="translate(0 30)" fill={`url(#${id}-top)`} opacity={0.75} />
    </g>
  );
}

export function BushingPart({ className, metal = "brass", title }: PartProps) {
  const id = useSvgId("t");
  const p = metalPalettes[metal];
  return (
    <PartSvg viewBox={`${BUSH_BOUNDS.minX} ${BUSH_BOUNDS.minY} ${BUSH_BOUNDS.width} ${BUSH_BOUNDS.height + 6}`} className={className} title={title}>
      <defs>
        <MetalDefs id={id} palette={p} />
        <CylinderGradient id={`${id}-body`} from={[-48, 0]} to={[48, 0]} palette={p} />
        <clipPath id={`${id}-boreclip`}>
          <path d={BUSH_BORE} />
        </clipPath>
      </defs>
      <ContactShadow d={circlePath([0, 0, 0], 40, "xy")} id={id} dy={6} />
      <path d={BUSH.body} fill={`url(#${id}-body)`} stroke={p.outline} strokeWidth={0.5} />
      <path d={BUSH_GROOVE} fill="none" stroke={p.outline} strokeWidth={0.8} />
      <path d={BUSH_RING} fill={`url(#${id}-top)`} fillRule="evenodd" stroke={p.outline} strokeWidth={0.5} />
      <path d={BUSH_CHAMFER} fill="none" stroke={p.edge} strokeWidth={0.7} />
      {bushingInnerWall(p, id)}
    </PartSvg>
  );
}

/* ------------------------------------------------------------------------ */
/* Kołnierz                                                                  */
/* ------------------------------------------------------------------------ */

const FLANGE_DISC = cylinder("z", [0, 0, 0], 12, 54);
const FLANGE_HUB = cylinder("z", [0, 0, 12], 18, 28);
const FLANGE_TOP = circlePath([0, 0, 12], 54, "xy");
const FLANGE_BORE = circlePath([0, 0, 30], 16, "xy");
const FLANGE_HUB_CHAMFER = circlePath([0, 0, 30], 25, "xy");
const FLANGE_BOLTS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
  return circlePath([Math.cos(a) * 42, Math.sin(a) * 42, 12], 4.2, "xy", 24);
});
const FLANGE_BOUNDS = bounds([...circle3d([0, 0, 0], 54, "xy"), ...circle3d([0, 0, 30], 28, "xy")].map(iso), 8);

export function FlangePart({ className, metal = "aluminium", title }: PartProps) {
  const id = useSvgId("k");
  const p = metalPalettes[metal];
  return (
    <PartSvg viewBox={`${FLANGE_BOUNDS.minX} ${FLANGE_BOUNDS.minY} ${FLANGE_BOUNDS.width} ${FLANGE_BOUNDS.height + 6}`} className={className} title={title}>
      <defs>
        <MetalDefs id={id} palette={p} />
        <CylinderGradient id={`${id}-disc`} from={[-60, 0]} to={[60, 0]} palette={p} />
        <CylinderGradient id={`${id}-hub`} from={[-32, 0]} to={[32, 0]} palette={p} />
        <clipPath id={`${id}-boreclip`}>
          <path d={FLANGE_BORE} />
        </clipPath>
      </defs>
      <ContactShadow d={circlePath([0, 0, 0], 54, "xy")} id={id} dy={6} />
      <path d={FLANGE_DISC.body} fill={`url(#${id}-disc)`} stroke={p.outline} strokeWidth={0.5} />
      <path d={FLANGE_TOP} fill={`url(#${id}-top)`} stroke={p.outline} strokeWidth={0.5} />
      <path d={circlePath([0, 0, 12], 51, "xy")} fill="none" stroke={p.edge} strokeWidth={0.7} />
      {FLANGE_BOLTS.map((d, i) => (
        <path key={i} d={d} fill={`url(#${id}-bore)`} stroke={p.outline} strokeWidth={0.4} />
      ))}
      <path d={FLANGE_HUB.body} fill={`url(#${id}-hub)`} stroke={p.outline} strokeWidth={0.5} />
      <path d={FLANGE_HUB.cap} fill={`url(#${id}-top)`} stroke={p.outline} strokeWidth={0.5} />
      <path d={FLANGE_HUB_CHAMFER} fill="none" stroke={p.edge} strokeWidth={0.7} />
      <g clipPath={`url(#${id}-boreclip)`}>
        <path d={FLANGE_BORE} fill={p.bore[0]} />
        <path d={FLANGE_BORE} transform="translate(0 16)" fill={`url(#${id}-front)`} opacity={0.7} />
      </g>
    </PartSvg>
  );
}

/* ------------------------------------------------------------------------ */
/* Kątownik / uchwyt montażowy                                               */
/* ------------------------------------------------------------------------ */

const ANGLE_BASE = box([0, 0, 0], [110, 64, 12]);
const ANGLE_WALL = box([0, 0, 12], [14, 64, 84]);
/** Żebra usztywniające (trójkąty w płaszczyźnie XZ). */
const ANGLE_RIBS = [6, 46].map((y) => ({
  face: polygon([
    [14, y + 10, 12],
    [62, y + 10, 12],
    [14, y + 10, 64],
  ]),
  slope: polygon([
    [62, y + 10, 12],
    [14, y + 10, 64],
    [14, y, 64],
    [62, y, 12],
  ]),
}));
const ANGLE_BASE_HOLES = ([
  [88, 16, 12],
  [88, 48, 12],
] as Vec3[]).map((c) => circlePath(c, 5, "xy"));
const ANGLE_WALL_HOLES = ([
  [14, 22, 50],
  [14, 42, 50],
] as Vec3[]).map((c) => circlePath(c, 5, "yz"));
const ANGLE_SLOT = polygon([
  [14, 24, 70],
  [14, 40, 70],
  [14, 40, 76],
  [14, 24, 76],
]);
const ANGLE_BOUNDS = bounds(
  ([
    [0, 0, 0],
    [110, 0, 0],
    [110, 64, 0],
    [0, 64, 0],
    [0, 0, 84],
    [14, 64, 84],
    [0, 64, 84],
  ] as Vec3[]).map(iso),
  8,
);

export function AngleBracketPart({ className, metal = "stainless", title }: PartProps) {
  const id = useSvgId("u");
  const p = metalPalettes[metal];
  return (
    <PartSvg viewBox={`${ANGLE_BOUNDS.minX} ${ANGLE_BOUNDS.minY} ${ANGLE_BOUNDS.width} ${ANGLE_BOUNDS.height + 8}`} className={className} title={title}>
      <defs>
        <MetalDefs id={id} palette={p} />
      </defs>
      <ContactShadow d={ANGLE_BASE.top} id={id} dy={16} />
      <g stroke={p.outline} strokeWidth={0.5} strokeLinejoin="round">
        <path d={ANGLE_BASE.front} fill={`url(#${id}-front)`} />
        <path d={ANGLE_BASE.side} fill={`url(#${id}-side)`} />
        <path d={ANGLE_BASE.top} fill={`url(#${id}-top)`} />
        {ANGLE_BASE_HOLES.map((d, i) => (
          <path key={i} d={d} fill={`url(#${id}-bore)`} />
        ))}
        <path d={ANGLE_WALL.top} fill={`url(#${id}-top)`} />
        <path d={ANGLE_WALL.side} fill={`url(#${id}-slope)`} />
        <path d={ANGLE_WALL.front} fill={`url(#${id}-front)`} />
        {ANGLE_WALL_HOLES.map((d, i) => (
          <path key={i} d={d} fill={`url(#${id}-bore)`} />
        ))}
        <path d={ANGLE_SLOT} fill={`url(#${id}-bore)`} />
        {ANGLE_RIBS.map((r, i) => (
          <g key={i}>
            <path d={r.slope} fill={`url(#${id}-slope)`} />
            <path d={r.face} fill={`url(#${id}-side)`} />
          </g>
        ))}
      </g>
      <path d={ANGLE_BASE.top} fill="none" stroke={p.edge} strokeWidth={0.7} />
    </PartSvg>
  );
}

