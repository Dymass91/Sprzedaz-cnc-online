import { drawProps } from "./draw";

type TechnicalCrosshairProps = {
  x: number;
  y: number;
  r?: number;
  color?: string;
  /** Długość ramion osi poza okręgiem. */
  reach?: number;
  /** Obracający się, kreskowany pierścień. */
  rotating?: boolean;
  pulse?: boolean;
  delay?: number | false;
};

/** Oś/środek otworu: krzyż osi (linia punktowa), okrąg i opcjonalny ruch. */
export function TechnicalCrosshair({
  x,
  y,
  r = 10,
  color = "#2e3848",
  reach = 8,
  rotating = false,
  pulse = false,
  delay = false,
}: TechnicalCrosshairProps) {
  const L = r + reach;
  const animated = delay !== false;
  return (
    <g stroke={color} fill="none" strokeWidth={0.6}>
      <line x1={x - L} y1={y} x2={x + L} y2={y} strokeDasharray="6 2 1 2" />
      <line x1={x} y1={y - L} x2={x} y2={y + L} strokeDasharray="6 2 1 2" />
      <circle cx={x} cy={y} r={r} {...(animated ? drawProps(delay, 1) : {})} />
      {rotating ? (
        <circle cx={x} cy={y} r={r + 3.5} strokeDasharray="2 4" strokeOpacity={0.6} className="tech-rotate" />
      ) : null}
      {pulse ? <circle cx={x} cy={y} r={2.2} fill={color} stroke="none" className="tech-pulse" /> : null}
    </g>
  );
}
