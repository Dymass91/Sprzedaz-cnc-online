import type { ModelFormat } from "@/features/cad-files/config";
import { unitToMm, type LengthUnit } from "@/features/geometry/units";
import type { MeshTopology } from "@/features/geometry/types";
import type { ConfiguratorState } from "./ConfiguratorContext";
import {
  finishOptions,
  getFinishAvailability,
  getMaterialOption,
  getToleranceAvailability,
  leadTimeOptions,
  parseQuantity,
  toleranceOptions,
  type FinishId,
  type LeadTimeId,
  type MaterialOptionId,
  type ToleranceId,
} from "./options";

/**
 * Serializowalna „migawka” konfiguracji — jedno źródło danych dla
 * podsumowania, formularza zapytania i przyszłego silnika wycen.
 * Nie zawiera geometrii ani obiektów Three.js.
 */
export type ConfigurationSnapshot = {
  model: {
    fileName: string;
    fileSize: number;
    format: ModelFormat;
    triangleCount: number;
    unit: LengthUnit;
    unitConfirmed: boolean;
    /** Wymiary gabarytowe w mm (X, Y, Z). */
    sizeMm: [number, number, number];
    /** Objętość w mm³ — tylko gdy wiarygodna. */
    volumeMm3: number | null;
    surfaceAreaMm2: number;
    topology: MeshTopology;
  } | null;
  material: { id: MaterialOptionId; label: string; requiresConsultation: boolean };
  quantity: number | null;
  tolerance: { id: ToleranceId; label: string; requiresConsultation: boolean };
  finish: { id: FinishId; label: string; requiresConsultation: boolean };
  leadTime: { id: LeadTimeId; label: string };
};

export function buildConfigurationSnapshot(state: ConfiguratorState): ConfigurationSnapshot {
  const slot = state.model;
  let model: ConfigurationSnapshot["model"] = null;
  if (slot.status === "ready") {
    const { analysis } = slot.model;
    const f = slot.model.unitsFromFile ? 1 : unitToMm(state.unit);
    model = {
      fileName: slot.model.fileName,
      fileSize: slot.model.fileSize,
      format: slot.model.format,
      triangleCount: analysis.triangleCount,
      unit: state.unit,
      unitConfirmed: state.unitConfirmed,
      sizeMm: [analysis.size[0] * f, analysis.size[1] * f, analysis.size[2] * f],
      volumeMm3: analysis.volume.status === "reliable" ? analysis.volume.value * f ** 3 : null,
      surfaceAreaMm2: analysis.surfaceArea * f ** 2,
      topology: analysis.topology,
    };
  }
  const material = getMaterialOption(state.material);
  const quantity = parseQuantity(state.quantityInput);
  return {
    model,
    material: { id: material.id, label: material.label, requiresConsultation: material.requiresConsultation },
    quantity: quantity.ok ? quantity.value : null,
    tolerance: {
      id: state.tolerance,
      label: toleranceOptions.find((t) => t.id === state.tolerance)?.label ?? "",
      requiresConsultation: getToleranceAvailability(state.material, state.tolerance).status !== "available",
    },
    finish: {
      id: state.finish,
      label: finishOptions.find((o) => o.id === state.finish)?.label ?? "",
      requiresConsultation: getFinishAvailability(state.material, state.finish).status !== "available",
    },
    leadTime: { id: state.leadTime, label: leadTimeOptions.find((l) => l.id === state.leadTime)?.label ?? "" },
  };
}

/** Co jeszcze blokuje przejście do zapytania. */
export function getInquiryBlockers(snapshot: ConfigurationSnapshot): string[] {
  const blockers: string[] = [];
  if (!snapshot.model) blockers.push("Wgraj plik STEP lub STL z modelem części.");
  else if (!snapshot.model.unitConfirmed) blockers.push("Potwierdź jednostki modelu (STL nie zapisuje jednostek).");
  if (snapshot.quantity === null) blockers.push("Podaj poprawną liczbę sztuk.");
  return blockers;
}
