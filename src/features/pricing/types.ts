import type { ConfigurationSnapshot } from "@/features/configurator/snapshot";

/**
 * Kontrakt przyszłego silnika wycen — CELOWO BEZ IMPLEMENTACJI.
 *
 * Silnik będzie działał po stronie serwera (koszty, stawki zakładów i marża
 * VEXOR nie mogą trafić do przeglądarki). Wejście: migawka konfiguracji +
 * pełna analiza CAD (Open CASCADE: cechy obróbkowe, liczba zamocowań,
 * minimalne promienie, grubości ścian). Wyjście: rozbicie kosztów,
 * które posłuży też do dokumentacji produkcyjnej PDF dla operatorów CNC.
 */

export type PricingInput = {
  configuration: ConfigurationSnapshot;
  /** Wyniki analizy CAD po stronie serwera (STEP → Open CASCADE). */
  cadFeatures?: {
    setups: number;
    pockets: number;
    holes: number;
    threadedHoles: number;
    minInternalRadiusMm: number | null;
    minWallThicknessMm: number | null;
  };
};

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
  | { kind: "automatic"; unitPrice: PriceBreakdown; totalPrice: PriceBreakdown; leadTimeDays: number; validUntil: string }
  | { kind: "manual-review"; reason: string };
