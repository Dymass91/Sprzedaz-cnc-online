/**
 * Jedno miejsce konfiguracji obsługiwanych formatów i limitów plików CAD.
 * Te same wartości powinna stosować przyszła walidacja po stronie serwera.
 */

/** Formaty, które konfigurator naprawdę potrafi odczytać i wyświetlić. */
export const SUPPORTED_MODEL_FORMATS = [{ extension: "stl", label: "STL" }] as const;

/** Formaty planowane — rozpoznajemy je, żeby dać konkretny komunikat zamiast ogólnego błędu. */
export const PLANNED_MODEL_FORMATS = ["step", "stp", "iges", "igs", "obj", "dxf", "3mf", "x_t", "sldprt"] as const;

/** Maksymalny rozmiar pliku modelu (bajty). */
export const MAX_MODEL_FILE_SIZE = 50 * 1024 * 1024;

/** Górny limit trójkątów — chroni pamięć przeglądarki przy nietypowych plikach. */
export const MAX_MODEL_TRIANGLES = 2_500_000;

export type SupportedModelExtension = (typeof SUPPORTED_MODEL_FORMATS)[number]["extension"];
