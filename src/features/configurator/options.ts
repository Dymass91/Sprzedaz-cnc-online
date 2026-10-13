/**
 * Opcje parametrów części dostępne w konfiguratorze.
 * Wartości opisowe — nie zawierają cen ani gwarantowanych terminów.
 */

export type ToleranceId = "standard" | "precise" | "high" | "drawing";
export type LeadTimeId = "standard" | "express" | "flexible";

export const tolerances: { id: ToleranceId; label: string; hint: string }[] = [
  { id: "standard", label: "Standardowe (±0,1 mm)", hint: "Ogólne tolerancje wg ISO 2768-m" },
  { id: "precise", label: "Dokładne (±0,05 mm)", hint: "Dla pasowań i powierzchni współpracujących" },
  { id: "high", label: "Wysokie (±0,02 mm)", hint: "Wymaga analizy wykonalności" },
  { id: "drawing", label: "Wg rysunku technicznego", hint: "Dołącz rysunek PDF/DXF z tolerancjami" },
];

export const leadTimes: { id: LeadTimeId; label: string; hint: string }[] = [
  { id: "standard", label: "Standardowy", hint: "Termin podamy w wycenie" },
  { id: "express", label: "Ekspresowy", hint: "Priorytet w kolejce produkcji — wycena indywidualna" },
  { id: "flexible", label: "Elastyczny", hint: "Dłuższy termin w zamian za optymalny koszt" },
];

export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 10000;

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return QUANTITY_MIN;
  return Math.min(QUANTITY_MAX, Math.max(QUANTITY_MIN, Math.round(value)));
}
