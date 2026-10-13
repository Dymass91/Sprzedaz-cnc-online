/**
 * Jedno miejsce konfiguracji obsługiwanych formatów i limitów plików CAD.
 * Te same wartości powinna stosować przyszła walidacja po stronie serwera.
 */

export type ModelFormat = "stl" | "step";

/** Formaty, które konfigurator naprawdę potrafi odczytać i wyświetlić. */
export const SUPPORTED_MODEL_FORMATS = [
  { extension: "step", format: "step", label: "STEP" },
  { extension: "stp", format: "step", label: "STP" },
  { extension: "stl", format: "stl", label: "STL" },
] as const satisfies readonly { extension: string; format: ModelFormat; label: string }[];

/** Formaty planowane — rozpoznajemy je, żeby dać konkretny komunikat zamiast ogólnego błędu. */
export const PLANNED_MODEL_FORMATS = ["iges", "igs", "obj", "dxf", "3mf", "x_t", "sldprt", "ipt", "f3d"] as const;

/** Maksymalny rozmiar pliku (bajty) dla danego formatu. STEP jest tekstowy i kosztowny w analizie. */
export const MAX_MODEL_FILE_SIZE: Record<ModelFormat, number> = {
  stl: 50 * 1024 * 1024,
  step: 30 * 1024 * 1024,
};

/** Górny limit trójkątów — chroni pamięć przeglądarki przy nietypowych plikach. */
export const MAX_MODEL_TRIANGLES = 2_500_000;

/** Maksymalny czas analizy pliku STEP w przeglądarce (ms). Po nim worker jest przerywany. */
export const STEP_ANALYSIS_TIMEOUT_MS = 120_000;

/**
 * Parametry triangulacji OCCT: ugięcie liniowe jako ułamek przekątnej bounding box
 * (dokładność podglądu i objętości), ugięcie kątowe w radianach.
 */
export const STEP_TESSELLATION = {
  linearUnit: "millimeter",
  linearDeflectionType: "bounding_box_ratio",
  linearDeflection: 0.001,
  angularDeflection: 0.5,
} as const;

/** Silnik CAD — wersja musi odpowiadać pakietowi `occt-import-js` (kopiowanemu do public/vendor). */
export const CAD_ENGINE = {
  name: "occt-import-js",
  version: "0.0.23",
  basePath: "/vendor/occt-import-js/0.0.23",
} as const;

/** Wersja algorytmu analizy — zmieniaj przy każdej zmianie wpływającej na wyniki. */
export const ANALYSIS_VERSION = "2026.10.1";
