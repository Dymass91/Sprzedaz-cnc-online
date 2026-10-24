// Testy kinematyki: `npm test` (node --test, bez dodatkowych zależności).
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { INLINE_FOUR_PHASES, solveCylinder, solveEngine, type CrankGeometry } from "./kinematics.ts";

const geometry: CrankGeometry = { crankRadius: 40, rodLength: 135 };
const EPS = 1e-9;
const angles = Array.from({ length: 360 }, (_, i) => (i * Math.PI) / 180);

describe("mechanizm korbowo-tłokowy", () => {
  it("GMP: tłok najwyżej, korbowód pionowo", () => {
    const s = solveCylinder(geometry, 0);
    assert.ok(Math.abs(s.pistonPinY - (40 + 135)) < EPS);
    assert.ok(Math.abs(s.pistonTravel) < EPS);
    assert.ok(Math.abs(s.rodAngle) < EPS);
  });

  it("DMP: tłok najniżej, skok = 2r", () => {
    const s = solveCylinder(geometry, Math.PI);
    assert.ok(Math.abs(s.pistonPinY - (135 - 40)) < EPS);
    assert.ok(Math.abs(s.pistonTravel - 80) < EPS);
  });

  it("długość korbowodu stała dla każdego kąta (połączenie czop–sworzeń)", () => {
    for (const a of angles) {
      const s = solveCylinder(geometry, a);
      const length = Math.hypot(s.pistonPinY - s.crankPin.y, 0 - s.crankPin.z);
      assert.ok(Math.abs(length - geometry.rodLength) < 1e-9, `kąt ${a}: ${length}`);
    }
  });

  it("czop korbowy leży na okręgu o promieniu r", () => {
    for (const a of angles) {
      const { crankPin } = solveCylinder(geometry, a);
      assert.ok(Math.abs(Math.hypot(crankPin.y, crankPin.z) - geometry.crankRadius) < 1e-9);
    }
  });

  it("obrót korbowodu o rodAngle prowadzi od czopa do sworznia", () => {
    for (const a of angles) {
      const s = solveCylinder(geometry, a);
      // Obrót wektora (0, l, 0) wokół osi X o kąt −rodAngle (tak jak w scenie 3D).
      const rot = -s.rodAngle;
      const endY = s.crankPin.y + geometry.rodLength * Math.cos(rot);
      const endZ = s.crankPin.z + geometry.rodLength * Math.sin(rot);
      assert.ok(Math.abs(endY - s.pistonPinY) < 1e-9 && Math.abs(endZ) < 1e-9, `kąt ${a}`);
    }
  });

  it("tłok porusza się wyłącznie w zakresie skoku", () => {
    for (const a of angles) {
      const { pistonTravel } = solveCylinder(geometry, a);
      assert.ok(pistonTravel >= -EPS && pistonTravel <= 80 + EPS);
    }
  });

  it("ruch nie jest sinusoidą: w połowie obrotu wału (90°) tłok przebył więcej niż połowę skoku", () => {
    // Skończona długość korbowodu → przy 90° tłok jest poniżej połowy skoku.
    const s = solveCylinder(geometry, Math.PI / 2);
    assert.ok(s.pistonTravel > 40 + 1, `przemieszczenie ${s.pistonTravel}`);
  });
});

describe("silnik R4", () => {
  it("fazy wykorbień 0°, 180°, 180°, 0°", () => {
    assert.deepEqual([...INLINE_FOUR_PHASES], [0, Math.PI, Math.PI, 0]);
  });

  it("tłoki 1 i 4 w fazie, 2 i 3 w przeciwfazie", () => {
    for (const a of angles) {
      const [c1, c2, c3, c4] = solveEngine(geometry, a);
      assert.ok(Math.abs(c1.pistonPinY - c4.pistonPinY) < EPS);
      assert.ok(Math.abs(c2.pistonPinY - c3.pistonPinY) < EPS);
      // Gdy 1 i 4 są w GMP, 2 i 3 są w DMP.
    }
    const [c1, c2] = solveEngine(geometry, 0);
    assert.ok(Math.abs(c1.pistonTravel) < EPS && Math.abs(c2.pistonTravel - 80) < EPS);
  });
});
