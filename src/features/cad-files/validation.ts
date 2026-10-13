import { MAX_MODEL_FILE_SIZE, PLANNED_MODEL_FORMATS, SUPPORTED_MODEL_FORMATS, type ModelFormat } from "./config";

/**
 * Walidacja plików. Rozszerzenie decyduje tylko o wstępnym limicie —
 * format jest potwierdzany po zawartości (`sniffModelFormat`), a ostatecznie
 * przez parser STL lub silnik CAD.
 */

export const MODEL_ACCEPT_ATTRIBUTE = SUPPORTED_MODEL_FORMATS.map((f) => `.${f.extension}`).join(",");
export const SUPPORTED_FORMATS_LABEL = "STEP, STP, STL";

export type ModelFileValidation = { ok: true; format: ModelFormat } | { ok: false; reason: string };

export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function validateModelFile(file: Pick<File, "name" | "size">): ModelFileValidation {
  const ext = getExtension(file.name);
  const supported = SUPPORTED_MODEL_FORMATS.find((f) => f.extension === ext);
  if (!supported) {
    if ((PLANNED_MODEL_FORMATS as readonly string[]).includes(ext)) {
      return {
        ok: false,
        reason: `Format .${ext.toUpperCase()} nie jest jeszcze obsługiwany. Wyeksportuj model do STEP lub STL w swoim programie CAD.`,
      };
    }
    return { ok: false, reason: `Nieobsługiwany plik${ext ? ` .${ext}` : ""}. Akceptujemy: ${SUPPORTED_FORMATS_LABEL}.` };
  }
  if (file.size === 0) return { ok: false, reason: "Plik jest pusty." };
  const limit = MAX_MODEL_FILE_SIZE[supported.format];
  if (file.size > limit) {
    return {
      ok: false,
      reason: `Plik jest za duży (${formatFileSize(file.size)}). Maksymalny rozmiar dla ${supported.label} to ${formatFileSize(limit)}.`,
    };
  }
  return { ok: true, format: supported.format };
}

/**
 * Rozpoznanie formatu po pierwszych bajtach pliku.
 * STEP (ISO 10303-21) zaczyna się od „ISO-10303-21;”. STL binarny nie ma
 * sygnatury — jego poprawność sprawdza parser (zgodność liczby trójkątów).
 */
export function sniffModelFormat(head: Uint8Array): "step" | "step-xml" | "unknown" {
  let text = new TextDecoder("latin1").decode(head.subarray(0, 512));
  if (text.charCodeAt(0) === 0xfeff || text.startsWith("ï»¿")) text = text.replace(/^(﻿|ï»¿)/, "");
  text = text.trimStart();
  if (text.startsWith("ISO-10303-21;")) return "step";
  if (text.startsWith("<?xml") && /10303-28|iso_10303_28/i.test(text)) return "step-xml";
  return "unknown";
}

const sizeFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}
