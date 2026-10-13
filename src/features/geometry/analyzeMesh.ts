import type { MeshAnalysis, MeshTopology, Vec3Tuple, VolumeResult } from "./types";

/**
 * Analiza siatki trójkątów z pliku STL (płaska tablica, 9 liczb na trójkąt).
 *
 * - Bounding box i pole powierzchni — zawsze.
 * - Objętość — tylko gdy siatka jest zamknięta, rozmaitościowa i spójnie
 *   zorientowana (twierdzenie o dywergencji daje wtedy wiarygodny wynik).
 *
 * Wierzchołki są „zgrzewane” z tolerancją zależną od wielkości modelu,
 * bo STL zapisuje każdy trójkąt osobno, bez wspólnych wierzchołków.
 */
export function analyzeMesh(positions: Float32Array): MeshAnalysis {
  const triangleCount = positions.length / 9;
  const min: Vec3Tuple = [Infinity, Infinity, Infinity];
  const max: Vec3Tuple = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = positions[i + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  }
  const size: Vec3Tuple = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const diagonal = Math.hypot(size[0], size[1], size[2]);
  const center: Vec3Tuple = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];

  // Zgrzewanie wierzchołków
  const tolerance = Math.max(diagonal * 1e-6, 1e-9);
  const vertexIds = new Map<string, number>();
  const indices = new Uint32Array(triangleCount * 3);
  for (let v = 0; v < triangleCount * 3; v++) {
    const o = v * 3;
    const key = `${Math.round(positions[o] / tolerance)},${Math.round(positions[o + 1] / tolerance)},${Math.round(positions[o + 2] / tolerance)}`;
    let id = vertexIds.get(key);
    if (id === undefined) {
      id = vertexIds.size;
      vertexIds.set(key, id);
    }
    indices[v] = id;
  }
  const vertexCount = vertexIds.size;
  vertexIds.clear();

  // Spójne powłoki: union-find na zgrzanych wierzchołkach
  const parent = new Uint32Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) parent[i] = i;
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  const usedVertex = new Uint8Array(vertexCount);

  // Krawędzie: liczba wystąpień i suma orientacji (+1 / −1)
  const edgeCount = new Map<number, number>();
  const edgeOrientation = new Map<number, number>();
  let degenerateTriangles = 0;
  let surfaceArea = 0;
  let signedVolume6 = 0;

  for (let t = 0; t < triangleCount; t++) {
    const a = indices[t * 3];
    const b = indices[t * 3 + 1];
    const c = indices[t * 3 + 2];
    const o = t * 9;
    // Współrzędne względem środka — stabilniejsze numerycznie
    const ax = positions[o] - center[0], ay = positions[o + 1] - center[1], az = positions[o + 2] - center[2];
    const bx = positions[o + 3] - center[0], by = positions[o + 4] - center[1], bz = positions[o + 5] - center[2];
    const cx = positions[o + 6] - center[0], cy = positions[o + 7] - center[1], cz = positions[o + 8] - center[2];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const doubleArea = Math.hypot(nx, ny, nz);

    if (a === b || b === c || a === c || doubleArea <= tolerance * tolerance) {
      degenerateTriangles++;
      continue;
    }
    surfaceArea += doubleArea / 2;
    union(a, b);
    union(b, c);
    usedVertex[a] = usedVertex[b] = usedVertex[c] = 1;
    signedVolume6 += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);

    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const lo = p < q ? p : q;
      const hi = p < q ? q : p;
      const key = lo * vertexCount + hi;
      edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
      edgeOrientation.set(key, (edgeOrientation.get(key) ?? 0) + (p < q ? 1 : -1));
    }
  }

  let shellCount = 0;
  for (let i = 0; i < vertexCount; i++) if (usedVertex[i] && find(i) === i) shellCount++;

  let boundaryEdges = 0;
  let nonManifoldEdges = 0;
  let inconsistentEdges = 0;
  for (const [key, count] of edgeCount) {
    if (count === 1) boundaryEdges++;
    else if (count > 2) nonManifoldEdges++;
    else if (edgeOrientation.get(key) !== 0) inconsistentEdges++;
  }

  const topology: MeshTopology = {
    closed: boundaryEdges === 0 && nonManifoldEdges === 0 && inconsistentEdges === 0 && triangleCount - degenerateTriangles >= 4,
    boundaryEdges,
    nonManifoldEdges,
    inconsistentEdges,
    degenerateTriangles,
  };

  return {
    triangleCount,
    vertexCount,
    min,
    max,
    size,
    surfaceArea,
    shellCount,
    topology,
    volume: computeVolume(signedVolume6 / 6, topology, size),
  };
}

function computeVolume(signed: number, topology: MeshTopology, size: Vec3Tuple): VolumeResult {
  if (topology.boundaryEdges > 0) {
    return { status: "unreliable", reason: `Siatka jest otwarta (liczba krawędzi brzegowych: ${topology.boundaryEdges.toLocaleString("pl-PL")}).` };
  }
  if (topology.nonManifoldEdges > 0) {
    return { status: "unreliable", reason: "Siatka ma krawędzie wspólne dla więcej niż dwóch ścian (geometria niemanifoldowa)." };
  }
  if (topology.inconsistentEdges > 0) {
    return { status: "unreliable", reason: "Ściany modelu mają niespójną orientację (częściowo odwrócone normalne)." };
  }
  if (!topology.closed) return { status: "unreliable", reason: "Model ma zbyt mało poprawnych ścian." };
  const value = Math.abs(signed);
  const boxVolume = size[0] * size[1] * size[2];
  // Objętość większa od prostopadłościanu otaczającego lub praktycznie zerowa = coś jest nie tak.
  if (value <= boxVolume * 1e-9 || value > boxVolume * 1.0001) {
    return { status: "unreliable", reason: "Obliczona objętość jest niespójna z wymiarami modelu." };
  }
  return { status: "reliable", value, normalsInverted: signed < 0 };
}
