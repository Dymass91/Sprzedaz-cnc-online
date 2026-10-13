import { useId, type CSSProperties } from "react";
import { drawProps, fadeProps } from "./draw";

type TechnicalSectionProps = {
  className?: string;
  color?: string;
  /** Kolor kreskowania przekroju. */
  hatchColor?: string;
  /** Animowana linia skanująca przekrój. */
  scanning?: boolean;
  delay?: number | false;
  label?: string;
};

/*
 * Półprzekrój toczonej tulei schodkowej we własnym układzie 200×90.
 * Górna połowa w przekroju (kreskowanie), dolna w widoku.
 */
const OUTER = "M10 45V22H50V14H130V24H190V45";
const BORE_TOP = "M10 33H60V30H190";
const SECTION = "M10 33V22H50V14H130V24H190V30H60V33Z";
const VIEW = "M10 45V68H50V76H130V66H190V45";

/**
 * Animowany przekrój części obrotowej — kreskowanie, oś symetrii,
 * oznaczenie płaszczyzny cięcia i przesuwająca się linia „skanu”.
 * Renderuje <g> o wymiarach 200×90 — umieść w <svg> lub <AnimatedDrawing>.
 */
export function TechnicalSection({
  className,
  color = "#2e3848",
  hatchColor = "#2f66d0",
  scanning = true,
  delay = false,
  label = "A–A",
}: TechnicalSectionProps) {
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const animated = delay !== false;
  const line = (d: number) => (animated ? drawProps(delay + d, 1.4) : {});
  const fade = (d: number) => (animated ? fadeProps(delay + d) : {});
  return (
    <g className={className}>
      <defs>
        <pattern id={`${id}-h`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke={hatchColor} strokeWidth="0.8" strokeOpacity="0.7" />
        </pattern>
        <clipPath id={`${id}-c`}>
          <rect x="0" y="0" width="200" height="90" />
        </clipPath>
      </defs>
      <g {...fade(1.2)}>
        <path d={SECTION} fill={`url(#${id}-h)`} />
      </g>
      <g fill="none" stroke={color} strokeWidth={0.9}>
        <path d={OUTER} {...line(0)} />
        <path d={VIEW} {...line(0.2)} />
        <path d={BORE_TOP} {...line(0.4)} />
        <path d="M50 22V68M130 24V66M60 33V57" strokeWidth={0.5} {...line(0.6)} />
        <line x1="2" y1="45" x2="198" y2="45" strokeWidth={0.5} strokeDasharray="10 3 2 3" />
      </g>
      <g fill={color} fontFamily="var(--font-mono)" fontSize="8" {...fade(1.4)}>
        <text x="94" y="9">
          {label}
        </text>
      </g>
      {scanning ? (
        <g clipPath={`url(#${id}-c)`}>
          <line
            x1="4"
            y1="6"
            x2="4"
            y2="84"
            stroke={hatchColor}
            strokeWidth="1"
            strokeOpacity="0.8"
            className="tech-scan"
            style={{ "--scan-distance": "190px" } as CSSProperties}
          />
        </g>
      ) : null}
    </g>
  );
}
