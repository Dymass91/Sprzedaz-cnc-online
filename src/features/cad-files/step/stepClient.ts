import { CAD_ENGINE, MAX_MODEL_TRIANGLES, STEP_ANALYSIS_TIMEOUT_MS, STEP_TESSELLATION } from "../config";
import type { StepStage, StepWorkerMessage } from "./protocol";

/**
 * Klient workera CAD. Worker (z załadowanym silnikiem OCCT) jest utrzymywany
 * między plikami — kompilacja WASM odbywa się raz na sesję. Anulowanie lub
 * przekroczenie czasu kończy worker, co natychmiast zwalnia jego pamięć.
 */

let worker: Worker | null = null;
let requestId = 0;

function getWorker(): Worker {
  worker ??= new Worker(new URL("./step.worker.ts", import.meta.url), { type: "module" });
  return worker;
}

function killWorker() {
  worker?.terminate();
  worker = null;
}

export class StepTimeoutError extends Error {}

export type StepSuccess = Extract<StepWorkerMessage, { type: "result"; ok: true }>;

export function analyzeStepInWorker(
  buffer: ArrayBuffer,
  options: { signal?: AbortSignal; onStage?: (stage: StepStage) => void },
): Promise<StepSuccess | { ok: false; message: string; retryable: boolean }> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const id = ++requestId;
    let settled = false;

    const finish = () => {
      settled = true;
      clearTimeout(timer);
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
      options.signal?.removeEventListener("abort", onAbort);
    };
    const onMessage = (event: MessageEvent<StepWorkerMessage>) => {
      const msg = event.data;
      if (msg.id !== id) return;
      if (msg.type === "progress") {
        options.onStage?.(msg.stage);
        return;
      }
      finish();
      resolve(msg);
    };
    const onError = (event: ErrorEvent) => {
      event.preventDefault();
      finish();
      killWorker();
      resolve({ ok: false, message: "Analiza CAD zakończyła się błędem przeglądarki (np. brak pamięci).", retryable: true });
    };
    const onAbort = () => {
      if (settled) return;
      finish();
      killWorker();
      reject(new DOMException("Przerwano", "AbortError"));
    };
    const timer = setTimeout(() => {
      if (settled) return;
      finish();
      killWorker();
      reject(new StepTimeoutError());
    }, STEP_ANALYSIS_TIMEOUT_MS);

    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    options.signal?.addEventListener("abort", onAbort, { once: true });
    w.postMessage(
      { id, buffer, enginePath: CAD_ENGINE.basePath, params: { ...STEP_TESSELLATION }, maxTriangles: MAX_MODEL_TRIANGLES },
      [buffer],
    );
  });
}
