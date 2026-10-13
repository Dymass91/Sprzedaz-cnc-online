/** Wyniki analizy siatki trójkątów — w jednostkach pliku (przeliczenie na mm: `units.ts`). */

export type Vec3Tuple = [number, number, number];

export type MeshTopology = {
  /** Siatka zamknięta i spójnie zorientowana: każda krawędź należy do dokładnie 2 trójkątów. */
  closed: boolean;
  /** Krawędzie należące do 1 trójkąta — dziury w powierzchni. */
  boundaryEdges: number;
  /** Krawędzie należące do 3+ trójkątów. */
  nonManifoldEdges: number;
  /** Krawędzie, przy których sąsiednie trójkąty mają niezgodną orientację. */
  inconsistentEdges: number;
  /** Trójkąty o zerowym polu (zdegenerowane). */
  degenerateTriangles: number;
};

export type VolumeResult =
  | { status: "reliable"; value: number; normalsInverted: boolean }
  | { status: "unreliable"; reason: string };

export type MeshAnalysis = {
  triangleCount: number;
  vertexCount: number;
  min: Vec3Tuple;
  max: Vec3Tuple;
  /** Wymiary bounding box (X, Y, Z). */
  size: Vec3Tuple;
  surfaceArea: number;
  topology: MeshTopology;
  volume: VolumeResult;
};
