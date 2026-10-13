/**
 * Minimalna geometria izometryczna do ilustracji SVG.
 *
 * Układ świata: x — w prawo-w dół, y — w lewo-w dół, z — w górę.
 * Widoczne ściany brył to te o normalnych +x, +y oraz +z.
 *
 * To nie jest silnik 3D: służy do generowania ostrych, deterministycznych
 * ilustracji części. Interaktywny podgląd modeli klientów trafi do
 * `src/features/viewer-3d` (Three.js).
 */

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];
export type Plane = "xy" | "xz" | "yz";
export type Axis = "x" | "y" | "z";

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

const round = (n: number) => Math.round(n * 100) / 100;

export function iso([x, y, z]: Vec3): Vec2 {
  return [round((x - y) * COS30), round((x + y) * SIN30 - z)];
}

export function pathFrom2d(points: readonly Vec2[], closed = true): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M${first[0]} ${first[1]}${rest.map(([x, y]) => `L${x} ${y}`).join("")}${closed ? "Z" : ""}`;
}

export function polygon(points: readonly Vec3[]): string {
  return pathFrom2d(points.map(iso));
}

/** Okrąg w danej płaszczyźnie, spróbkowany jako wielokąt 3D. */
export function circle3d(center: Vec3, r: number, plane: Plane, segments = 56): Vec3[] {
  const [cx, cy, cz] = center;
  const pts: Vec3[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const u = Math.cos(a) * r;
    const v = Math.sin(a) * r;
    if (plane === "xy") pts.push([cx + u, cy + v, cz]);
    else if (plane === "xz") pts.push([cx + u, cy, cz + v]);
    else pts.push([cx, cy + u, cz + v]);
  }
  return pts;
}

export function circlePath(center: Vec3, r: number, plane: Plane, segments?: number): string {
  return polygon(circle3d(center, r, plane, segments));
}

/** Pierścień (np. czoło tulei z otworem) — do wypełnienia regułą evenodd. */
export function ringPath(center: Vec3, rOuter: number, rInner: number, plane: Plane): string {
  return `${circlePath(center, rOuter, plane)}${circlePath(center, rInner, plane)}`;
}

/** Otoczka wypukła (monotone chain) — sylwetka walca to otoczka obu den. */
export function convexHull(points: readonly Vec2[]): Vec2[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length <= 2) return pts;
  const cross = (o: Vec2, a: Vec2, b: Vec2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Vec2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Vec2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

const planeForAxis: Record<Axis, Plane> = { x: "yz", y: "xz", z: "xy" };

function offsetAlong(axis: Axis, p: Vec3, d: number): Vec3 {
  if (axis === "x") return [p[0] + d, p[1], p[2]];
  if (axis === "y") return [p[0], p[1] + d, p[2]];
  return [p[0], p[1], p[2] + d];
}

export type Cylinder = {
  /** Sylwetka pobocznicy (otoczka obu den). */
  body: string;
  /** Widoczne dno (o normalnej +osi). */
  cap: string;
  /** Niewidoczne dno — do trybu siatki. */
  backCap: string;
  capCenter: Vec3;
  /** Punkty gradientu poprzecznego do osi, w przestrzeni ekranu. */
  shadeFrom: Vec2;
  shadeTo: Vec2;
};

/** Walec o osi równoległej do osi świata, od `start` o długości `length`. */
export function cylinder(axis: Axis, start: Vec3, length: number, r: number): Cylinder {
  const plane = planeForAxis[axis];
  const end = offsetAlong(axis, start, length);
  const a = circle3d(start, r, plane).map(iso);
  const b = circle3d(end, r, plane).map(iso);
  const c0 = iso(start);
  const c1 = iso(end);
  // Kierunek osi na ekranie i wektor do niej prostopadły
  const dx = c1[0] - c0[0];
  const dy = c1[1] - c0[1];
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  // Rzut promienia na wektor prostopadły (szerokość sylwetki)
  const extent = Math.max(...[...a, ...b].map(([x, y]) => Math.abs((x - c0[0]) * nx + (y - c0[1]) * ny)));
  const mid: Vec2 = [(c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2];
  return {
    body: pathFrom2d(convexHull([...a, ...b])),
    cap: pathFrom2d(b),
    backCap: pathFrom2d(a),
    capCenter: end,
    shadeFrom: [round(mid[0] + nx * extent), round(mid[1] + ny * extent)],
    shadeTo: [round(mid[0] - nx * extent), round(mid[1] - ny * extent)],
  };
}

/** Prostopadłościan — zwraca trzy widoczne ściany. */
export function box(min: Vec3, max: Vec3) {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  return {
    top: polygon([
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ]),
    /** Ściana +y (lewa-przednia na ekranie). */
    front: polygon([
      [x0, y1, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x0, y1, z0],
    ]),
    /** Ściana +x (prawa-przednia na ekranie). */
    side: polygon([
      [x1, y0, z1],
      [x1, y1, z1],
      [x1, y1, z0],
      [x1, y0, z0],
    ]),
    /** Krawędzie niewidoczne — do trybu siatki (linie kreskowe). */
    hidden: pathFrom2d(
      ([
        [x0, y1, z0],
        [x0, y0, z0],
        [x1, y0, z0],
      ] as Vec3[]).map(iso),
      false,
    ),
    hiddenVertical: pathFrom2d([iso([x0, y0, z0]), iso([x0, y0, z1])], false),
  };
}

/** Obwiednia zbioru punktów 2D — do automatycznego viewBox. */
export function bounds(points: readonly Vec2[], pad = 0) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const maxX = Math.max(...xs) + pad;
  const maxY = Math.max(...ys) + pad;
  return { minX, minY, width: maxX - minX, height: maxY - minY, viewBox: `${round(minX)} ${round(minY)} ${round(maxX - minX)} ${round(maxY - minY)}` };
}
