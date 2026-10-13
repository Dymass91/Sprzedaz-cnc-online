import { MAX_MODEL_TRIANGLES } from "../config";

/**
 * Parser STL (binarny i ASCII) bez zależności od Three.js — działa w Web Workerze
 * i w testach. Zwraca płaską tablicę wierzchołków: 9 liczb (3 wierzchołki) na trójkąt.
 */

export type StlFormat = "binary" | "ascii";

export type ParsedStl = {
  format: StlFormat;
  positions: Float32Array;
  triangleCount: number;
  /** Nazwa bryły z nagłówka ASCII („solid nazwa”), jeśli występuje. */
  solidName: string | null;
};

export class StlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StlParseError";
  }
}

const BINARY_HEADER = 80;
const BINARY_TRIANGLE = 50;

function asBinaryCandidate(view: DataView): number | null {
  if (view.byteLength < BINARY_HEADER + 4) return null;
  const count = view.getUint32(BINARY_HEADER, true);
  const expected = BINARY_HEADER + 4 + count * BINARY_TRIANGLE;
  // Niektóre eksportery dopisują kilka bajtów na końcu — tolerujemy niewielką nadwyżkę.
  if (count > 0 && expected <= view.byteLength && view.byteLength - expected < BINARY_TRIANGLE) return count;
  return null;
}

function looksLikeAscii(bytes: Uint8Array): boolean {
  const head = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.length, 512))).trimStart().toLowerCase();
  return head.startsWith("solid");
}

function parseBinary(view: DataView, count: number): ParsedStl {
  if (count > MAX_MODEL_TRIANGLES) {
    throw new StlParseError(`Model ma ${count.toLocaleString("pl-PL")} trójkątów — to więcej niż obsługiwany limit.`);
  }
  const positions = new Float32Array(count * 9);
  let offset = BINARY_HEADER + 4;
  for (let t = 0; t < count; t++) {
    offset += 12; // wektor normalny — liczymy własne normalne
    for (let k = 0; k < 9; k++) {
      const value = view.getFloat32(offset, true);
      if (!Number.isFinite(value)) throw new StlParseError("Plik zawiera nieprawidłowe współrzędne (NaN lub nieskończoność).");
      positions[t * 9 + k] = value;
      offset += 4;
    }
    offset += 2; // attribute byte count
  }
  return { format: "binary", positions, triangleCount: count, solidName: null };
}

const VERTEX_RE = /vertex\s+([-+]?[\d.]+(?:[eE][-+]?\d+)?)\s+([-+]?[\d.]+(?:[eE][-+]?\d+)?)\s+([-+]?[\d.]+(?:[eE][-+]?\d+)?)/g;

function parseAscii(bytes: Uint8Array): ParsedStl {
  const text = new TextDecoder().decode(bytes);
  const nameMatch = /^\s*solid[ \t]*([^\r\n]*)/i.exec(text);
  const values: number[] = [];
  VERTEX_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = VERTEX_RE.exec(text)) !== null) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    const z = Number(match[3]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      throw new StlParseError("Plik zawiera nieprawidłowe współrzędne wierzchołków.");
    }
    values.push(x, y, z);
    if (values.length / 9 > MAX_MODEL_TRIANGLES) throw new StlParseError("Model przekracza obsługiwany limit trójkątów.");
  }
  if (values.length === 0) throw new StlParseError("Nie znaleziono żadnych trójkątów — plik STL jest pusty lub uszkodzony.");
  if (values.length % 9 !== 0) throw new StlParseError("Niekompletne trójkąty w pliku STL (ASCII) — plik jest uszkodzony.");
  return {
    format: "ascii",
    positions: Float32Array.from(values),
    triangleCount: values.length / 9,
    solidName: nameMatch?.[1]?.trim() || null,
  };
}

export function parseStl(buffer: ArrayBuffer): ParsedStl {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 15) throw new StlParseError("Plik jest zbyt mały, aby był poprawnym STL.");

  // Kolejność ma znaczenie: binarne pliki też potrafią zaczynać się od „solid”.
  const binaryCount = asBinaryCandidate(view);
  if (binaryCount !== null) return parseBinary(view, binaryCount);
  if (looksLikeAscii(bytes)) return parseAscii(bytes);
  throw new StlParseError("Plik nie jest poprawnym STL (ani binarnym, ani tekstowym).");
}
