import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Path,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  Vector2,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ENGINE_DIMENSIONS, PROTOTYPE_RIG } from "@/lib/engine/rig";

/**
 * Proceduralny model silnika R4 (mm). Układ: oś wału = X, cylindry wzdłuż +Y,
 * przekrój bloku w płaszczyźnie z = 0 (usunięta przednia połowa, z > 0).
 * Części ruchome są modelowane w swoich układach lokalnych zgodnych z kontraktem
 * `src/lib/engine/rig.ts` — ten sam układ obowiązuje docelowy model GLB.
 */

const D = ENGINE_DIMENSIONS;
const R = PROTOTYPE_RIG.crank.crankRadius;
const L = PROTOTYPE_RIG.crank.rodLength;
const X = PROTOTYPE_RIG.cylinderX;
const PITCH = D.cylinderPitch;
const BORE_R = D.bore / 2;

/** Rzędne charakterystyczne bloku. */
export const BLOCK = {
  xMin: -214,
  xMax: 214,
  bottom: -90,
  pan: -76,
  linerBottom: 60,
  deck: R + L + D.pinToCrown + 2,
  headTop: R + L + D.pinToCrown + 2 + 62,
  back: -95,
} as const;

/** Odcinki linii: [ax, ay, az, bx, by, bz] dla każdego odcinka. */
type Segments = number[];

const EDGE_ANGLE = 28;

function nonIndexed(g: BufferGeometry): BufferGeometry {
  const out = g.index ? g.toNonIndexed() : g;
  if (out !== g) g.dispose();
  out.clearGroups();
  if (!out.getAttribute("uv")) out.setAttribute("uv", new Float32BufferAttribute(new Float32Array((out.getAttribute("position").count) * 2), 2));
  return out;
}

function edgesOf(g: BufferGeometry, out: Segments, angle = EDGE_ANGLE) {
  const e = new EdgesGeometry(g, angle);
  out.push(...(e.getAttribute("position").array as Float32Array));
  e.dispose();
}

function circleSegments(out: Segments, center: [number, number, number], radius: number, plane: "yz" | "xz", steps = 48) {
  for (let i = 0; i < steps; i++) {
    const a0 = (i / steps) * Math.PI * 2;
    const a1 = ((i + 1) / steps) * Math.PI * 2;
    const p = (a: number) =>
      plane === "yz"
        ? [center[0], center[1] + Math.cos(a) * radius, center[2] + Math.sin(a) * radius]
        : [center[0] + Math.cos(a) * radius, center[1], center[2] + Math.sin(a) * radius];
    out.push(...p(a0), ...p(a1));
  }
}

/** Walec o osi X. */
function cylinderX(radius: number, length: number, x: number, y = 0, z = 0, segments = 40) {
  return new CylinderGeometry(radius, radius, length, segments).rotateZ(-Math.PI / 2).translate(x, y, z);
}

/** Wyciągnięcie kształtu 2D (u = −z, v = y) wzdłuż osi X, wyśrodkowane na x. */
function extrudeX(shape: Shape, depth: number, x: number) {
  return new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 28 })
    .translate(0, 0, -depth / 2)
    .rotateY(Math.PI / 2)
    .translate(x, 0, 0);
}

export type PartGeometry = { surface: BufferGeometry; lines: Segments };

/* ------------------------------------------------------------------------ */
/* Wał korbowy                                                               */
/* ------------------------------------------------------------------------ */

const COUNTERWEIGHT_R = 54;

function webShape(): Shape {
  const s = new Shape();
  const side = 0.35;
  s.moveTo(25, R);
  s.absarc(0, R, 25, 0, Math.PI, false);
  s.lineTo(-COUNTERWEIGHT_R * Math.cos(side), -COUNTERWEIGHT_R * Math.sin(side));
  s.absarc(0, 0, COUNTERWEIGHT_R, Math.PI + side, Math.PI * 2 - side, false);
  s.lineTo(25, R);
  return s;
}

export function buildCrankshaft(): PartGeometry {
  const pieces: BufferGeometry[] = [];
  const lines: Segments = [];
  const add = (g: BufferGeometry) => {
    edgesOf(g, lines);
    pieces.push(nonIndexed(g));
  };

  const journalWidth = PITCH - 2 * 24;
  // Czopy główne: między cylindrami i na końcach.
  for (const xm of [-2, -1, 0, 1, 2].map((k) => k * PITCH)) add(cylinderX(26, journalWidth, xm));

  const web = webShape();
  X.forEach((xc, i) => {
    const phase = PROTOTYPE_RIG.phases[i];
    const throwParts = [
      cylinderX(21, 22, xc, R, 0, 32),
      extrudeX(web, 13, xc - 17.5),
      extrudeX(web, 13, xc + 17.5),
    ];
    for (const g of throwParts) add(g.rotateX(phase));
  });

  const front = -2 * PITCH - journalWidth / 2;
  const rear = 2 * PITCH + journalWidth / 2;
  add(cylinderX(18, 40, front - 20)); // czop przedni
  add(cylinderX(50, 18, front - 49, 0, 0, 56)); // koło pasowe
  add(cylinderX(34, 12, rear + 6)); // kołnierz
  add(cylinderX(100, 16, rear + 20, 0, 0, 72)); // koło zamachowe
  circleSegments(lines, [rear + 28.1, 0, 0], 86, "yz", 72);
  circleSegments(lines, [front - 58.1, 0, 0], 38, "yz", 48);

  const surface = mergeGeometries(pieces);
  pieces.forEach((p) => p.dispose());
  return { surface, lines };
}

/* ------------------------------------------------------------------------ */
/* Korbowód (początek: środek stopy, korbowód wzdłuż +Y)                     */
/* ------------------------------------------------------------------------ */

function ringShape(outer: number, inner: number, cy = 0): Shape {
  const s = new Shape();
  s.absarc(0, cy, outer, 0, Math.PI * 2, false);
  const hole = new Path();
  hole.absarc(0, cy, inner, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

export function buildConnectingRod(): PartGeometry {
  const lines: Segments = [];
  const pieces: BufferGeometry[] = [];
  const add = (g: BufferGeometry, edgeAngle = EDGE_ANGLE) => {
    edgesOf(g, lines, edgeAngle);
    pieces.push(nonIndexed(g));
  };
  add(extrudeX(ringShape(31, 21.5), 20, 0)); // stopa (otwór na czop)
  for (const side of [-1, 1]) add(new BoxGeometry(18, 24, 9).translate(0, 2, side * 33)); // śruby pokrywy

  const shank = new Shape();
  shank.moveTo(-13, 27);
  shank.lineTo(13, 27);
  shank.lineTo(8.5, L - 14);
  shank.lineTo(-8.5, L - 14);
  shank.lineTo(-13, 27);
  add(extrudeX(shank, 13, 0));
  add(extrudeX(ringShape(16, 10.5, L), 20, 0)); // główka
  const surface = mergeGeometries(pieces);
  pieces.forEach((p) => p.dispose());
  return { surface, lines };
}

/* ------------------------------------------------------------------------ */
/* Tłok (początek: oś sworznia)                                              */
/* ------------------------------------------------------------------------ */

export function buildPiston(): PartGeometry {
  const lines: Segments = [];
  const crown = D.pinToCrown;
  const skirt = -(D.pistonHeight - D.pinToCrown);
  const radius = BORE_R - 0.5;
  const profile = [
    new Vector2(0, crown),
    new Vector2(radius - 1.2, crown),
    new Vector2(radius, crown - 1.2),
    new Vector2(radius, skirt),
    new Vector2(radius - 4, skirt),
    new Vector2(radius - 4, crown - 10),
    new Vector2(0, crown - 10),
  ];
  // Profil od wewnątrz na zewnątrz daje ściany skierowane do środka — odwracamy kolejność punktów.
  const body = new LatheGeometry(profile.reverse(), 48);
  edgesOf(body, lines, 35);
  // Rowki pierścieni
  for (const y of [crown - 6, crown - 11, crown - 16]) circleSegments(lines, [0, y, 0], radius + 0.15, "xz", 48);
  const pin = cylinderX(11, 2 * radius - 10, 0);
  edgesOf(pin, lines);
  const surface = mergeGeometries([nonIndexed(body), nonIndexed(pin)]);
  return { surface, lines };
}

/* ------------------------------------------------------------------------ */
/* Blok i głowica w przekroju                                                */
/* ------------------------------------------------------------------------ */

function rect(x0: number, y0: number, x1: number, y1: number): Shape {
  const s = new Shape();
  s.moveTo(x0, y0);
  s.lineTo(x1, y0);
  s.lineTo(x1, y1);
  s.lineTo(x0, y1);
  s.lineTo(x0, y0);
  return s;
}

export type BlockGeometry = {
  /** Powierzchnie przekroju (z = 0) — kreskowane. */
  section: BufferGeometry;
  /** Wnętrze za przekrojem: tuleje, ściany, przegrody. */
  interior: BufferGeometry;
  lines: Segments;
  /** Osie: wału i cylindrów (linia punktowa). */
  axes: Segments;
};

export function buildBlock(): BlockGeometry {
  const { xMin, xMax, bottom, pan, linerBottom, deck, headTop, back } = BLOCK;
  const lines: Segments = [];
  const shapes: Shape[] = [];

  // Miska olejowa i ścianki boczne skrzyni korbowej
  shapes.push(rect(xMin, bottom, xMax, pan));
  shapes.push(rect(xMin, pan, xMin + 14, linerBottom));
  shapes.push(rect(xMax - 14, pan, xMax, linerBottom));
  // Ściany czołowe i mostki między cylindrami (od dna tulei do płaszczyzny bloku)
  const walls: [number, number][] = [[xMin, X[0] - BORE_R]];
  for (let i = 0; i < X.length - 1; i++) walls.push([X[i] + BORE_R, X[i + 1] - BORE_R]);
  walls.push([X[X.length - 1] + BORE_R, xMax]);
  for (const [a, b] of walls) shapes.push(rect(a, linerBottom, b, deck));
  // Przegrody łożysk głównych z łożyskiem wału
  for (const xm of [-2, -1, 0, 1, 2].map((k) => k * PITCH)) {
    const s = rect(xm - 9, pan, xm + 9, linerBottom);
    shapes.push(s);
  }
  // Głowica z komorami spalania
  const head = rect(xMin, deck + 2, xMax, headTop);
  for (const xc of X) head.holes.push(rect(xc - 30, deck + 5, xc + 30, deck + 15));
  for (const xc of X) {
    const port = new Path();
    port.absarc(xc, deck + 38, 9, 0, Math.PI * 2, true);
    head.holes.push(port);
  }
  shapes.push(head);

  const section = new ShapeGeometry(shapes, 24);
  edgesOf(section, lines, 1);

  // Wnętrze za przekrojem
  const interiorParts: BufferGeometry[] = [];
  const addInterior = (g: BufferGeometry, edges = true) => {
    if (edges) edgesOf(g, lines);
    interiorParts.push(nonIndexed(g));
  };
  const height = headTop - bottom;
  const depth = -back;
  addInterior(new PlaneGeometry(xMax - xMin, height).translate(0, bottom + height / 2, back)); // tylna ściana
  for (const xc of X) {
    // Tylna połowa tulei (θ od π/2 do 3π/2 → z ≤ 0), widoczna od środka
    const liner = new CylinderGeometry(BORE_R, BORE_R, deck - linerBottom, 48, 1, true, Math.PI / 2, Math.PI).translate(
      xc,
      (deck + linerBottom) / 2,
      0,
    );
    addInterior(liner);
  }
  // Ściany czołowe (zewnętrzne) i górna powierzchnia głowicy
  addInterior(new PlaneGeometry(depth, height).rotateY(Math.PI / 2).translate(xMax, bottom + height / 2, back / 2));
  addInterior(new PlaneGeometry(depth, height).rotateY(-Math.PI / 2).translate(xMin, bottom + height / 2, back / 2));
  addInterior(new PlaneGeometry(xMax - xMin, depth).rotateX(-Math.PI / 2).translate(0, headTop, back / 2));
  // Przegrody łożysk w głąb bloku
  for (const xm of [-2, -1, 0, 1, 2].map((k) => k * PITCH)) addInterior(new BoxGeometry(18, linerBottom - pan, depth - 1).translate(xm, (linerBottom + pan) / 2, back / 2 - 0.5));

  const interior = mergeGeometries(interiorParts);
  interiorParts.forEach((p) => p.dispose());

  // Osie
  const axes: Segments = [xMin - 80, 0, 0, xMax + 50, 0, 0];
  for (const xc of X) axes.push(xc, -20, 0, xc, headTop + 26, 0);

  return { section, interior, lines, axes };
}

/* ------------------------------------------------------------------------ */
/* Linie szkicu: atrybuty rysowania                                          */
/* ------------------------------------------------------------------------ */

/**
 * Buduje geometrię linii z atrybutami:
 *  aT — 0 na początku i 1 na końcu odcinka (rysowanie „pociągnięciem”),
 *  aOrder — moment rozpoczęcia rysowania (0…1) w ramach całej sekwencji,
 *  aJitter — losowy nacisk ołówka, aDist — długość wzdłuż linii (osie punktowe).
 */
export function buildSketchLines(segments: Segments, order: { start: number; span: number; seed?: number }): BufferGeometry {
  const count = segments.length / 6;
  let xMin = Infinity;
  let xMax = -Infinity;
  for (let i = 0; i < count; i++) {
    const mx = (segments[i * 6] + segments[i * 6 + 3]) / 2;
    xMin = Math.min(xMin, mx);
    xMax = Math.max(xMax, mx);
  }
  const range = xMax - xMin || 1;
  let seed = order.seed ?? 1;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const aT = new Float32Array(count * 2);
  const aOrder = new Float32Array(count * 2);
  const aJitter = new Float32Array(count * 2);
  const aDist = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const o = i * 6;
    const mx = (segments[o] + segments[o + 3]) / 2;
    const value = order.start + order.span * (0.85 * ((mx - xMin) / range) + 0.15 * random());
    const jitter = random();
    const len = Math.hypot(segments[o + 3] - segments[o], segments[o + 4] - segments[o + 1], segments[o + 5] - segments[o + 2]);
    aT.set([0, 1], i * 2);
    aOrder.set([value, value], i * 2);
    aJitter.set([jitter, jitter], i * 2);
    aDist.set([0, len], i * 2);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(new Float32Array(segments), 3));
  g.setAttribute("aT", new Float32BufferAttribute(aT, 1));
  g.setAttribute("aOrder", new Float32BufferAttribute(aOrder, 1));
  g.setAttribute("aJitter", new Float32BufferAttribute(aJitter, 1));
  g.setAttribute("aDist", new Float32BufferAttribute(aDist, 1));
  return g;
}
