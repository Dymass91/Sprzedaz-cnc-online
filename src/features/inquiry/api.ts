import { isApiConfigured } from "@/lib/api/client";
import type { InquiryPayload, InquirySubmitResult } from "./types";

/**
 * Wysyłka zapytania ofertowego.
 *
 * Docelowo:
 *  1. POST /inquiries/uploads → podpisany adres uploadu pliku modelu,
 *  2. upload pliku bezpośrednio do magazynu,
 *  3. POST /inquiries z `InquiryPayload` (walidacja po stronie serwera,
 *     ochrona przed spamem, potwierdzenie e-mail).
 *
 * Dopóki backend nie istnieje, funkcja niczego nie wysyła i zwraca
 * `not-connected` — interfejs musi to jasno zakomunikować.
 */
export async function submitInquiry(payload: InquiryPayload): Promise<InquirySubmitResult> {
  void payload;
  if (!isApiConfigured()) return { status: "not-connected" };
  return { status: "error", message: "Integracja API zapytań nie została jeszcze zaimplementowana." };
}
