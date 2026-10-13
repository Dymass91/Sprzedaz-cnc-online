import type { MetalName } from "@/components/illustrations/metal";

/**
 * Katalog materiałów. Opisy mają charakter ogólny (właściwości grup
 * materiałowych), bez deklaracji dostępności konkretnych gatunków —
 * tę potwierdza się przy wycenie.
 */

export type MaterialId = "aluminium" | "steel" | "stainless" | "brass" | "plastic" | "titanium";

export type Material = {
  id: MaterialId;
  name: string;
  /** Krótki opis na karcie. */
  tagline: string;
  description: string;
  /** Przykładowe gatunki do wyboru w konfiguratorze. */
  grades: string[];
  properties: string[];
  /** Typowe wykończenia dla danego materiału. */
  finishes: FinishId[];
  visual: MetalName;
};

export type FinishId = "raw" | "deburred" | "bead-blasted" | "anodized" | "anodized-black" | "polished" | "zinc" | "black-oxide" | "passivated";

export const finishLabels: Record<FinishId, string> = {
  raw: "Bez obróbki (po frezowaniu)",
  deburred: "Gratowanie krawędzi",
  "bead-blasted": "Piaskowanie",
  anodized: "Anodowanie",
  "anodized-black": "Anodowanie na czarno",
  polished: "Polerowanie",
  zinc: "Cynkowanie",
  "black-oxide": "Oksydowanie (czernienie)",
  passivated: "Pasywacja",
};

export const materials: Material[] = [
  {
    id: "aluminium",
    name: "Aluminium",
    tagline: "Lekkie i wytrzymałe",
    description: "Najczęściej wybierany materiał do obróbki CNC — lekki, dobrze skrawalny i odporny na korozję.",
    grades: ["Aluminium 6082", "Aluminium 7075", "Aluminium 5754", "Aluminium 2017A"],
    properties: ["Niska masa", "Dobra skrawalność", "Możliwość anodowania"],
    finishes: ["raw", "deburred", "bead-blasted", "anodized", "anodized-black"],
    visual: "aluminium",
  },
  {
    id: "steel",
    name: "Stal",
    tagline: "Wytrzymałość i precyzja",
    description: "Stale konstrukcyjne i maszynowe do części przenoszących duże obciążenia.",
    grades: ["Stal S355", "Stal C45", "Stal 42CrMo4"],
    properties: ["Wysoka wytrzymałość", "Możliwość obróbki cieplnej", "Dobra spawalność (wybrane gatunki)"],
    finishes: ["raw", "deburred", "zinc", "black-oxide"],
    visual: "steel",
  },
  {
    id: "stainless",
    name: "Stal nierdzewna",
    tagline: "Odporność na korozję",
    description: "Do zastosowań w wilgotnym środowisku, przemyśle spożywczym i medycznym.",
    grades: ["Stal nierdzewna 1.4301 (304)", "Stal nierdzewna 1.4404 (316L)", "Stal nierdzewna 1.4305 (303)"],
    properties: ["Odporność na korozję", "Estetyczna powierzchnia", "Higieniczność"],
    finishes: ["raw", "deburred", "bead-blasted", "polished", "passivated"],
    visual: "stainless",
  },
  {
    id: "brass",
    name: "Mosiądz",
    tagline: "Doskonała skrawalność",
    description: "Świetnie się obrabia, dobrze przewodzi prąd i ciepło. Idealny na tuleje i złączki.",
    grades: ["Mosiądz CuZn39Pb3 (MO58)", "Mosiądz CuZn37"],
    properties: ["Bardzo dobra skrawalność", "Przewodność", "Niski współczynnik tarcia"],
    finishes: ["raw", "deburred", "polished"],
    visual: "brass",
  },
  {
    id: "plastic",
    name: "Tworzywa sztuczne",
    tagline: "Lekkie i uniwersalne",
    description: "Tworzywa techniczne do prototypów, elementów ślizgowych i izolacyjnych.",
    grades: ["POM-C", "PA6", "PEEK", "PTFE", "PMMA"],
    properties: ["Niska masa", "Izolacyjność", "Odporność chemiczna (wybrane)"],
    finishes: ["raw", "deburred"],
    visual: "plastic",
  },
  {
    id: "titanium",
    name: "Tytan",
    tagline: "Ekstremalna wytrzymałość",
    description: "Najlepszy stosunek wytrzymałości do masy — lotnictwo, medycyna, motorsport.",
    grades: ["Tytan Grade 2", "Tytan Grade 5 (Ti6Al4V)"],
    properties: ["Wysoka wytrzymałość właściwa", "Biokompatybilność", "Odporność na korozję"],
    finishes: ["raw", "deburred", "bead-blasted", "polished"],
    visual: "titanium",
  },
];

export function getMaterial(id: MaterialId): Material {
  return materials.find((m) => m.id === id) ?? materials[0];
}
