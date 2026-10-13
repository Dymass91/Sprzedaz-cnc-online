import { ANALYSIS_VERSION } from "@/features/cad-files/config";
import type { LoadedModel } from "@/features/cad-files/loadModelFile";
import type { ConfigurationSnapshot } from "@/features/configurator/snapshot";
import { pluralPl, unitHint, unitToMm, type LengthUnit } from "@/features/geometry/units";
import type { AnalysisWarning, CadAnalysis, Measured, ProjectRecord } from "./types";

const unavailable = <T>(reason: string): Measured<T> => ({ value: null, provenance: "unavailable", reason });
const automatic = <T>(value: T, note?: string): Measured<T> => ({ value, provenance: "automatic", note });

const HOLES_REASON =
  "Rozpoznawanie otworów wymaga analizy typów powierzchni B-Rep (walce, gwinty, pogłębienia). Obecny silnik w przeglądarce udostępnia tylko triangulację — otwory oceni technolog.";

export function analysisWarnings(model: LoadedModel, unit: LengthUnit, unitConfirmed: boolean): AnalysisWarning[] {
  const { topology, size, shellCount } = model.analysis;
  const warnings: AnalysisWarning[] = [];
  if (topology.boundaryEdges > 0) {
    warnings.push({ code: "open-mesh", severity: "warning", message: "Geometria nie jest zamknięta — objętość nie może zostać obliczona." });
  }
  if (topology.nonManifoldEdges > 0) {
    warnings.push({ code: "non-manifold", severity: "warning", message: "Model zawiera krawędzie wspólne dla więcej niż dwóch ścian (geometria niemanifoldowa)." });
  }
  if (topology.inconsistentEdges > 0) {
    warnings.push({ code: "inconsistent-normals", severity: "warning", message: "Część ścian ma odwróconą orientację." });
  }
  if (topology.degenerateTriangles > 0) {
    warnings.push({ code: "degenerate-triangles", severity: "info", message: `Pominięto zdegenerowane trójkąty (${topology.degenerateTriangles.toLocaleString("pl-PL")}).` });
  }
  const objects = model.cad?.objects.length ?? 0;
  if (shellCount > 1 || objects > 1) {
    const solids = `${shellCount} ${pluralPl(shellCount, "rozłączną bryłę", "rozłączne bryły", "rozłącznych brył")}`;
    warnings.push({
      code: "multiple-solids",
      severity: "info",
      message:
        objects > 1
          ? `Plik zawiera ${objects} ${pluralPl(objects, "obiekt", "obiekty", "obiektów")} (np. części złożenia), które tworzą ${solids}. Potwierdź, czy zamawiasz jedną część, czy cały zestaw.`
          : `Model składa się z ${solids}. Potwierdź, czy to jedna część, czy kilka osobnych elementów.`,
    });
  }
  if (!model.unitsFromFile && !unitConfirmed) {
    warnings.push({ code: "units-unconfirmed", severity: "warning", message: "Jednostki modelu STL nie zostały potwierdzone." });
  }
  const hint = unitHint(Math.max(...size), unit);
  if (hint) warnings.push({ code: "suspicious-size", severity: "warning", message: hint });
  if (model.format === "stl") {
    warnings.push({
      code: "tessellated-source",
      severity: "info",
      message: "STL to siatka trójkątów — łuki i otwory są przybliżone. Do produkcji zalecamy plik STEP.",
    });
  }
  return warnings;
}

export function buildCadAnalysis(model: LoadedModel, unit: LengthUnit, unitConfirmed: boolean): CadAnalysis {
  const f = model.unitsFromFile ? 1 : unitToMm(unit);
  const { analysis } = model;
  const approxNote = model.format === "step" ? "Z triangulacji B-Rep (ugięcie 0,1% przekątnej)." : "Z siatki STL.";
  return {
    analysisVersion: ANALYSIS_VERSION,
    method: model.format === "step" ? "occt-tessellation" : "stl-mesh",
    engine: model.cad ? { name: model.cad.engine, version: model.cad.engineVersion } : null,
    analyzedAt: model.analyzedAt,
    units: model.unitsFromFile ? { source: "file", unit: "mm", confirmed: true } : { source: "user", unit, confirmed: unitConfirmed },
    boundingBoxMm: automatic([analysis.size[0] * f, analysis.size[1] * f, analysis.size[2] * f]),
    volumeMm3:
      analysis.volume.status === "reliable" ? automatic(analysis.volume.value * f ** 3, approxNote) : unavailable(analysis.volume.reason),
    surfaceAreaMm2: automatic(analysis.surfaceArea * f ** 2, approxNote),
    solidCount: automatic(analysis.shellCount, "Rozłączne powłoki geometrii — stykające się części liczą się jako jedna bryła."),
    fileObjectCount: model.cad ? automatic(model.cad.objects.length) : unavailable("Format STL nie przechowuje struktury obiektów."),
    brepFaceCount: model.cad ? automatic(model.cad.brepFaceCount) : unavailable("Format STL nie zawiera geometrii B-Rep."),
    closedGeometry: automatic(analysis.topology.closed),
    holes: unavailable(HOLES_REASON),
    triangleCount: analysis.triangleCount,
    warnings: analysisWarnings(model, unit, unitConfirmed),
  };
}

export function buildProjectRecord(
  model: LoadedModel,
  unit: LengthUnit,
  unitConfirmed: boolean,
  snapshot: ConfigurationSnapshot,
): ProjectRecord {
  const { model: _omit, ...order } = snapshot;
  void _omit;
  return {
    projectId: model.projectId,
    schemaVersion: 1,
    file: { name: model.fileName, sizeBytes: model.fileSize, format: model.format, encoding: model.encoding, sha256: model.sha256 },
    order,
    analysis: buildCadAnalysis(model, unit, unitConfirmed),
    verification: { status: "unverified", note: "Dane z automatycznej analizy — wymagają weryfikacji technologa przed wyceną." },
  };
}
