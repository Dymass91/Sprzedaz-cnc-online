/**
 * Kinematyka mechanizmu korbowo-tłokowego silnika rzędowego.
 *
 * Układ odniesienia (jak w scenie 3D):
 *  - oś wału korbowego = oś X,
 *  - oś cylindra = oś Y (w górę), przechodzi przez oś wału,
 *  - wykorbienie obraca się w płaszczyźnie YZ.
 *
 * Kąt φ = 0 oznacza górny martwy punkt (GMP). Wszystkie wielkości wynikają
 * z jednego kąta wału — tłoki i korbowody nie mają niezależnych animacji.
 * Moduł jest czysty (bez Three.js), testy: `kinematics.test.ts`.
 */

export type CrankGeometry = {
  /** Promień wykorbienia r (połowa skoku tłoka). */
  crankRadius: number;
  /** Długość korbowodu l (rozstaw osi czopa korbowego i sworznia tłokowego). */
  rodLength: number;
};

export type CylinderState = {
  /** Kąt wykorbienia tego cylindra (rad), znormalizowany do [0, 2π). */
  crankAngle: number;
  /** Środek czopa korbowego w płaszczyźnie YZ. */
  crankPin: { y: number; z: number };
  /** Wysokość osi sworznia tłokowego nad osią wału. */
  pistonPinY: number;
  /** Przemieszczenie tłoka od GMP (0 w GMP, 2r w DMP). */
  pistonTravel: number;
  /** Odchylenie korbowodu od osi cylindra (rad), dodatnie gdy czop jest po stronie +Z. */
  rodAngle: number;
};

const TWO_PI = Math.PI * 2;

export function normalizeAngle(angle: number): number {
  const a = angle % TWO_PI;
  return a < 0 ? a + TWO_PI : a;
}

/** Stan pojedynczego cylindra dla kąta wykorbienia φ. */
export function solveCylinder(geometry: CrankGeometry, crankAngle: number): CylinderState {
  const { crankRadius: r, rodLength: l } = geometry;
  if (!(l > r && r > 0)) throw new Error("Korbowód musi być dłuższy od promienia wykorbienia.");
  const phi = normalizeAngle(crankAngle);
  const pinY = r * Math.cos(phi);
  const pinZ = r * Math.sin(phi);
  // Sworzeń tłokowy leży na osi cylindra (z = 0) w odległości l od czopa korbowego.
  const pistonPinY = pinY + Math.sqrt(l * l - pinZ * pinZ);
  return {
    crankAngle: phi,
    crankPin: { y: pinY, z: pinZ },
    pistonPinY,
    pistonTravel: r + l - pistonPinY,
    rodAngle: Math.asin(pinZ / l),
  };
}

/**
 * Fazy wykorbień czterocylindrowego silnika rzędowego z płaskim wałem:
 * cylindry 1 i 4 w fazie, 2 i 3 przesunięte o 180°. Kolejność zapłonu 1-3-4-2
 * wynika z rozrządu i nie zmienia geometrii mechanizmu korbowego.
 */
export const INLINE_FOUR_PHASES = [0, Math.PI, Math.PI, 0] as const;

/** Stan wszystkich cylindrów dla kąta obrotu wału θ. */
export function solveEngine(geometry: CrankGeometry, shaftAngle: number, phases: readonly number[] = INLINE_FOUR_PHASES): CylinderState[] {
  return phases.map((phase) => solveCylinder(geometry, shaftAngle + phase));
}

/**
 * Płynne narastanie prędkości obrotowej (ease-in-out) — start i zatrzymanie
 * wału bez szarpnięć. Zwraca współczynnik 0…1.
 */
export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Prędkość kątowa (rad/s) dla obrotów na minutę. */
export function rpmToRadPerSecond(rpm: number): number {
  return (rpm / 60) * TWO_PI;
}
