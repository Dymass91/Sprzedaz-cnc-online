import { getExtension } from "@/features/cad-files/validation";
import type { QuoteRequestDraft } from "./types";

type DraftInput = Omit<QuoteRequestDraft, "files"> & { files: Pick<File, "name" | "size">[] };

/** Buduje znormalizowany szkic zapytania z aktualnego stanu konfiguratora. */
export function buildQuoteRequestDraft(input: DraftInput): QuoteRequestDraft {
  return {
    ...input,
    files: input.files.map((file) => ({ name: file.name, size: file.size, extension: getExtension(file.name) })),
  };
}

export type QuoteRequestCheck = { ready: true } | { ready: false; issues: string[] };

export function checkQuoteRequest(draft: QuoteRequestDraft): QuoteRequestCheck {
  const issues: string[] = [];
  if (draft.files.length === 0) issues.push("Dodaj co najmniej jeden plik projektu (STEP, STP, STL, IGES, DXF lub OBJ).");
  if (draft.quantity < 1) issues.push("Podaj liczbę sztuk.");
  return issues.length === 0 ? { ready: true } : { ready: false, issues };
}

/**
 * Miejsce na wysyłkę zapytania do backendu (upload plików + utworzenie zapytania).
 * Celowo nie udaje sukcesu: dopóki integracja nie istnieje, zwraca `not-connected`.
 */
export async function submitQuoteRequest(_draft: QuoteRequestDraft): Promise<{ status: "not-connected" }> {
  void _draft;
  return { status: "not-connected" };
}
