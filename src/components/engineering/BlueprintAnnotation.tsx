import { drawProps, fadeProps } from "./draw";

type BlueprintAnnotationProps = {
  /** Punkt wskazywany. */
  x: number;
  y: number;
  /** Położenie opisu (koniec linii odniesienia). */
  labelX: number;
  labelY: number;
  label: string;
  color?: string;
  fontSize?: number;
  delay?: number | false;
  halo?: string;
};

/** Linia odniesienia z kropką i opisem (np. „Ø18 H7”, „R4”, „6× M5”). */
export function BlueprintAnnotation({
  x,
  y,
  labelX,
  labelY,
  label,
  color = "#2e3848",
  fontSize = 9,
  delay = false,
  halo = "#f4f6f8",
}: BlueprintAnnotationProps) {
  const toRight = labelX >= x;
  const shelf = label.length * fontSize * 0.62 + 4;
  const endX = labelX + (toRight ? shelf : -shelf);
  const animated = delay !== false;
  return (
    <g stroke={color} fill="none" strokeWidth={0.7}>
      <circle cx={x} cy={y} r={1.6} fill={color} stroke="none" {...(animated ? fadeProps(delay) : {})} />
      <path d={`M${x} ${y}L${labelX} ${labelY}L${endX} ${labelY}`} {...(animated ? drawProps(delay, 0.8) : {})} />
      <text
        x={labelX + (toRight ? 2 : -2)}
        y={labelY - 3}
        textAnchor={toRight ? "start" : "end"}
        fontSize={fontSize}
        fontFamily="var(--font-mono)"
        fill={color}
        stroke={halo}
        strokeWidth={3}
        paintOrder="stroke"
        {...(animated ? fadeProps(delay + 0.6) : {})}
      >
        {label}
      </text>
    </g>
  );
}
