import { BackSide, Color, DoubleSide, ShaderMaterial, Vector2, Vector3 } from "three";

/**
 * Materiały stylu „rysunek ołówkiem na papierze”.
 *
 *  - powierzchnie: papier + miękkie cieniowanie (half-Lambert) + kreskowanie
 *    grafitem w cieniach (linie w przestrzeni ekranu, stały rozstaw w px),
 *  - przekrój: gęste kreskowanie 45° — konwencja rysunku technicznego,
 *  - linie: każdy odcinek rysuje się od początku do końca (atrybut aT),
 *    w kolejności zadanej atrybutem aOrder,
 *  - sylwetki: odwrócona powłoka o stałej grubości w pikselach.
 */

export const PAPER = new Color("#f7f8f6");
export const GRAPHITE = new Color("#2b3038");

const SURFACE_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SURFACE_FRAGMENT = /* glsl */ `
  uniform vec3 uPaper;
  uniform vec3 uGraphite;
  uniform vec3 uLightDir;
  uniform float uShade;      // 0 = czysty papier, 1 = pełne cieniowanie
  uniform float uSection;    // 1 = powierzchnia przekroju (kreskowanie 45°)
  uniform float uSectionReveal;
  uniform float uPixelRatio;
  uniform float uTone;       // jasność bazowa części (różnicowanie tonalne)
  varying vec3 vNormalW;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // Linia kreskowania: 1 na środku linii, 0 między liniami (rozstaw s px, grubość ~1 px).
  float hatch(vec2 px, vec2 dir, float s) {
    float d = abs(fract(dot(px, dir) / s) - 0.5) * s;
    return 1.0 - smoothstep(0.25, 0.95, d);
  }

  void main() {
    vec3 n = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
    float lit = dot(n, normalize(uLightDir)) * 0.5 + 0.5;
    vec2 px = gl_FragCoord.xy / uPixelRatio;

    float tone = mix(1.0, uTone * (0.72 + 0.28 * smoothstep(0.12, 0.95, lit)), uShade);
    float dark = 1.0 - lit;
    float graphite = 0.0;
    graphite += hatch(px, vec2(0.7071, 0.7071), 6.0) * smoothstep(0.42, 0.66, dark) * 0.30;
    graphite += hatch(px, vec2(0.7071, -0.7071), 6.0) * smoothstep(0.62, 0.86, dark) * 0.26;
    graphite *= uShade;

    if (uSection > 0.5) {
      graphite = max(graphite, hatch(px, vec2(0.7071, 0.7071), 5.0) * 0.55 * uSectionReveal);
      tone = min(tone, mix(1.0, 0.96, uSectionReveal));
    }

    // Faktura papieru
    tone -= (hash(floor(px * 0.8)) - 0.5) * 0.03 * uShade;
    float ink = clamp(1.0 - tone + graphite, 0.0, 1.0);
    gl_FragColor = vec4(mix(uPaper, uGraphite, ink), 1.0);
  }
`;

export type SurfaceOptions = { section?: boolean; tone?: number; doubleSided?: boolean };

export function createSurfaceMaterial({ section = false, tone = 1, doubleSided = false }: SurfaceOptions = {}): ShaderMaterial {
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
    },
    ...(doubleSided ? { side: DoubleSide } : {}),
    // Odsunięcie powierzchni w głąb — krawędzie leżące na nich nie migoczą.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

const LINE_VERTEX = /* glsl */ `
  attribute float aT;
  attribute float aOrder;
  attribute float aJitter;
  attribute float aDist;
  varying float vT;
  varying float vOrder;
  varying float vJitter;
  varying float vDist;
  void main() {
    vT = aT;
    vOrder = aOrder;
    vJitter = aJitter;
    vDist = aDist;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LINE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uReveal;   // 0…1 — postęp rysowania całego szkicu
  uniform float uWindow;   // czas rysowania jednego odcinka (ułamek całości)
  uniform float uOpacity;
  uniform float uDash;     // > 0: linia punktowa (osie), długość okresu w mm
  varying float vT;
  varying float vOrder;
  varying float vJitter;
  varying float vDist;
  void main() {
    float progress = clamp((uReveal - vOrder) / uWindow, 0.0, 1.0);
    if (vT > progress) discard;
    if (uDash > 0.0) {
      float f = fract(vDist / uDash);
      // kreska – przerwa – kropka – przerwa
      if ((f > 0.62 && f < 0.72) || f > 0.80) discard;
    }
    gl_FragColor = vec4(uColor, uOpacity * (0.72 + 0.28 * vJitter));
  }
`;

export function createLineMaterial({ opacity = 0.85, dash = 0 }: { opacity?: number; dash?: number } = {}): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: LINE_VERTEX,
    fragmentShader: LINE_FRAGMENT,
    uniforms: {
      uColor: { value: GRAPHITE },
      uReveal: { value: 0 },
      uWindow: { value: 0.16 },
      uOpacity: { value: opacity },
      uDash: { value: dash },
    },
    transparent: true,
    depthWrite: false,
  });
}

const OUTLINE_VERTEX = /* glsl */ `
  uniform float uWidth;
  uniform vec2 uResolution;
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec3 nView = normalize(normalMatrix * normal);
    vec2 nClip = normalize((projectionMatrix * vec4(nView, 0.0)).xy + 1e-6);
    // Przesunięcie w przestrzeni ekranu → stała grubość konturu w pikselach.
    clip.xy += nClip * uWidth / uResolution * 2.0 * clip.w;
    gl_Position = clip;
  }
`;

const OUTLINE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    if (uOpacity <= 0.001) discard;
    gl_FragColor = vec4(uColor, uOpacity);
  }
`;

/** Kontur sylwetki (odwrócona powłoka). `uOpacity` sterowane osią czasu animacji wejścia. */
export function createOutlineMaterial(widthPx = 1.25): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: OUTLINE_VERTEX,
    fragmentShader: OUTLINE_FRAGMENT,
    uniforms: {
      uColor: { value: GRAPHITE },
      uOpacity: { value: 0 },
      uWidth: { value: widthPx },
      uResolution: { value: new Vector2(1, 1) },
    },
    side: BackSide,
    transparent: true,
    depthWrite: false,
  });
}
