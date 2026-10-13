import { bounds, box, circle3d, circlePath, cylinder, iso, polygon, ringPath, type Vec2, type Vec3 } from "@/lib/geometry/iso";

/**
 * Geometria wspornika (korpusu) — część przedstawiona w hero i konfiguratorze.
 * Wymiary w umownych milimetrach. Kolejność elementów = kolejność malowania
 * (od tyłu do przodu).
 */

const BASE_MIN: Vec3 = [0, 0, 0];
const BASE_MAX: Vec3 = [172, 64, 16];

/** Profil żebra w płaszczyźnie XZ (y = 18…46). */
const WEB_Y0 = 18;
const WEB_Y1 = 46;
const WEB_PROFILE: [number, number][] = [
  [10, 16],
  [122, 16],
  [88, 116],
  [58, 116],
  [6, 60],
];
/** Okno (wybranie) w żebrze. */
const WEB_WINDOW: [number, number][] = [
  [52, 32],
  [104, 32],
  [79, 90],
];

const at = (profile: [number, number][], y: number): Vec3[] => profile.map(([x, z]) => [x, y, z]);

export const base = box(BASE_MIN, BASE_MAX);

export const baseHoles = {
  counterbore: {
    outer: circlePath([144, 32, 16], 13, "xy"),
    inner: circlePath([144, 32, 10], 8.5, "xy"),
    lip: circlePath([144, 32, 16], 8.5, "xy"),
    center: iso([144, 32, 16]),
  },
  small: ([
    [162, 10, 16],
    [162, 54, 16],
    [112, 56, 16],
    [124, 8, 16],
  ] as Vec3[]).map((c) => ({ d: circlePath(c, 4.2, "xy"), center: iso(c) })),
};

/** Mała dolna podcięcie (półokrągłe) w przedniej ścianie podstawy. */
export const baseNotch = polygon([
  ...circle3d([150, 64, 0], 7, "xz", 32).filter(([, , z]) => z >= 0),
]);

export const web = {
  front: `${polygon(at(WEB_PROFILE, WEB_Y1))}${polygon(at(WEB_WINDOW, WEB_Y1))}`,
  frontSolid: polygon(at(WEB_PROFILE, WEB_Y1)),
  slope: polygon([
    [122, WEB_Y1, 16],
    [88, WEB_Y1, 116],
    [88, WEB_Y0, 116],
    [122, WEB_Y0, 16],
  ]),
  windowBottom: polygon([
    [52, WEB_Y1, 32],
    [104, WEB_Y1, 32],
    [104, WEB_Y0, 32],
    [52, WEB_Y0, 32],
  ]),
  windowLeft: polygon([
    [52, WEB_Y1, 32],
    [79, WEB_Y1, 90],
    [79, WEB_Y0, 90],
    [52, WEB_Y0, 32],
  ]),
  windowFront: polygon(at(WEB_WINDOW, WEB_Y1)),
  windowBack: polygon(at(WEB_WINDOW, WEB_Y0)),
  back: polygon(at(WEB_PROFILE, WEB_Y0)),
};

/** Górna piasta (oś Y) z otworem pasowanym. */
export const topBoss = {
  cyl: cylinder("y", [73, 16, 116], 36, 19),
  bore: circlePath([73, 52, 116], 9.5, "xz"),
  boreBack: circlePath([73, 16, 116], 9.5, "xz"),
  chamfer: circlePath([73, 52, 116], 17.5, "xz"),
  center: iso([73, 52, 116]),
  holes: ([-1, 1] as const).map((s) => ({ d: circlePath([73 + s * 13.5, 52, 116], 1.8, "xz", 20) })),
};

/** Lewa piasta (oś Y) z kołnierzem i otworami na śruby. */
export const sideBoss = {
  cyl: cylinder("y", [16, 34, 36], 42, 30),
  ring: ringPath([16, 76, 36], 30, 16, "xz"),
  bore: circlePath([16, 76, 36], 16, "xz"),
  boreBack: circlePath([16, 34, 36], 16, "xz"),
  boreStep: circlePath([16, 66, 36], 12.5, "xz"),
  chamfer: circlePath([16, 76, 36], 28.5, "xz"),
  center: iso([16, 76, 36]),
  bolts: Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const c: Vec3 = [16 + Math.cos(a) * 23, 76, 36 + Math.sin(a) * 23];
    return { d: circlePath(c, 2.4, "xz", 20), center: iso(c) };
  }),
};

/** Punkty charakterystyczne do wymiarowania i adnotacji (w układzie ekranu). */
export const anchors = {
  baseFrontLeftBottom: iso([0, 64, 0]),
  baseFrontRightBottom: iso([172, 64, 0]),
  baseRightBackBottom: iso([172, 0, 0]),
  baseTopRightFront: iso([172, 64, 16]),
  topBossTop: iso([73, 52, 135]),
  baseBottomUnderBoss: iso([73, 52, 0]),
  boreEdge: iso([16, 76, 52]),
  sideBossCenter: iso([16, 76, 36]),
  topBossCenter: iso([73, 52, 116]),
  counterbore: iso([144, 32, 16]),
  smallHole: iso([162, 54, 16]),
  slopeMid: iso([105, 46, 66]),
};

const silhouette: Vec2[] = [
  ...([
    [0, 0, 0],
    [172, 0, 0],
    [172, 64, 0],
    [0, 64, 0],
    [172, 0, 16],
    [0, 0, 16],
  ] as Vec3[]).map(iso),
  ...circle3d([16, 34, 36], 30, "xz").map(iso),
  ...circle3d([16, 76, 36], 30, "xz").map(iso),
  ...circle3d([73, 16, 116], 19, "xz").map(iso),
  ...circle3d([73, 52, 116], 19, "xz").map(iso),
];

export const bracketBounds = bounds(silhouette, 4);

/** Ścieżki tworzące sylwetkę — do maski odblasku. */
export const bracketClipPaths = [
  base.top,
  base.front,
  base.side,
  web.frontSolid,
  web.slope,
  topBoss.cyl.body,
  topBoss.cyl.cap,
  sideBoss.cyl.body,
  sideBoss.cyl.cap,
];
