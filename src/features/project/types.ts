import type { ModelFormat } from "@/features/cad-files/config";
import type { ConfigurationSnapshot } from "@/features/configurator/snapshot";
import type { LengthUnit } from "@/features/geometry/units";

/**
 * Rekord projektu — kompletna, serializowalna paczka danych przekazywana
 * do zapytania ofertowego i (w przyszłości) do silnika wycen po stronie serwera.
 *
 * Każda wartość analizy ma pochodzenie (`provenance`):
 *  - "automatic"  — obliczona z geometrii przez oprogramowanie,
 *  - "user"       — podana/potwierdzona przez klienta,
 *  - "unavailable"— nie da się jej wiarygodnie ustalić tą metodą.
 * Żadna wartość nie jest „zweryfikowana”, dopóki nie potwierdzi jej technolog.
 */

export type Provenance = "automatic" | "user" | "unavailable";

export type Measured<T> = { value: T; provenance: "automatic" | "user"; note?: string } | { value: null; provenance: "unavailable"; reason: string };

export type VerificationStatus = "unverified" | "in-review" | "verified" | "rejected";

export type AnalysisWarningCode =
  | "open-mesh"
  | "non-manifold"
  | "inconsistent-normals"
  | "degenerate-triangles"
  | "multiple-solids"
  | "units-unconfirmed"
  | "suspicious-size"
  | "tessellated-source";

export type AnalysisWarning = { code: AnalysisWarningCode; severity: "info" | "warning"; message: string };

export type CadAnalysis = {
  /** Wersja algorytmu analizy (zmiana wyników = nowa wersja). */
  analysisVersion: string;
  method: "stl-mesh" | "occt-tessellation";
  engine: { name: string; version: string } | null;
  analyzedAt: string;
  units: { source: "file" | "user"; unit: LengthUnit; confirmed: boolean };
  boundingBoxMm: Measured<[number, number, number]>;
  volumeMm3: Measured<number>;
  surfaceAreaMm2: Measured<number>;
  /** Liczba rozłącznych brył (spójnych powłok siatki). */
  solidCount: Measured<number>;
  /** Liczba obiektów zapisanych w pliku CAD (części złożenia) — tylko STEP. */
  fileObjectCount: Measured<number>;
  brepFaceCount: Measured<number>;
  closedGeometry: Measured<boolean>;
  /** Rozpoznawanie otworów wymaga analizy cech B-Rep — obecny silnik jej nie udostępnia. */
  holes: Measured<{ count: number }>;
  triangleCount: number;
  warnings: AnalysisWarning[];
};

export type ProjectRecord = {
  projectId: string;
  schemaVersion: 1;
  file: {
    name: string;
    sizeBytes: number;
    format: ModelFormat;
    encoding: string;
    sha256: string | null;
  };
  order: Omit<ConfigurationSnapshot, "model">;
  analysis: CadAnalysis;
  verification: { status: VerificationStatus; note: string };
};
