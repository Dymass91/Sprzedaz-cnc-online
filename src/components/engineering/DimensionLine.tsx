import type { Vec2 } from "@/lib/geometry/iso";
import { drawProps, fadeProps } from "./draw";

type DimensionLineProps = {
  from: Vec2;
  to: Vec2;
  /** Odsunięcie linii wymiarowej (prostopadle do mierzonego odcinka). */
  offset?: number;
  label: string;
  color?: string;
  fontSize?: number;
  /** Rysowanie w czasie (w <AnimatedDrawing>). `false` — statycznie. */
  delay?: number | false;
  /** Kolor obwódki tekstu (tło), dla czytelności na liniach. */
  halo?: string;
};

const ARROW = 5;

/**
 * Linia wymiarowa jak na rysunku technicznym: linie pomocnicze,
 * linia wymiarowa z grotami i opis wzdłuż linii.
 */
export function DimensionLine({
  from,
  to,
  offset = 16,
  label,
  color = "#2e3848",
  fontSize = 9,
  delay = false,
  halo = "#f4f6f8",
}: DimensionLineProps) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const a: Vec2 = [from[0] + nx * offset, from[1] + ny * offset];
  const b: Vec2 = [to[0] + nx * offset, to[1] + ny * offset];
  const over = offset + Math.sign(offset || 1) * 4;
  const arrow = (p: Vec2, dir: 1 | -1) => {
    const baseX = p[0] + ux * ARROW * dir;
    const baseY = p[1] + uy * ARROW * dir;
    return `M${p[0]} ${p[1]}L${baseX + nx * 1.6} ${baseY + ny * 1.6}L${baseX - nx * 1.6} ${baseY - ny * 1.6}Z`;
  };
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  const mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const animated = delay !== false;
  const line = (d: number) => (animated ? drawProps(delay + d, 0.9) : {});
  const fade = (d: number) => (animated ? fadeProps(delay + d) : {});

  return (
    <g stroke={color} fill="none" strokeWidth={0.7}>
      <line x1={from[0]} y1={from[1]} x2={from[0] + nx * over} y2={from[1] + ny * over} strokeOpacity={0.7} {...line(0)} />
      <line x1={to[0]} y1={to[1]} x2={to[0] + nx * over} y2={to[1] + ny * over} strokeOpacity={0.7} {...line(0.1)} />
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} {...line(0.25)} />
      <g fill={color} stroke="none" {...fade(0.9)}>
        <path d={arrow(a, 1)} />
        <path d={arrow(b, -1)} />
        <text
          x={mid[0]}
          y={mid[1]}
          transform={`rotate(${angle} ${mid[0]} ${mid[1]})`}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize}
          fontFamily="var(--font-mono)"
          stroke={halo}
          strokeWidth={3.5}
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          {label}
        </text>
      </g>
    </g>
  );
}
