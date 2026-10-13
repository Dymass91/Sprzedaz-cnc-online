/**
 * Jednostki długości. Format STL nie zapisuje jednostek — użytkownik musi
 * wskazać, w czym przygotował model. Wszystkie wymiary prezentujemy w mm.
 */

export type LengthUnit = "mm" | "cm" | "m" | "in";

export const lengthUnits: { id: LengthUnit; label: string; toMm: number }[] = [
  { id: "mm", label: "Milimetry (mm)", toMm: 1 },
  { id: "cm", label: "Centymetry (cm)", toMm: 10 },
  { id: "m", label: "Metry (m)", toMm: 1000 },
  { id: "in", label: "Cale (in)", toMm: 25.4 },
];

export function unitToMm(unit: LengthUnit): number {
  return lengthUnits.find((u) => u.id === unit)?.toMm ?? 1;
}

/**
 * Podpowiedź na podstawie największego wymiaru w jednostkach pliku.
 * To tylko heurystyka — nie zmienia wyboru użytkownika.
 */
export function unitHint(maxRawDimension: number, unit: LengthUnit): string | null {
  const mm = maxRawDimension * unitToMm(unit);
  if (mm < 1) return "Część ma mniej niż 1 mm — model może być zapisany w metrach lub centymetrach.";
  if (mm > 3000) return "Część ma ponad 3 m — sprawdź, czy model nie jest zapisany w mniejszych jednostkach (np. mm zamiast m).";
  return null;
}

const mmFormatter = new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const intFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 });

export function formatMm(value: number): string {
  return `${mmFormatter.format(value)} mm`;
}

/** Objętość: mm³ dla małych części, cm³ dla większych. */
export function formatVolumeMm3(value: number): string {
  if (value < 0.01) return "< 0,01 mm³";
  if (value >= 1000) return `${mmFormatter.format(value / 1000)} cm³`;
  return `${mmFormatter.format(value)} mm³`;
}

export function formatAreaMm2(value: number): string {
  if (value < 0.01) return "< 0,01 mm²";
  if (value >= 100) return `${mmFormatter.format(value / 100)} cm²`;
  return `${mmFormatter.format(value)} mm²`;
}

/** Dodaje „≈” do wartości przybliżonej (pomija wartości typu „< 0,01”). */
export function approx(text: string): string {
  return text.startsWith("<") ? text : `≈ ${text}`;
}

export function formatCount(value: number): string {
  return intFormatter.format(value);
}
