import type { MeshAnalysis } from "@/features/geometry/types";
import type { StlFormat } from "./stl/parseStl";
import type { StlWorkerResponse } from "./stl/protocol";
import { validateModelFile } from "./validation";

/** Model wczytany z pliku klienta — wynik parsowania i analizy geometrii. */
export type LoadedModel = {
  fileName: string;
  fileSize: number;
  format: StlFormat;
  solidName: string | null;
  /** 9 liczb na trójkąt, w jednostkach pliku. */
  positions: Float32Array;
  analysis: MeshAnalysis;
};

export class ModelLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelLoadError";
  }
}

let requestId = 0;

function runInWorker(buffer: ArrayBuffer, signal?: AbortSignal): Promise<StlWorkerResponse> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./stl/stl.worker.ts", import.meta.url), { type: "module" });
    } catch (error) {
      reject(error);
      return;
    }
    const id = ++requestId;
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

async function runOnMainThread(buffer: ArrayBuffer): Promise<StlWorkerResponse> {
  const { processStl } = await import("./stl/process");
  return processStl(++requestId, buffer);
}

/**
 * Waliduje, odczytuje i analizuje plik modelu. Analiza działa w Web Workerze;
 * jeśli worker jest niedostępny, wykonuje się w wątku głównym.
 */
export async function loadModelFile(file: File, signal?: AbortSignal): Promise<LoadedModel> {
  const check = validateModelFile(file);
  if (!check.ok) throw new ModelLoadError(check.reason);

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new ModelLoadError("Nie udało się odczytać pliku z dysku.");
  }
  if (signal?.aborted) throw new DOMException("Przerwano", "AbortError");

  let result: StlWorkerResponse;
  try {
    // Kopia na wypadek awarii workera — oryginał jest przekazywany (transfer) i staje się pusty.
    const fallback = typeof Worker === "undefined" ? buffer : buffer.slice(0);
    result =
      typeof Worker === "undefined"
        ? await runOnMainThread(fallback)
        : await runInWorker(buffer, signal).catch((error) => {
            if (error instanceof DOMException && error.name === "AbortError") throw error;
            return runOnMainThread(fallback);
          });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ModelLoadError("Nie udało się przeanalizować pliku.");
  }

  if (!result.ok) throw new ModelLoadError(result.message);
  return {
    fileName: file.name,
    fileSize: file.size,
    format: result.format,
    solidName: result.solidName,
    positions: result.positions,
    analysis: result.analysis,
  };
}
