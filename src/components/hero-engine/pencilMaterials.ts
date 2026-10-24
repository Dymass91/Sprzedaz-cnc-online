import { BackSide, DoubleSide, ShaderMaterial, Vector2, Vector3 } from "three";
import { GRAPHITE, PAPER } from "./sketchMaterials";

/**
 * Materiały trybu „szkic ołówkiem”.
 *
 * Kluczowa zasada stabilności: wszystko, co jest śladem grafitu, liczone jest
 * w przestrzeni LOKALNEJ części (pozycja wierzchołka przed transformacją),
 * więc kreski poruszają się razem z tłokiem, korbowodem i wałem. Wzory są
 * deterministyczne (hash z indeksu kreski) — nie zmieniają się między klatkami.
 * Jedynie ziarno papieru jest w przestrzeni ekranu: kartka stoi w miejscu,
 * a rysunek „żyje” na niej.
 *
 * Antyaliasing kresek: szerokość liczona przez fwidth(), a wzór wygasza się,
 * gdy rozstaw kresek spada poniżej ~2 px (oddalenie) — bez mory i migotania.
 */

const NOISE = /* glsl */ `
  float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float hash21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float noise1(float x) { float i = floor(x); float f = fract(x); return mix(hash11(i), hash11(i + 1.0), f * f * (3.0 - 2.0 * f)); }
  float noise3(vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i + vec3(1, 0, 0)), f.x), mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), f.x), mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
`;

/**
 * Jedna warstwa kreskowania ołówkiem w płaszczyźnie 2D (mm).
 * Każda kreska ma własny nacisk, grubość, lekkie przesunięcie i przerwy
 * (podniesienie ołówka) — wszystko z hash(indeks kreski), więc stabilne.
 */
const HATCH = /* glsl */ `
  // dpx/dpy — pochodne ekranowe współrzędnych płaszczyzny, liczone raz dla wszystkich warstw.
  float pencilLayer(vec2 p, vec2 dpx, vec2 dpy, float angle, float spacing, float seed, float irregularity) {
    float c = cos(angle), s = sin(angle);
    vec2 dir = vec2(c, s);
    vec2 d = vec2(dot(p, dir), -s * p.x + c * p.y);
    float coord = d.x / spacing;
    float idx = floor(coord);
    float rnd = hash21(vec2(idx, seed));
    float fw = max((abs(dot(dpx, dir)) + abs(dot(dpy, dir))) / spacing, 1e-4);
    float center = 0.5 + (rnd - 0.5) * 0.35 * irregularity;
    float halfWidth = mix(0.07, 0.15, hash21(vec2(idx, seed + 7.1)));
    float dist = abs(fract(coord) - center);
    float line = 1.0 - smoothstep(halfWidth - fw, halfWidth + fw, dist);
    // przerwy w kresce i zmienny nacisk wzdłuż jej długości
    float along = d.y / (spacing * 11.0) + rnd * 13.0;
    float gap = step(0.16 * irregularity, hash21(vec2(idx, floor(along) + seed)));
    float pressure = mix(1.0, 0.45 + 0.55 * noise1(along * 2.3 + rnd * 9.0), clamp(irregularity, 0.0, 1.5));
    // wygaszenie, gdy kreski są gęstsze niż ~2 px (brak mory przy oddaleniu)
    float density = 1.0 - smoothstep(0.28, 0.55, fw);
    return line * gap * pressure * density;
  }
`;

const SURFACE_VERTEX = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalL;
  varying vec3 vNormalW;
  void main() {
    vLocal = position;
    vNormalL = normal;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SURFACE_FRAGMENT = /* glsl */ `
  uniform vec3 uPaper;
  uniform vec3 uGraphite;
  uniform vec3 uLightDir;
  uniform float uShade;
  uniform float uSection;
  uniform float uSectionReveal;
  uniform float uPixelRatio;
  uniform float uTone;
  uniform float uGraphiteStrength;
  uniform float uHatchSpacing;
  uniform float uPaperStrength;
  uniform float uIrregularity;
  uniform float uLayers;
  varying vec3 vLocal;
  varying vec3 vNormalL;
  varying vec3 vNormalW;
  ${NOISE}
  ${HATCH}

  float hatchPlane(vec2 q, float l1, float l2, float l3, float s, float seed) {
    float h = 0.0;
    vec2 dx = dFdx(q), dy = dFdy(q);
    if (l1 > 0.0) h += l1 * pencilLayer(q, dx, dy, 0.78, s, seed, uIrregularity);
    if (l2 > 0.0) h += l2 * 0.85 * pencilLayer(q, dx, dy, -0.52, s * 0.9, seed + 3.0, uIrregularity);
    if (l3 > 0.0) h += l3 * 0.7 * pencilLayer(q, dx, dy, 1.45, s * 0.8, seed + 6.0, uIrregularity);
    return h;
  }

  // Kreskowanie triplanarne w przestrzeni lokalnej: wzór przyklejony do części.
  float hatchTriplanar(vec3 p, vec3 n, float darkness) {
    vec3 w = pow(abs(n), vec3(4.0));
    w /= (w.x + w.y + w.z + 1e-5);
    float s = uHatchSpacing;
    float h = 0.0;
    float l1 = smoothstep(0.16, 0.40, darkness);
    float l2 = smoothstep(0.42, 0.66, darkness);
    float l3 = smoothstep(0.66, 0.86, darkness) * step(2.5, uLayers);
    // Pomijamy płaszczyzny o znikomej wadze i warstwy nieobecne przy danym zacienieniu
    // (płaska, jasna ściana = 0 wywołań zamiast 9).
    if (w.x > 0.02) h += w.x * hatchPlane(p.yz, l1, l2, l3, s, 1.0);
    if (w.y > 0.02) h += w.y * hatchPlane(p.xz, l1, l2, l3, s, 2.0);
    if (w.z > 0.02) h += w.z * hatchPlane(p.xy, l1, l2, l3, s, 3.0);
    return h;
  }

  void main() {
    vec3 nW = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 nL = normalize(vNormalL) * (gl_FrontFacing ? 1.0 : -1.0);
    float lit = dot(nW, normalize(uLightDir)) * 0.5 + 0.5;
    // 0 = pełne światło, 1 = najgłębszy cień
    float darkness = 1.0 - smoothstep(0.22, 1.0, lit);
    darkness = clamp(darkness + (1.0 - uTone) * 1.6, 0.0, 1.0);

    // Miękki ton grafitu + ziarno grafitu (przestrzeń lokalna — porusza się z częścią)
    float grain = noise3(vLocal * 0.9);
    float tone = 0.40 * pow(darkness, 1.15) * (0.7 + 0.6 * grain);
    float hatchInk = hatchTriplanar(vLocal, nL, darkness) * 0.55;

    if (uSection > 0.5) {
      // Przekrój: szrafura 45° rysowana ołówkiem — zmienny nacisk, przerwy, grafitowa faktura.
      float sec = pencilLayer(vLocal.xy, dFdx(vLocal.xy), dFdy(vLocal.xy), 0.785, uHatchSpacing * 1.25, 21.0, uIrregularity * 0.7);
      hatchInk = max(hatchInk, sec * 0.62 * uSectionReveal);
      tone = max(tone, 0.035 * uSectionReveal * (0.6 + 0.8 * grain));
    }

    float ink = (tone + hatchInk) * uGraphiteStrength * uShade;
    // Papier: ledwo widoczne ziarno w przestrzeni ekranu (kartka nie porusza się z rysunkiem)
    vec2 px = floor(gl_FragCoord.xy / uPixelRatio * 0.7);
    float paper = (hash21(px) - 0.5) * 0.045 * uPaperStrength;
    ink = clamp(ink - paper * 0.5, 0.0, 0.82); // najciemniejszy grafit nigdy nie jest czarny
    gl_FragColor = vec4(mix(uPaper - paper * 0.35, uGraphite, ink), 1.0);
  }
`;

export type PencilSurfaceOptions = { section?: boolean; tone?: number; doubleSided?: boolean };

export function createPencilSurfaceMaterial({ section = false, tone = 1, doubleSided = false }: PencilSurfaceOptions = {}): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: SURFACE_VERTEX,
    fragmentShader: SURFACE_FRAGMENT,
    uniforms: {
      uPaper: { value: PAPER },
      uGraphite: { value: GRAPHITE },
      uLightDir: { value: new Vector3(0.45, 1, 0.75).normalize() },
      uShade: { value: 0 },
      uSection: { value: section ? 1 : 0 },
      uSectionReveal: { value: 0 },
      uPixelRatio: { value: 1 },
      uTone: { value: tone },
      uGraphiteStrength: { value: 1 },
      uHatchSpacing: { value: 3.4 },
      uPaperStrength: { value: 1 },
      uIrregularity: { value: 1 },
      uLayers: { value: 3 },
    },
    ...(doubleSided ? { side: DoubleSide } : {}),
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

/* ------------------------------------------------------------------------ */
/* Krawędzie: nacisk ołówka + drugie, przesunięte pociągnięcie               */
/* ------------------------------------------------------------------------ */

const LINE_VERTEX = /* glsl */ `
  attribute float aT;
  attribute float aOrder;
  attribute float aJitter;
  attribute float aDist;
  uniform vec2 uOffsetPx;
  uniform vec2 uResolution;
  varying float vT;
  varying float vOrder;
  varying float vJitter;
  varying float vDist;
  varying vec3 vLocal;
  void main() {
    vT = aT;
    vOrder = aOrder;
    vJitter = aJitter;
    vDist = aDist;
    vLocal = position;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    // Drugie pociągnięcie: stałe przesunięcie w pikselach (nie zmienia się w czasie).
    clip.xy += uOffsetPx / uResolution * 2.0 * clip.w;
    gl_Position = clip;
  }
`;

const LINE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uReveal;
  uniform float uWindow;
  uniform float uOpacity;
  uniform float uDash;
  uniform float uStrength;
  uniform float uIrregularity;
  varying float vT;
  varying float vOrder;
  varying float vJitter;
  varying float vDist;
  varying vec3 vLocal;
  ${NOISE}
  void main() {
    float progress = clamp((uReveal - vOrder) / uWindow, 0.0, 1.0);
    if (vT > progress) discard;
    if (uDash > 0.0) {
      float f = fract(vDist / uDash);
      if ((f > 0.62 && f < 0.72) || f > 0.80) discard;
    }
    // Nacisk ołówka zmienny wzdłuż linii (przestrzeń lokalna — stabilny podczas ruchu)
    float pressure = mix(1.0, 0.45 + 0.55 * noise3(vLocal * 0.045 + vJitter * 17.0), clamp(uIrregularity, 0.0, 1.5));
    gl_FragColor = vec4(uColor, clamp(uOpacity * uStrength * pressure * (0.8 + 0.2 * vJitter), 0.0, 1.0));
  }
`;

export function createPencilLineMaterial({
  opacity = 0.85,
  dash = 0,
  offsetPx = [0, 0],
}: { opacity?: number; dash?: number; offsetPx?: [number, number] } = {}): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: LINE_VERTEX,
    fragmentShader: LINE_FRAGMENT,
    uniforms: {
      uColor: { value: GRAPHITE },
      uReveal: { value: 0 },
      uWindow: { value: 0.16 },
      uOpacity: { value: opacity },
      uDash: { value: dash },
      uStrength: { value: 1 },
      uIrregularity: { value: 1 },
      uOffsetPx: { value: new Vector2(...offsetPx) },
      uResolution: { value: new Vector2(1, 1) },
    },
    transparent: true,
    depthWrite: false,
  });
}

/* ------------------------------------------------------------------------ */
/* Sylwetki: kontur o zmiennej grubości (jak prowadzony ręką)                */
/* ------------------------------------------------------------------------ */

const OUTLINE_VERTEX = /* glsl */ `
  uniform float uWidth;
  uniform float uIrregularity;
  uniform vec2 uResolution;
  varying float vPressure;
  ${NOISE}
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec3 nView = normalize(normalMatrix * normal);
    vec2 nClip = normalize((projectionMatrix * vec4(nView, 0.0)).xy + 1e-6);
    // Grubość konturu zmienna wzdłuż krawędzi — szum z pozycji lokalnej (stabilny).
    float n = noise3(position * 0.035);
    vPressure = n;
    float width = uWidth * (1.0 + (n - 0.5) * 0.9 * uIrregularity);
    clip.xy += nClip * max(width, 0.35) / uResolution * 2.0 * clip.w;
    gl_Position = clip;
  }
`;

const OUTLINE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uIrregularity;
  varying float vPressure;
  void main() {
    if (uOpacity <= 0.001) discard;
    float alpha = uOpacity * mix(1.0, 0.6 + 0.4 * vPressure, clamp(uIrregularity, 0.0, 1.5));
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function createPencilOutlineMaterial(widthPx = 1.6): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: OUTLINE_VERTEX,
    fragmentShader: OUTLINE_FRAGMENT,
    uniforms: {
      uColor: { value: GRAPHITE },
      uOpacity: { value: 0 },
      uWidth: { value: widthPx },
      uIrregularity: { value: 1 },
      uResolution: { value: new Vector2(1, 1) },
    },
    side: BackSide,
    transparent: true,
    depthWrite: false,
  });
}
