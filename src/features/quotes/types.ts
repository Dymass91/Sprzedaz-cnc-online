import type { MaterialId, FinishId } from "@/features/materials/data";
import type { LeadTimeId, ToleranceId } from "@/features/configurator/options";

/**
 * Model zapytania ofertowego. Na tym etapie powstaje wyłącznie po stronie
 * klienta — nie jest wysyłany. Wycena automatyczna (algorytm) i ręczna
 * (analiza technologa) będą zwracać `Quote`.
 */

export type QuoteRequestFile = {
  name: string;
  size: number;
  extension: string;
};

export type QuoteRequestDraft = {
  files: QuoteRequestFile[];
  materialId: MaterialId;
  grade: string;
  quantity: number;
  tolerance: ToleranceId;
  finish: FinishId;
  leadTime: LeadTimeId;
  notes?: string;
};

export type QuoteStatus = "draft" | "submitted" | "in-review" | "quoted" | "expired";

/** Docelowy kształt odpowiedzi z modułu wycen (backend). */
export type Quote = {
  id: string;
  status: QuoteStatus;
  /** Cena netto w groszach — liczby całkowite, bez błędów zaokrągleń. */
  unitPriceNet: number | null;
  totalPriceNet: number | null;
  currency: "PLN";
  leadTimeDays: number | null;
  validUntil: string | null;
  /** Wycena automatyczna vs. analiza technologa. */
  source: "automatic" | "manual";
};
