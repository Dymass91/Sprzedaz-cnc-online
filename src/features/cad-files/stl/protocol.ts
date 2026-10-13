import type { MeshAnalysis } from "@/features/geometry/types";
import type { StlFormat } from "./parseStl";

/** Komunikaty między wątkiem głównym a workerem analizy STL. */

export type StlWorkerRequest = { id: number; buffer: ArrayBuffer };

export type StlWorkerResponse =
  | {
      id: number;
      ok: true;
      format: StlFormat;
      solidName: string | null;
      positions: Float32Array;
      analysis: MeshAnalysis;
    }
  | { id: number; ok: false; message: string };
