import { analyzeMesh } from "@/features/geometry/analyzeMesh";
import { parseStl, StlParseError } from "./parseStl";
import type { StlWorkerResponse } from "./protocol";

/** Parsowanie + analiza. Wspólne dla workera i ścieżki awaryjnej w wątku głównym. */
export function processStl(id: number, buffer: ArrayBuffer): StlWorkerResponse {
  try {
    const parsed = parseStl(buffer);
    const analysis = analyzeMesh(parsed.positions);
    if (analysis.topology.degenerateTriangles === analysis.triangleCount) {
      return { id, ok: false, message: "Wszystkie trójkąty w pliku są zdegenerowane — model nie zawiera geometrii." };
    }
    return { id, ok: true, format: parsed.format, solidName: parsed.solidName, positions: parsed.positions, analysis };
  } catch (error) {
    const message =
      error instanceof StlParseError ? error.message : "Nie udało się odczytać pliku STL. Plik może być uszkodzony.";
    return { id, ok: false, message };
  }
}
