"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { loadModelFile, ModelLoadError, type LoadedModel } from "@/features/cad-files/loadModelFile";
import type { LengthUnit } from "@/features/geometry/units";
import type { MaterialId as MaterialCategory } from "@/features/materials/data";
import {
  defaultMaterialForCategory,
  getFinishAvailability,
  type FinishId,
  type LeadTimeId,
  type MaterialOptionId,
  type ToleranceId,
} from "./options";

export type ModelSlot =
  | { status: "empty" }
  | { status: "loading"; fileName: string; fileSize: number }
  | { status: "ready"; model: LoadedModel }
  | { status: "error"; fileName: string | null; message: string };

export type ConfiguratorState = {
  model: ModelSlot;
  unit: LengthUnit;
  /** Użytkownik potwierdził jednostki modelu (STL ich nie zapisuje). */
  unitConfirmed: boolean;
  material: MaterialOptionId;
  /** Surowa wartość pola — walidacja w `parseQuantity`. */
  quantityInput: string;
  tolerance: ToleranceId;
  finish: FinishId;
  leadTime: LeadTimeId;
  /** Krok formularza zapytania jest otwarty. */
  inquiryOpen: boolean;
};

type Action =
  | { type: "model-loading"; fileName: string; fileSize: number }
  | { type: "model-ready"; model: LoadedModel }
  | { type: "model-error"; fileName: string | null; message: string }
  | { type: "model-remove" }
  | { type: "set-unit"; unit: LengthUnit }
  | { type: "confirm-unit"; confirmed: boolean }
  | { type: "set-material"; material: MaterialOptionId }
  | { type: "set-quantity"; value: string }
  | { type: "set-tolerance"; tolerance: ToleranceId }
  | { type: "set-finish"; finish: FinishId }
  | { type: "set-lead-time"; leadTime: LeadTimeId }
  | { type: "set-inquiry-open"; open: boolean };

const initialState: ConfiguratorState = {
  model: { status: "empty" },
  unit: "mm",
  unitConfirmed: false,
  material: "al-6061",
  quantityInput: "1",
  tolerance: "standard",
  finish: "none",
  leadTime: "standard",
  inquiryOpen: false,
};

function reducer(state: ConfiguratorState, action: Action): ConfiguratorState {
  switch (action.type) {
    case "model-loading":
      return { ...state, model: { status: "loading", fileName: action.fileName, fileSize: action.fileSize } };
    case "model-ready":
      // Nowy model = jednostki trzeba potwierdzić od nowa.
      return { ...state, model: { status: "ready", model: action.model }, unitConfirmed: false };
    case "model-error":
      return { ...state, model: { status: "error", fileName: action.fileName, message: action.message } };
    case "model-remove":
      return { ...state, model: { status: "empty" }, unitConfirmed: false, inquiryOpen: false };
    case "set-unit":
      return { ...state, unit: action.unit, unitConfirmed: false };
    case "confirm-unit":
      return { ...state, unitConfirmed: action.confirmed };
    case "set-material": {
      // Wykończenie niedostępne dla nowego materiału wraca do „bez obróbki”.
      const finish = getFinishAvailability(action.material, state.finish).status === "unavailable" ? "none" : state.finish;
      return { ...state, material: action.material, finish };
    }
    case "set-quantity":
      return { ...state, quantityInput: action.value };
    case "set-tolerance":
      return { ...state, tolerance: action.tolerance };
    case "set-finish":
      return { ...state, finish: action.finish };
    case "set-lead-time":
      return { ...state, leadTime: action.leadTime };
    case "set-inquiry-open":
      return { ...state, inquiryOpen: action.open };
  }
}

type ConfiguratorContextValue = {
  state: ConfiguratorState;
  loadFile: (file: File) => void;
  removeModel: () => void;
  setUnit: (unit: LengthUnit) => void;
  confirmUnit: (confirmed: boolean) => void;
  setMaterial: (material: MaterialOptionId) => void;
  /** Wybór z kart materiałów na stronie głównej. */
  selectMaterialCategory: (category: MaterialCategory) => void;
  setQuantityInput: (value: string) => void;
  setTolerance: (tolerance: ToleranceId) => void;
  setFinish: (finish: FinishId) => void;
  setLeadTime: (leadTime: LeadTimeId) => void;
  setInquiryOpen: (open: boolean) => void;
};

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const loadController = useRef<AbortController | null>(null);

  useEffect(() => () => loadController.current?.abort(), []);

  const loadFile = useCallback((file: File) => {
    // Nowy plik przerywa analizę poprzedniego.
    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;
    dispatch({ type: "model-loading", fileName: file.name, fileSize: file.size });
    loadModelFile(file, controller.signal)
      .then((model) => {
        if (!controller.signal.aborted) dispatch({ type: "model-ready", model });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof ModelLoadError ? error.message : "Nie udało się wczytać modelu.";
        dispatch({ type: "model-error", fileName: file.name, message });
      });
  }, []);

  const removeModel = useCallback(() => {
    loadController.current?.abort();
    dispatch({ type: "model-remove" });
  }, []);

  const value = useMemo<ConfiguratorContextValue>(
    () => ({
      state,
      loadFile,
      removeModel,
      setUnit: (unit) => dispatch({ type: "set-unit", unit }),
      confirmUnit: (confirmed) => dispatch({ type: "confirm-unit", confirmed }),
      setMaterial: (material) => dispatch({ type: "set-material", material }),
      selectMaterialCategory: (category) => dispatch({ type: "set-material", material: defaultMaterialForCategory(category) }),
      setQuantityInput: (value) => dispatch({ type: "set-quantity", value }),
      setTolerance: (tolerance) => dispatch({ type: "set-tolerance", tolerance }),
      setFinish: (finish) => dispatch({ type: "set-finish", finish }),
      setLeadTime: (leadTime) => dispatch({ type: "set-lead-time", leadTime }),
      setInquiryOpen: (open) => dispatch({ type: "set-inquiry-open", open }),
    }),
    [state, loadFile, removeModel],
  );

  return <ConfiguratorContext.Provider value={value}>{children}</ConfiguratorContext.Provider>;
}

export function useConfigurator(): ConfiguratorContextValue {
  const ctx = useContext(ConfiguratorContext);
  if (!ctx) throw new Error("useConfigurator musi być użyty wewnątrz <ConfiguratorProvider>.");
  return ctx;
}
