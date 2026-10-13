import type { MeshAnalysis } from "@/features/geometry/types";
import { CAD_ENGINE, STEP_ANALYSIS_TIMEOUT_MS, type ModelFormat } from "./config";
import type { StepObject, StepStage } from "./step/protocol";
import { analyzeStepInWorker, StepTimeoutError } from "./step/stepClient";
import type { StlWorkerResponse } from "./stl/protocol";
import { sniffModelFormat, validateModelFile } from "./validation";

/** Model wczytany z pliku klienta — wynik odczytu i analizy geometrii. */
export type LoadedModel = {
  /** Identyfikator projektu nadawany przy wczytaniu (przyszły klucz zapytania/zamówienia). */
  projectId: string;
  fileName: string;
  fileSize: number;
  /** SHA-256 zawartości pliku (hex) — identyfikuje wersję projektu; null, gdy przeglądarka nie udostępnia Web Crypto. */
  sha256: string | null;
  format: ModelFormat;
  encoding: "binary" | "ascii" | "iso-10303-21";
  /** STEP zapisuje jednostki — geometria jest już w mm. STL wymaga wskazania jednostek. */
  unitsFromFile: boolean;
  /** 9 liczb na trójkąt (STL: jednostki pliku, STEP: mm). */
  positions: Float32Array;
  analysis: MeshAnalysis;
  /** Dane z silnika CAD — tylko dla STEP. */
  cad: { engine: string; engineVersion: string; objects: StepObject[]; brepFaceCount: number; engineMs: number } | null;
  analyzedAt: string;
};

export type LoadStage = "reading-file" | StepStage;

export class ModelLoadError extends Error {
  /** Czy ponowienie ma sens (błąd środowiska), czy problem leży w samym pliku. */
  readonly retryable: boolean;
  constructor(message: string, retryable = false) {
    super(message);
    this.name = "ModelLoadError";
    this.retryable = retryable;
  }
}

const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

function newProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------------------------------- STL ---------------------------------- */

let stlRequestId = 0;

function runStlWorker(buffer: ArrayBuffer, signal?: AbortSignal): Promise<StlWorkerResponse> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./stl/stl.worker.ts", import.meta.url), { type: "module" });
    } catch (error) {
      reject(error);
      return;
    }
    const id = ++stlRequestId;
    const cleanup = () => {
      worker.terminate();
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException("Przerwano", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    worker.onmessage = (event: MessageEvent<StlWorkerResponse>) => {
      cleanup();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      cleanup();
      reject(new Error("worker-failed"));
    };
    worker.postMessage({ id, buffer }, [buffer]);
  });
}

async function loadStl(file: File, buffer: ArrayBuffer, signal?: AbortSignal) {
  let result: StlWorkerResponse;
  try {
    result =
      typeof Worker === "undefined"
        ? (await import("./stl/process")).processStl(0, buffer)
        : await runStlWorker(buffer, signal);
  } catch (error) {
    if (isAbort(error)) throw error;
    // Worker niedostępny — bufor został przekazany, więc czytamy plik ponownie i analizujemy w wątku głównym.
    const { processStl } = await import("./stl/process");
    result = processStl(0, await file.arrayBuffer());
  }
  if (!result.ok) throw new ModelLoadError(result.message);
  return result;
}

/* ------------------------------- Wejście --------------------------------- */

/**
 * Waliduje, odczytuje i analizuje plik modelu (STL lub STEP) w Web Workerze.
 * Format jest rozpoznawany po zawartości — samo rozszerzenie nie wystarcza.
 */
export async function loadModelFile(
  file: File,
  options: { signal?: AbortSignal; onStage?: (stage: LoadStage) => void } = {},
): Promise<LoadedModel> {
  const { signal, onStage } = options;
  const check = validateModelFile(file);
  if (!check.ok) throw new ModelLoadError(check.reason);

  onStage?.("reading-file");
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new ModelLoadError("Nie udało się odczytać pliku z dysku.", true);
  }
  if (signal?.aborted) throw new DOMException("Przerwano", "AbortError");

  const sniffed = sniffModelFormat(new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 512)));
  if (sniffed === "step-xml") throw new ModelLoadError("STEP w formacie XML (ISO 10303-28) nie jest obsługiwany. Zapisz model jako zwykły STEP (AP203/AP214/AP242).");
  if (check.format === "step" && sniffed !== "step") {
    throw new ModelLoadError("Plik ma rozszerzenie STEP, ale nie zawiera nagłówka ISO-10303-21 — to nie jest prawidłowy plik STEP.");
  }
  if (check.format === "stl" && sniffed === "step") {
    throw new ModelLoadError("Plik ma rozszerzenie .stl, ale zawiera dane STEP. Zmień rozszerzenie na .step i wczytaj go ponownie.");
  }

  const sha256 = await sha256Hex(buffer).catch(() => null);
  const base = {
    projectId: newProjectId(),
    fileName: file.name,
    fileSize: file.size,
    sha256,
    analyzedAt: new Date().toISOString(),
  };

  if (check.format === "stl") {
    const result = await loadStl(file, buffer, signal);
    return {
      ...base,
      format: "stl",
      encoding: result.format,
      unitsFromFile: false,
      positions: result.positions,
      analysis: result.analysis,
      cad: null,
    };
  }

  let step: Awaited<ReturnType<typeof analyzeStepInWorker>>;
  try {
    step = await analyzeStepInWorker(buffer, { signal, onStage });
  } catch (error) {
    if (isAbort(error)) throw error;
    if (error instanceof StepTimeoutError) {
      throw new ModelLoadError(`Analiza przekroczyła limit ${STEP_ANALYSIS_TIMEOUT_MS / 1000} s. Model jest zbyt złożony do analizy w przeglądarce.`, true);
    }
    throw new ModelLoadError("Nie udało się uruchomić analizy CAD w tej przeglądarce.", true);
  }
  if (!step.ok) throw new ModelLoadError(step.message, step.retryable);
  return {
    ...base,
    format: "step",
    encoding: "iso-10303-21",
    unitsFromFile: true,
    positions: step.positions,
    analysis: step.analysis,
    cad: {
      engine: CAD_ENGINE.name,
      engineVersion: CAD_ENGINE.version,
      objects: step.objects,
      brepFaceCount: step.objects.reduce((sum, o) => sum + o.faceCount, 0),
      engineMs: step.engineMs,
    },
  };
}
