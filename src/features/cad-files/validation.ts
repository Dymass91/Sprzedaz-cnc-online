import {
  MAX_MODEL_FILE_SIZE,
  PLANNED_MODEL_FORMATS,
  SUPPORTED_MODEL_FORMATS,
  type SupportedModelExtension,
} from "./config";

/**
 * Wstępna walidacja pliku (nazwa, rozmiar). Poprawność zawartości sprawdza
 * dopiero parser — rozszerzenie .stl nie gwarantuje, że to prawdziwy STL.
 */

export const MODEL_ACCEPT_ATTRIBUTE = SUPPORTED_MODEL_FORMATS.map((f) => `.${f.extension}`).join(",");
export const SUPPORTED_FORMATS_LABEL = SUPPORTED_MODEL_FORMATS.map((f) => f.label).join(", ");

export type ModelFileValidation = { ok: true; extension: SupportedModelExtension } | { ok: false; reason: string };

export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

function isSupported(ext: string): ext is SupportedModelExtension {
  return SUPPORTED_MODEL_FORMATS.some((f) => f.extension === ext);
}

export function validateModelFile(file: Pick<File, "name" | "size">): ModelFileValidation {
  const ext = getExtension(file.name);
  if (!isSupported(ext)) {
    if ((PLANNED_MODEL_FORMATS as readonly string[]).includes(ext)) {
      return {
        ok: false,
        reason: `Format .${ext.toUpperCase()} nie jest jeszcze obsługiwany. Wyeksportuj model do STL w swoim programie CAD.`,
      };
    }
    return { ok: false, reason: `Nieobsługiwany plik${ext ? ` .${ext}` : ""}. Obecnie akceptujemy wyłącznie ${SUPPORTED_FORMATS_LABEL}.` };
  }
  if (file.size === 0) return { ok: false, reason: "Plik jest pusty." };
  if (file.size > MAX_MODEL_FILE_SIZE) {
    return {
      ok: false,
      reason: `Plik jest za duży (${formatFileSize(file.size)}). Maksymalny rozmiar to ${formatFileSize(MAX_MODEL_FILE_SIZE)}.`,
    };
  }
  return { ok: true, extension: ext };
}

const sizeFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}
