import type { Vec2 } from "@/lib/geometry/iso";

/**
 * Palety „materiałowe” dla ilustracji części. Każda paleta opisuje
 * gradienty dla ścian górnych, przednich, bocznych, walców i otworów.
 */
export type MetalPalette = {
  top: [string, string];
  front: [string, string];
  side: [string, string];
  slope: [string, string];
  /** Przekrój poprzeczny walca: cień → odblask → cień. */
  cylinder: [string, string, string, string, string];
  bore: [string, string];
  edge: string;
  outline: string;
};

export const metalPalettes = {
  aluminium: {
    top: ["#f7f9fb", "#c8cfd6"],
    front: ["#c6cdd4", "#7a838d"],
    side: ["#9ea7b1", "#566069"],
    slope: ["#e9edf1", "#a3acb5"],
    cylinder: ["#59616a", "#c3cad1", "#fbfcfd", "#9ba4ad", "#4a5158"],
    bore: ["#262c33", "#8b949d"],
    edge: "rgba(255,255,255,0.85)",
    outline: "rgba(28,38,53,0.45)",
  },
  steel: {
    top: ["#e8ebee", "#a4acb5"],
    front: ["#a9b1ba", "#5a626c"],
    side: ["#808993", "#3d444c"],
    slope: ["#d5dae0", "#8c959f"],
    cylinder: ["#454c54", "#a9b1ba", "#eef1f4", "#828b95", "#383e45"],
    bore: ["#1d2228", "#727b85"],
    edge: "rgba(255,255,255,0.7)",
    outline: "rgba(20,28,40,0.5)",
  },
  stainless: {
    top: ["#f4f6f8", "#bcc4cc"],
    front: ["#bfc7cf", "#6c7680"],
    side: ["#929ca6", "#4a535c"],
    slope: ["#e4e8ec", "#98a2ac"],
    cylinder: ["#4e5760", "#bac2ca", "#ffffff", "#939ca6", "#424a52"],
    bore: ["#22282e", "#808a94"],
    edge: "rgba(255,255,255,0.9)",
    outline: "rgba(28,38,53,0.45)",
  },
  brass: {
    top: ["#f6e6bb", "#c9a35a"],
    front: ["#d4b06a", "#87672a"],
    side: ["#ab8641", "#664b1b"],
    slope: ["#ecd49a", "#b18c45"],
    cylinder: ["#6a4e1d", "#cfaa62", "#fcf0cc", "#b38d45", "#5a4218"],
    bore: ["#35280f", "#9a783a"],
    edge: "rgba(255,248,225,0.9)",
    outline: "rgba(70,50,15,0.5)",
  },
  plastic: {
    top: ["#ffffff", "#e8ebee"],
    front: ["#f1f3f5", "#c9cfd5"],
    side: ["#dce0e4", "#aeb5bc"],
    slope: ["#fafbfc", "#d3d8dd"],
    cylinder: ["#b3bac1", "#eef1f3", "#ffffff", "#d8dde2", "#a7aeb6"],
    bore: ["#7d858e", "#d0d5da"],
    edge: "rgba(255,255,255,1)",
    outline: "rgba(28,38,53,0.28)",
  },
  titanium: {
    top: ["#e1e1e3", "#9a9a9e"],
    front: ["#a3a4a8", "#55565b"],
    side: ["#7b7c81", "#3b3c41"],
    slope: ["#cfd0d3", "#87888d"],
    cylinder: ["#3f4045", "#9fa0a5", "#e9e9eb", "#7c7d82", "#35363a"],
    bore: ["#1e1f22", "#6d6e73"],
    edge: "rgba(255,255,255,0.65)",
    outline: "rgba(25,25,30,0.5)",
  },
} satisfies Record<string, MetalPalette>;

export type MetalName = keyof typeof metalPalettes;

/** Wspólne gradienty ścian. Identyfikatory: `${id}-top`, `-front`, `-side`, `-slope`, `-bore`, `-hatch`. */
export function MetalDefs({ id, palette }: { id: string; palette: MetalPalette }) {
  return (
    <>
      <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={palette.top[0]} />
        <stop offset="0.55" stopColor={palette.top[1]} />
        <stop offset="0.75" stopColor={palette.top[0]} stopOpacity="0.9" />
        <stop offset="1" stopColor={palette.top[1]} />
      </linearGradient>
      <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stopColor={palette.front[0]} />
        <stop offset="0.5" stopColor={palette.front[1]} />
        <stop offset="0.62" stopColor={palette.front[0]} stopOpacity="0.95" />
        <stop offset="1" stopColor={palette.front[1]} />
      </linearGradient>
      <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={palette.side[0]} />
        <stop offset="1" stopColor={palette.side[1]} />
      </linearGradient>
      <linearGradient id={`${id}-slope`} x1="0" y1="0" x2="1" y2="0.6">
        <stop offset="0" stopColor={palette.slope[1]} />
        <stop offset="0.45" stopColor={palette.slope[0]} />
        <stop offset="1" stopColor={palette.slope[1]} />
      </linearGradient>
      <radialGradient id={`${id}-bore`} cx="0.62" cy="0.7" r="0.75">
        <stop offset="0" stopColor={palette.bore[1]} />
        <stop offset="0.7" stopColor={palette.bore[0]} />
      </radialGradient>
      <pattern id={`${id}-hatch`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="5" stroke="#2f66d0" strokeWidth="1" strokeOpacity="0.55" />
      </pattern>
      <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </>
  );
}

/** Gradient poprzeczny walca w układzie ekranu. */
export function CylinderGradient({ id, from, to, palette }: { id: string; from: Vec2; to: Vec2; palette: MetalPalette }) {
  const [c0, c1, c2, c3, c4] = palette.cylinder;
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}>
      <stop offset="0" stopColor={c0} />
      <stop offset="0.22" stopColor={c1} />
      <stop offset="0.38" stopColor={c2} />
      <stop offset="0.66" stopColor={c3} />
      <stop offset="1" stopColor={c4} />
    </linearGradient>
  );
}
