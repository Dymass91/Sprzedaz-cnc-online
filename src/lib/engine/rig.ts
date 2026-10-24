import type { Object3D } from "three";
import { INLINE_FOUR_PHASES, solveEngine, type CrankGeometry } from "./kinematics.ts";

/**
 * „Rig” silnika R4: wymiary mechanizmu i powiązanie części 3D z kinematyką.
 *
 * Ten sam kontrakt obsługuje model proceduralny i docelowy model GLB/GLTF.
 * Wymagania dla pliku GLB (jednostki: mm, oś wału = X, cylindry wzdłuż +Y):
 *  - `crankshaft`        — punkt obrotu na osi wału, wykorbienie cyl. 1 w GMP dla rotation.x = 0,
 *  - `connecting_rod_N`  — początek w środku stopy korbowodu, korbowód wzdłuż +Y,
 *  - `piston_N`          — początek w osi sworznia tłokowego,
 *  - `engine_block`      — nieruchomy (opcjonalny).
 * N = 1…4, numeracja od przodu silnika (−X).
 */

export type EngineRig = {
  crank: CrankGeometry;
  /** Położenie osi cylindrów wzdłuż osi wału (mm). */
  cylinderX: readonly number[];
  /** Fazy wykorbień poszczególnych cylindrów (rad). */
  phases: readonly number[];
};

/** Proporcje typowego silnika R4 o pojemności ok. 1,6 dm³ (średnica = skok = 80 mm). */
export const ENGINE_DIMENSIONS = {
  bore: 80,
  stroke: 80,
  rodLength: 135,
  cylinderPitch: 92,
  pistonHeight: 58,
  /** Odległość od osi sworznia do denka tłoka. */
  pinToCrown: 30,
} as const;

export const PROTOTYPE_RIG: EngineRig = {
  crank: { crankRadius: ENGINE_DIMENSIONS.stroke / 2, rodLength: ENGINE_DIMENSIONS.rodLength },
  cylinderX: [-1.5, -0.5, 0.5, 1.5].map((k) => k * ENGINE_DIMENSIONS.cylinderPitch),
  phases: INLINE_FOUR_PHASES,
};

export const ENGINE_NODE_NAMES = {
  crankshaft: "crankshaft",
  block: "engine_block",
  piston: (n: number) => `piston_${n}`,
  rod: (n: number) => `connecting_rod_${n}`,
} as const;

export type EngineParts = {
  crankshaft: Object3D;
  pistons: Object3D[];
  rods: Object3D[];
  block: Object3D | null;
};

/** Wyszukuje części silnika w scenie (np. wczytanej z GLB) po nazwach węzłów. */
export function extractEngineParts(root: Object3D, cylinders = 4): { ok: true; parts: EngineParts } | { ok: false; missing: string[] } {
  const find = (name: string) => root.getObjectByName(name) ?? null;
  const missing: string[] = [];
  const crankshaft = find(ENGINE_NODE_NAMES.crankshaft);
  if (!crankshaft) missing.push(ENGINE_NODE_NAMES.crankshaft);
  const pistons: Object3D[] = [];
  const rods: Object3D[] = [];
  for (let n = 1; n <= cylinders; n++) {
    const piston = find(ENGINE_NODE_NAMES.piston(n));
    const rod = find(ENGINE_NODE_NAMES.rod(n));
    if (piston) pistons.push(piston);
    else missing.push(ENGINE_NODE_NAMES.piston(n));
    if (rod) rods.push(rod);
    else missing.push(ENGINE_NODE_NAMES.rod(n));
  }
  if (missing.length || !crankshaft) return { ok: false, missing };
  return { ok: true, parts: { crankshaft, pistons, rods, block: find(ENGINE_NODE_NAMES.block) } };
}

/**
 * Ustawia wszystkie części dla kąta obrotu wału θ. Jedyne źródło ruchu —
 * tłoki i korbowody wynikają z geometrii mechanizmu, bez osobnych animacji.
 */
export function applyEngineState(parts: EngineParts, rig: EngineRig, shaftAngle: number): void {
  parts.crankshaft.rotation.x = shaftAngle;
  const states = solveEngine(rig.crank, shaftAngle, rig.phases);
  states.forEach((s, i) => {
    const x = rig.cylinderX[i];
    const rod = parts.rods[i];
    rod.position.set(x, s.crankPin.y, s.crankPin.z);
    rod.rotation.set(-s.rodAngle, 0, 0);
    parts.pistons[i].position.set(x, s.pistonPinY, 0);
  });
}
