"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";
import { MAX_CAD_FILES, validateCadFile, type CadExtension } from "@/features/cad-files/validation";
import { getMaterial, type FinishId, type MaterialId } from "@/features/materials/data";
import type { ViewerMode } from "@/features/viewer-3d/types";
import { clampQuantity, type LeadTimeId, type ToleranceId } from "./options";

export type SelectedCadFile = {
  id: string;
  file: File;
  extension: CadExtension;
};

export type RejectedCadFile = { name: string; reason: string };

export type ConfiguratorState = {
  files: SelectedCadFile[];
  rejected: RejectedCadFile[];
  materialId: MaterialId;
  grade: string;
  quantity: number;
  tolerance: ToleranceId;
  finish: FinishId;
  leadTime: LeadTimeId;
  viewMode: ViewerMode;
};

type Action =
  | { type: "add-files"; accepted: SelectedCadFile[]; rejected: RejectedCadFile[] }
  | { type: "remove-file"; id: string }
  | { type: "clear-rejected" }
  | { type: "set-material"; materialId: MaterialId; grade?: string }
  | { type: "set-quantity"; quantity: number }
  | { type: "set-tolerance"; tolerance: ToleranceId }
  | { type: "set-finish"; finish: FinishId }
  | { type: "set-lead-time"; leadTime: LeadTimeId }
  | { type: "set-view-mode"; viewMode: ViewerMode };

const defaultMaterial = getMaterial("aluminium");

const initialState: ConfiguratorState = {
  files: [],
  rejected: [],
  materialId: defaultMaterial.id,
  grade: defaultMaterial.grades[1],
  quantity: 10,
  tolerance: "standard",
  finish: "anodized",
  leadTime: "standard",
  viewMode: "shaded",
};

function reducer(state: ConfiguratorState, action: Action): ConfiguratorState {
  switch (action.type) {
    case "add-files": {
      const room = Math.max(0, MAX_CAD_FILES - state.files.length);
      const accepted = action.accepted.slice(0, room);
      const overflow = action.accepted.slice(room).map((f) => ({
        name: f.file.name,
        reason: `Możesz dodać maksymalnie ${MAX_CAD_FILES} plików w jednym zapytaniu.`,
      }));
      return { ...state, files: [...state.files, ...accepted], rejected: [...action.rejected, ...overflow] };
    }
    case "remove-file":
      return { ...state, files: state.files.filter((f) => f.id !== action.id) };
    case "clear-rejected":
      return { ...state, rejected: [] };
    case "set-material": {
      const material = getMaterial(action.materialId);
      const grade = action.grade && material.grades.includes(action.grade) ? action.grade : material.grades[0];
      // Wykończenie musi pasować do materiału — inaczej wracamy do pierwszego dostępnego.
      const finish = material.finishes.includes(state.finish) ? state.finish : material.finishes[0];
      return { ...state, materialId: material.id, grade, finish };
    }
    case "set-quantity":
      return { ...state, quantity: clampQuantity(action.quantity) };
    case "set-tolerance":
      return { ...state, tolerance: action.tolerance };
    case "set-finish":
      return { ...state, finish: action.finish };
    case "set-lead-time":
      return { ...state, leadTime: action.leadTime };
    case "set-view-mode":
      return { ...state, viewMode: action.viewMode };
  }
}

type ConfiguratorContextValue = {
  state: ConfiguratorState;
  addFiles: (files: Iterable<File>) => void;
  removeFile: (id: string) => void;
  clearRejected: () => void;
  setMaterial: (materialId: MaterialId, grade?: string) => void;
  setQuantity: (quantity: number) => void;
  setTolerance: (tolerance: ToleranceId) => void;
  setFinish: (finish: FinishId) => void;
  setLeadTime: (leadTime: LeadTimeId) => void;
  setViewMode: (mode: ViewerMode) => void;
};

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

let fileCounter = 0;

export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addFiles = useCallback((files: Iterable<File>) => {
    const accepted: SelectedCadFile[] = [];
    const rejected: RejectedCadFile[] = [];
    for (const file of files) {
      const result = validateCadFile(file);
      if (result.ok) accepted.push({ id: `cad-${++fileCounter}`, file, extension: result.extension });
      else rejected.push({ name: file.name, reason: result.reason });
    }
    dispatch({ type: "add-files", accepted, rejected });
  }, []);

  const value = useMemo<ConfiguratorContextValue>(
    () => ({
      state,
      addFiles,
      removeFile: (id) => dispatch({ type: "remove-file", id }),
      clearRejected: () => dispatch({ type: "clear-rejected" }),
      setMaterial: (materialId, grade) => dispatch({ type: "set-material", materialId, grade }),
      setQuantity: (quantity) => dispatch({ type: "set-quantity", quantity }),
      setTolerance: (tolerance) => dispatch({ type: "set-tolerance", tolerance }),
      setFinish: (finish) => dispatch({ type: "set-finish", finish }),
      setLeadTime: (leadTime) => dispatch({ type: "set-lead-time", leadTime }),
      setViewMode: (viewMode) => dispatch({ type: "set-view-mode", viewMode }),
    }),
    [state, addFiles],
  );

  return <ConfiguratorContext.Provider value={value}>{children}</ConfiguratorContext.Provider>;
}

export function useConfigurator(): ConfiguratorContextValue {
  const ctx = useContext(ConfiguratorContext);
  if (!ctx) throw new Error("useConfigurator musi być użyty wewnątrz <ConfiguratorProvider>.");
  return ctx;
}
