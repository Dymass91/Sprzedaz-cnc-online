/// <reference lib="webworker" />
import { analyzeMesh } from "@/features/geometry/analyzeMesh";
import type { StepObject, StepWorkerMessage, StepWorkerRequest } from "./protocol";

/**
 * Worker CAD: odczyt STEP silnikiem Open CASCADE (WebAssembly, occt-import-js),
 * triangulacja B-Rep i analiza siatki. Plik nie opuszcza przeglądarki.
 */

type OcctMesh = {
  name?: string;
  attributes: { position: { array: ArrayLike<number> } };
  index: { array: ArrayLike<number> };
  brep_faces?: unknown[];
};
type OcctResult = { success: boolean; meshes: OcctMesh[] };
type OcctModule = { ReadStepFile: (content: Uint8Array, params: Record<string, string | number> | null) => OcctResult };
type OcctFactory = (overrides: { locateFile: (path: string) => string }) => Promise<OcctModule>;

const scope = self as unknown as DedicatedWorkerGlobalScope;
let engine: Promise<OcctModule> | null = null;

/**
 * Ładuje bibliotekę z /public/vendor (plik statyczny, ten sam origin).
 * Skrypt UMD jest wykonywany przez `new Function`, bo worker modułowy nie obsługuje importScripts.
 */
function loadEngine(basePath: string): Promise<OcctModule> {
  engine ??= (async () => {
    const response = await fetch(`${basePath}/occt-import-js.js`);
    if (!response.ok) throw new Error("engine-unavailable");
    const factory = new Function(`${await response.text()}\nreturn occtimportjs;`)() as OcctFactory;
    return factory({ locateFile: (path) => `${basePath}/${path}` });
  })();
  engine.catch(() => {
    engine = null;
  });
  return engine;
}

function post(message: StepWorkerMessage, transfer: Transferable[] = []) {
  scope.postMessage(message, transfer);
}

scope.onmessage = async (event: MessageEvent<StepWorkerRequest>) => {
  const { id, buffer, enginePath, params, maxTriangles } = event.data;
  const fail = (message: string, retryable = false) => post({ id, type: "result", ok: false, message, retryable });

  let occt: OcctModule;
  try {
    post({ id, type: "progress", stage: "engine" });
    occt = await loadEngine(enginePath);
  } catch {
    fail("Nie udało się załadować silnika CAD. Sprawdź połączenie z internetem.", true);
    return;
  }

  post({ id, type: "progress", stage: "reading" });
  const started = performance.now();
  let result: OcctResult;
  try {
    result = occt.ReadStepFile(new Uint8Array(buffer), params);
  } catch {
    // Błąd wewnątrz WASM (np. brak pamięci) — stan silnika może być niespójny, ładujemy go od nowa.
    engine = null;
    fail("Silnik CAD przerwał odczyt pliku (plik uszkodzony lub zbyt złożony dla przeglądarki).", true);
    return;
  }
  const engineMs = Math.round(performance.now() - started);

  if (!result.success) {
    fail("Silnik CAD nie odczytał pliku. Plik STEP jest uszkodzony lub zawiera nieobsługiwane dane.");
    return;
  }
  if (result.meshes.length === 0) {
    fail("Plik STEP nie zawiera geometrii bryłowej ani powierzchniowej (np. tylko krzywe lub rysunek 2D).");
    return;
  }

  let triangleCount = 0;
  for (const mesh of result.meshes) triangleCount += mesh.index.array.length / 3;
  if (triangleCount === 0) {
    fail("Triangulacja modelu nie dała żadnych ścian — model nie zawiera powierzchni.");
    return;
  }
  if (triangleCount > maxTriangles) {
    fail(`Model po triangulacji ma ${triangleCount.toLocaleString("pl-PL")} trójkątów — to więcej niż obsługiwany limit.`);
    return;
  }

  post({ id, type: "progress", stage: "analyzing" });
  // Siatka bez indeksów (9 liczb na trójkąt) — ten sam format co STL, wspólny viewer i analiza.
  const positions = new Float32Array(triangleCount * 9);
  const objects: StepObject[] = [];
  let o = 0;
  for (const mesh of result.meshes) {
    const p = mesh.attributes.position.array;
    const idx = mesh.index.array;
    for (let i = 0; i < idx.length; i++) {
      const v = idx[i] * 3;
      positions[o++] = p[v];
      positions[o++] = p[v + 1];
      positions[o++] = p[v + 2];
    }
    objects.push({ name: mesh.name ?? "", triangleCount: idx.length / 3, faceCount: mesh.brep_faces?.length ?? 0 });
  }

  const analysis = analyzeMesh(positions);
  post({ id, type: "result", ok: true, positions, analysis, objects, engineMs }, [positions.buffer]);
};
