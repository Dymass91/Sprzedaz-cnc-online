/**
 * Walidacja plików CAD po stronie przeglądarki. Ta sama lista formatów
 * powinna zostać użyta w walidacji po stronie serwera, gdy powstanie upload.
 */

export const ACCEPTED_CAD_EXTENSIONS = ["step", "stp", "stl", "iges", "igs", "dxf", "obj"] as const;
export type CadExtension = (typeof ACCEPTED_CAD_EXTENSIONS)[number];

export const MAX_CAD_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const MAX_CAD_FILES = 10;

/** Wartość atrybutu `accept` dla <input type="file">. */
export const CAD_ACCEPT_ATTRIBUTE = ACCEPTED_CAD_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export type CadFileValidation = { ok: true; extension: CadExtension } | { ok: false; reason: string };

export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

function isAcceptedExtension(ext: string): ext is CadExtension {
  return (ACCEPTED_CAD_EXTENSIONS as readonly string[]).includes(ext);
}

export function validateCadFile(file: Pick<File, "name" | "size">): CadFileValidation {
  const ext = getExtension(file.name);
  if (!isAcceptedExtension(ext)) {
    return {
      ok: false,
      reason: `Nieobsługiwany format${ext ? ` .${ext}` : ""}. Akceptujemy: ${ACCEPTED_CAD_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")}.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, reason: "Plik jest pusty." };
  }
  if (file.size > MAX_CAD_FILE_SIZE) {
    return { ok: false, reason: `Plik jest za duży (${formatFileSize(file.size)}). Maksymalny rozmiar to 50 MB.` };
  }
  return { ok: true, extension: ext };
}

const sizeFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

/** Czy format zawiera bryłę 3D (STEP/IGES/STL/OBJ), czy rysunek 2D (DXF). */
export function isSolidModel(ext: CadExtension): boolean {
  return ext !== "dxf";
}
