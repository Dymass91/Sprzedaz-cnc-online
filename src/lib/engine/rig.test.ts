// Spójność mechanizmu na prawdziwych obiektach Three.js: koniec korbowodu musi
// trafiać w sworzeń tłoka, a czop korbowy obracać się razem z wałem.
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { Group, Object3D, Vector3 } from "three";
import { applyEngineState, ENGINE_NODE_NAMES, extractEngineParts, PROTOTYPE_RIG, type EngineParts } from "./rig.ts";

function syntheticEngine(): { root: Group; parts: EngineParts } {
  const root = new Group();
  const named = (name: string) => {
    const o = new Object3D();
    o.name = name;
    root.add(o);
    return o;
  };
  const crankshaft = named(ENGINE_NODE_NAMES.crankshaft);
  const pistons = [1, 2, 3, 4].map((n) => named(ENGINE_NODE_NAMES.piston(n)));
  const rods = [1, 2, 3, 4].map((n) => named(ENGINE_NODE_NAMES.rod(n)));
  return { root, parts: { crankshaft, pistons, rods, block: null } };
}

describe("rig silnika", () => {
  it("rozpoznaje części po nazwach węzłów (kontrakt GLB)", () => {
    const { root } = syntheticEngine();
    const result = extractEngineParts(root);
    assert.equal(result.ok, true);
  });

  it("zgłasza brakujące części", () => {
    const root = new Group();
    const result = extractEngineParts(root);
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.missing.includes("piston_3") && result.missing.includes("crankshaft"));
  });

  it("koniec korbowodu trafia w sworzeń tłoka dla pełnego obrotu wału", () => {
    const { root, parts } = syntheticEngine();
    const l = PROTOTYPE_RIG.crank.rodLength;
    for (let deg = 0; deg < 720; deg += 7) {
      applyEngineState(parts, PROTOTYPE_RIG, (deg * Math.PI) / 180);
      root.updateMatrixWorld(true);
      parts.rods.forEach((rod, i) => {
        const smallEnd = new Vector3(0, l, 0).applyMatrix4(rod.matrixWorld);
        const pin = new Vector3().setFromMatrixPosition(parts.pistons[i].matrixWorld);
        assert.ok(smallEnd.distanceTo(pin) < 1e-6, `cyl ${i + 1}, ${deg}°: ${smallEnd.distanceTo(pin)}`);
      });
    }
  });

  it("stopa korbowodu leży na czopie obracającego się wału", () => {
    const { root, parts } = syntheticEngine();
    const r = PROTOTYPE_RIG.crank.crankRadius;
    for (let deg = 0; deg < 360; deg += 11) {
      const theta = (deg * Math.PI) / 180;
      applyEngineState(parts, PROTOTYPE_RIG, theta);
      root.updateMatrixWorld(true);
      parts.rods.forEach((rod, i) => {
        // Czop korbowy zdefiniowany w układzie wału: (x_i, r, 0) obrócony o fazę cylindra.
        const phase = PROTOTYPE_RIG.phases[i];
        const pinLocal = new Vector3(PROTOTYPE_RIG.cylinderX[i], r * Math.cos(phase), r * Math.sin(phase));
        const pinWorld = pinLocal.applyMatrix4(parts.crankshaft.matrixWorld);
        const bigEnd = new Vector3().setFromMatrixPosition(rod.matrixWorld);
        assert.ok(pinWorld.distanceTo(bigEnd) < 1e-6, `cyl ${i + 1}, ${deg}°`);
      });
    }
  });
});
