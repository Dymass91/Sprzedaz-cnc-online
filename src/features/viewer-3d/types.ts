import type { IllustrationMode } from "@/components/illustrations/types";

/**
 * Kontrakt przyszłego viewera 3D (Three.js / React Three Fiber).
 *
 * Plan:
 *  - `HeroModel` — interaktywny model części w hero (obrót, przejście
 *    szkic → metal), zastąpi statyczną ilustrację <IsoBracket>.
 *  - `PartViewer` — podgląd modeli klientów w konfiguratorze: STL/OBJ
 *    bezpośrednio w przeglądarce, STEP/IGES po konwersji (np. occt-import-js
 *    w Web Workerze albo konwersja na backendzie do glTF).
 *
 * Three.js zostanie dodany razem z pierwszym działającym komponentem,
 * ładowany dynamicznie (`next/dynamic`, `ssr: false`), aby nie obciążać
 * pierwszego wczytania strony.
 */

/** Tryby widoku — wspólne dla ilustracji SVG i przyszłego viewera 3D. */
export type ViewerMode = IllustrationMode;

export const viewerModes: { id: ViewerMode; label: string }[] = [
  { id: "shaded", label: "Widok 3D" },
  { id: "dimensions", label: "Wymiary" },
  { id: "section", label: "Przekrój" },
  { id: "wireframe", label: "Siatka" },
];

export type PartViewerProps = {
  /** Plik CAD klienta (STL/OBJ bezpośrednio; STEP/IGES po konwersji). */
  file: File | null;
  mode: ViewerMode;
  /** Kolor/materiał renderu dobierany do wybranego materiału. */
  materialId: string;
  onModeChange?: (mode: ViewerMode) => void;
};

/** Czy dany format będzie mógł być wyświetlony bez konwersji po stronie serwera. */
export function isBrowserRenderable(extension: string): boolean {
  return extension === "stl" || extension === "obj";
}
