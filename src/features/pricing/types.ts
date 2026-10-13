import type { ProjectRecord } from "@/features/project/types";

/**
 * Kontrakt przyszłego silnika wycen — CELOWO BEZ IMPLEMENTACJI.
 *
 * Silnik będzie działał po stronie serwera (koszty, stawki zakładów i marża
 * VEXOR nie mogą trafić do przeglądarki). Wejście: `ProjectRecord`
 * (plik, parametry, analiza CAD z pochodzeniem danych). Serwer powinien
 * ponowić analizę CAD (pełne OCCT: cechy obróbkowe, liczba zamocowań,
 * promienie, grubości ścian) zamiast ufać danym z przeglądarki.
 */

/** Kwoty w groszach (PLN), netto. */
export type PriceBreakdown = {
  material: number;
  machining: number;
  setup: number;
  finishing: number;
  /** Marża VEXOR — wyliczana tylko po stronie serwera. */
  margin: number;
  total: number;
};

export type PricingResult =
  | { kind: "automatic"; unitPrice: PriceBreakdown; totalPrice: PriceBreakdown; leadTimeDays: number; validUntil: string; analysisVersion: string }
  | { kind: "manual-review"; reason: string };

/** Interfejs dostawcy wycen — implementacja: wywołanie API po stronie serwera. */
export interface PricingProvider {
  estimate(project: ProjectRecord): Promise<PricingResult>;
}

/**
 * Czy rekord nadaje się do automatycznej wyceny. Wszystko poza tym trafia
 * do ręcznej analizy technologa.
 */
export function pricingReadiness(project: ProjectRecord): { ready: true } | { ready: false; reasons: string[] } {
  const reasons: string[] = [];
  const a = project.analysis;
  if (a.volumeMm3.provenance === "unavailable") reasons.push("Brak wiarygodnej objętości bryły.");
  if (!a.units.confirmed) reasons.push("Niepotwierdzone jednostki modelu.");
  if (project.file.format !== "step") reasons.push("Automatyczna wycena wymaga pliku STEP.");
  if (project.order.material.requiresConsultation) reasons.push("Materiał wymaga konsultacji.");
  if (project.order.quantity === null) reasons.push("Brak poprawnej liczby sztuk.");
  return reasons.length ? { ready: false, reasons } : { ready: true };
}
