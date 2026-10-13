import type { MaterialId as MaterialCategory } from "@/features/materials/data";

/**
 * Opcje parametrów zamówienia. Wartości opisowe — bez cen i gwarantowanych
 * terminów. Zależności materiał ↔ wykończenie/tolerancja opisuje
 * `getFinishAvailability` / `getToleranceAvailability`.
 */

/* ------------------------------ Materiały ------------------------------ */

export type MaterialOptionId = "al-6061" | "al-7075" | "steel-s235" | "stainless-304" | "brass" | "pom" | "titanium" | "other";

export type MaterialOption = {
  id: MaterialOptionId;
  label: string;
  /** Grupa materiałowa — powiązanie z kartami w sekcji „Wybierz materiał”. */
  category: MaterialCategory | null;
  group: "Metale" | "Tworzywa" | "Do konsultacji";
  /** Materiał wymaga potwierdzenia dostępności przez technologa. */
  requiresConsultation: boolean;
};

export const materialOptions: MaterialOption[] = [
  { id: "al-6061", label: "Aluminium 6061", category: "aluminium", group: "Metale", requiresConsultation: false },
  { id: "al-7075", label: "Aluminium 7075", category: "aluminium", group: "Metale", requiresConsultation: false },
  { id: "steel-s235", label: "Stal S235", category: "steel", group: "Metale", requiresConsultation: false },
  { id: "stainless-304", label: "Stal nierdzewna 304", category: "stainless", group: "Metale", requiresConsultation: false },
  { id: "brass", label: "Mosiądz", category: "brass", group: "Metale", requiresConsultation: false },
  { id: "pom", label: "POM (poliacetal)", category: "plastic", group: "Tworzywa", requiresConsultation: false },
  { id: "titanium", label: "Tytan — do konsultacji", category: "titanium", group: "Do konsultacji", requiresConsultation: true },
  { id: "other", label: "Inny materiał — do konsultacji", category: null, group: "Do konsultacji", requiresConsultation: true },
];

export function getMaterialOption(id: MaterialOptionId): MaterialOption {
  return materialOptions.find((m) => m.id === id) ?? materialOptions[0];
}

/** Domyślna opcja dla karty materiału ze strony głównej. */
export function defaultMaterialForCategory(category: MaterialCategory): MaterialOptionId {
  return materialOptions.find((m) => m.category === category)?.id ?? "other";
}

/* ----------------------------- Tolerancje ------------------------------ */

export type ToleranceId = "standard" | "increased" | "drawing";

export const toleranceOptions: { id: ToleranceId; label: string; hint: string }[] = [
  { id: "standard", label: "Standardowa", hint: "Tolerancje ogólne wg ISO 2768-m (ok. ±0,1 mm dla typowych wymiarów)." },
  { id: "increased", label: "Podwyższona", hint: "Węższe tolerancje wybranych wymiarów — wartości potwierdzimy po analizie." },
  { id: "drawing", label: "Według rysunku technicznego", hint: "Tolerancje z rysunku — rysunek prześlesz w kolejnym kroku zapytania." },
];

/* ----------------------------- Wykończenia ----------------------------- */

export type FinishId = "none" | "deburring" | "anodizing" | "other";

export const finishOptions: { id: FinishId; label: string }[] = [
  { id: "none", label: "Bez dodatkowej obróbki powierzchniowej" },
  { id: "deburring", label: "Gratowanie" },
  { id: "anodizing", label: "Anodowanie" },
  { id: "other", label: "Inne / do ustalenia" },
];

/* ------------------------------- Terminy ------------------------------- */

export type LeadTimeId = "standard" | "urgent";

export const leadTimeOptions: { id: LeadTimeId; label: string; hint: string }[] = [
  { id: "standard", label: "Standardowy", hint: "Termin podamy w wycenie." },
  { id: "urgent", label: "Pilny — do potwierdzenia", hint: "Możliwość realizacji priorytetowej potwierdzimy po analizie." },
];

/* ------------------------------ Zależności ----------------------------- */

export type Availability = { status: "available" } | { status: "consult"; note: string } | { status: "unavailable"; note: string };

export function getFinishAvailability(material: MaterialOptionId, finish: FinishId): Availability {
  const option = getMaterialOption(material);
  if (finish === "anodizing") {
    if (option.category === "aluminium") return { status: "available" };
    if (option.requiresConsultation) return { status: "consult", note: "Możliwość anodowania zależy od materiału — potwierdzimy." };
    return { status: "unavailable", note: "Anodowanie dotyczy aluminium." };
  }
  if (finish === "other") return { status: "consult", note: "Opisz oczekiwane wykończenie w uwagach do zapytania." };
  return { status: "available" };
}

export function getToleranceAvailability(material: MaterialOptionId, tolerance: ToleranceId): Availability {
  if (tolerance === "increased" && material === "pom") {
    return { status: "consult", note: "Tworzywa zmieniają wymiary pod wpływem temperatury — podwyższone tolerancje wymagają konsultacji." };
  }
  if (tolerance === "increased" && getMaterialOption(material).requiresConsultation) {
    return { status: "consult", note: "Tolerancje dla tego materiału potwierdzimy indywidualnie." };
  }
  return { status: "available" };
}

/* -------------------------------- Ilość -------------------------------- */

export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 10000;

export function parseQuantity(raw: string): { ok: true; value: number } | { ok: false; message: string } {
  if (raw.trim() === "") return { ok: false, message: "Podaj liczbę sztuk." };
  const value = Number(raw);
  if (!Number.isInteger(value)) return { ok: false, message: "Liczba sztuk musi być liczbą całkowitą." };
  if (value < QUANTITY_MIN) return { ok: false, message: `Minimum to ${QUANTITY_MIN} sztuka.` };
  if (value > QUANTITY_MAX) return { ok: false, message: `Dla zamówień powyżej ${QUANTITY_MAX} szt. skontaktuj się z nami.` };
  return { ok: true, value };
}
