import type { MeshAnalysis } from "@/features/geometry/types";

/** Komunikaty między wątkiem głównym a workerem CAD (STEP → OCCT → siatka + analiza). */

export type StepStage = "engine" | "reading" | "analyzing";

export type StepWorkerRequest = {
  id: number;
  buffer: ArrayBuffer;
  enginePath: string;
  params: Record<string, string | number>;
  maxTriangles: number;
};

/** Obiekt (część/bryła) zapisany w pliku STEP. */
export type StepObject = {
  name: string;
  triangleCount: number;
  /** Liczba ścian B-Rep z modelu źródłowego. */
  faceCount: number;
};

export type StepWorkerMessage =
  | { id: number; type: "progress"; stage: StepStage }
  | {
      id: number;
      type: "result";
      ok: true;
      positions: Float32Array;
      analysis: MeshAnalysis;
      objects: StepObject[];
      engineMs: number;
    }
  | { id: number; type: "result"; ok: false; message: string; retryable: boolean };
