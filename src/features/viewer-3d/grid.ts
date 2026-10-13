import { unitToMm, type LengthUnit } from "@/features/geometry/units";
import type { Vec3Tuple } from "@/features/geometry/types";

/** Krok siatki konstrukcyjnej w mm: 1, 2, 5 × 10^n — ok. 8–10 pól na największy wymiar. */
export function gridStepMm(maxDimensionMm: number): number {
  const raw = Math.max(maxDimensionMm / 8, 0.1);
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow;
}

export function gridStepLabel(size: Vec3Tuple, unit: LengthUnit): string {
  const step = gridStepMm(Math.max(...size) * unitToMm(unit));
  return `${step.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} mm`;
}
