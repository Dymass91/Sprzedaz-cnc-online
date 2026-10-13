import type { MaterialId as MaterialCategory } from "@/features/materials/data";
import type { Vec3Tuple } from "@/features/geometry/types";

/**
 * Kontrakt viewera 3D. Viewer zna wyłącznie geometrię i opcje widoku —
 * nie wie nic o formularzach, zapytaniach ani cenach.
 *
 * Rozszerzenia (plan): STEP/IGES po konwersji (Open CASCADE w Web Workerze
 * lub na serwerze) do tej samej postaci `positions`, przekroje, pomiar
 * odległości między punktami, podświetlanie cech obróbkowych.
 */

export type StlViewerProps = {
  /** 9 liczb na trójkąt, w jednostkach pliku. */
  positions: Float32Array;
  min: Vec3Tuple;
  max: Vec3Tuple;
  /** Przelicznik jednostek pliku na mm (do opisów wymiarów i siatki). */
  unitToMm: number;
  /** Grupa materiałowa — dobór wyglądu powierzchni. */
  appearance: MaterialCategory | null;
  wireframe: boolean;
  showDimensions: boolean;
  /** Zmiana wartości resetuje kamerę. */
  resetSignal: number;
  /** Etykieta dostępna dla czytników ekranu. */
  label: string;
};

/** Wygląd powierzchni dla grup materiałowych (lekki PBR, bez tekstur). */
export const surfaceAppearance: Record<MaterialCategory | "default", { color: string; metalness: number; roughness: number }> = {
  aluminium: { color: "#c3cad2", metalness: 0.75, roughness: 0.32 },
  steel: { color: "#9aa2ab", metalness: 0.8, roughness: 0.38 },
  stainless: { color: "#ccd2d8", metalness: 0.85, roughness: 0.24 },
  brass: { color: "#c9a35a", metalness: 0.85, roughness: 0.3 },
  plastic: { color: "#ecebe6", metalness: 0, roughness: 0.55 },
  titanium: { color: "#a3a4a8", metalness: 0.75, roughness: 0.4 },
  default: { color: "#bcc3cb", metalness: 0.6, roughness: 0.4 },
};
