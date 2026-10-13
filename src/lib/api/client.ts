/**
 * Punkt integracji z backendem VEXOR (wyceny, upload plików, zamówienia).
 *
 * Backend jeszcze nie istnieje. Gdy powstanie, ustaw `NEXT_PUBLIC_API_URL`
 * i zaimplementuj wywołania w modułach `src/features/*` przez `apiFetch`.
 * Do tego czasu `isApiConfigured()` zwraca `false`, a interfejs komunikuje
 * to użytkownikowi zamiast udawać wysyłkę.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function isApiConfigured(): boolean {
  return Boolean(API_URL);
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new ApiError("Backend VEXOR nie jest jeszcze skonfigurowany.", 503);
  const response = await fetch(new URL(path, API_URL), {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!response.ok) throw new ApiError(`Błąd API (${response.status})`, response.status);
  return (await response.json()) as T;
}
