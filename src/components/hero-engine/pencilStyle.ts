/**
 * Styl renderowania silnika w hero.
 *  - "pencil" — szkic grafitowym ołówkiem (domyślny),
 *  - "cad"    — techniczny rysunek CAD (punkt odniesienia).
 *
 * Parametry ołówka to wielkości bezwymiarowe; 1 = wartość domyślna.
 * „Bardziej ołówkowo” → zwiększ `graphiteStrength` i `lineIrregularity`;
 * „kreskowanie za ciemne” → zmniejsz `graphiteStrength` lub `hatchingDensity`.
 */

export type RenderStyle = "pencil" | "cad";

export type PencilParams = {
  /** Siła konturów: grubość i nasycenie sylwetek oraz krawędzi (0–2). */
  outlineStrength: number;
  /** Siła grafitu: ciemność cieniowania i kreskowania (0–2). */
  graphiteStrength: number;
  /** Gęstość kreskowania: więcej kresek na milimetr (0,5–2). */
  hatchingDensity: number;
  /** Widoczność faktury papieru (0–2). */
  paperTextureStrength: number;
  /** Nieregularność linii: zmienność nacisku, grubości i przerwy w kreskach (0–2). */
  lineIrregularity: number;
};

export const DEFAULT_PENCIL_PARAMS: PencilParams = {
  outlineStrength: 1,
  graphiteStrength: 1,
  hatchingDensity: 1,
  paperTextureStrength: 1,
  lineIrregularity: 1,
};

export const DEFAULT_RENDER_STYLE: RenderStyle = "pencil";
