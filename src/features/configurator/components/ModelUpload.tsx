"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/cn";
import { MAX_MODEL_FILE_SIZE } from "@/features/cad-files/config";
import type { LoadStage } from "@/features/cad-files/loadModelFile";
import { formatFileSize, MODEL_ACCEPT_ATTRIBUTE } from "@/features/cad-files/validation";
import { AlertIcon, CloseIcon, FileIcon, UploadCloudIcon } from "@/components/ui/icons";
import { useConfigurator } from "../ConfiguratorContext";

const stageLabels: Record<LoadStage, string> = {
  "reading-file": "odczyt pliku…",
  engine: "ładowanie silnika CAD (jednorazowo, ok. 8 MB)…",
  reading: "odczyt geometrii B-Rep i triangulacja…",
  analyzing: "analiza geometrii…",
};

const encodingLabel = { binary: "STL binarny", ascii: "STL ASCII", "iso-10303-21": "STEP (ISO 10303-21)" } as const;

/**
 * Pole przesyłania modelu: STEP/STP (analiza silnikiem OCCT w przeglądarce)
 * lub STL. Plik jest przetwarzany lokalnie — nic nie trafia na serwer.
 */
export function ModelUpload() {
  const { state, loadFile, removeModel, retry } = useConfigurator();
  const [dragging, setDragging] = useState(false);
  const [multiNotice, setMultiNotice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const hintId = useId();
  const slot = state.model;
  const hasFile = slot.status === "ready" || slot.status === "loading";

  const accept = (files: FileList | null) => {
    if (!files?.length) return;
    setMultiNotice(files.length > 1);
    loadFile(files[0]);
  };

  const dragHandlers = {
    onDragEnter: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (e: DragEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setDragging(false);
      accept(e.dataTransfer.files);
    },
  };

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={MODEL_ACCEPT_ATTRIBUTE}
      aria-describedby={hintId}
      className="sr-only"
      onChange={(e) => {
        accept(e.target.files);
        e.target.value = "";
      }}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {hasFile ? (
        <div
          {...dragHandlers}
          className={cn(
            "rounded-lg border bg-surface p-3.5 shadow-card transition-colors",
            dragging ? "border-accent bg-accent-soft/60" : "border-line",
          )}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-sm border border-line text-ink-800">
              {slot.status === "loading" ? (
                <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-ink-800 motion-reduce:animate-none" />
              ) : (
                <FileIcon size={20} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-ink-900" title={slot.status === "ready" ? slot.model.fileName : slot.fileName}>
                {slot.status === "ready" ? slot.model.fileName : slot.fileName}
              </span>
              <span className="block text-[11.5px] text-ink-500" role="status" aria-live="polite">
                {slot.status === "loading"
                  ? `${formatFileSize(slot.fileSize)} · ${stageLabels[slot.stage]}`
                  : `${encodingLabel[slot.model.encoding]} · ${formatFileSize(slot.model.fileSize)}`}
              </span>
            </span>
            <button
              type="button"
              onClick={removeModel}
              className="grid size-8 shrink-0 place-items-center rounded-sm text-ink-500 transition-colors hover:bg-surface-sunken hover:text-ink-900"
              aria-label={slot.status === "loading" ? "Anuluj analizę" : "Usuń model"}
              title={slot.status === "loading" ? "Anuluj" : "Usuń"}
            >
              <CloseIcon size={16} />
            </button>
          </div>
          {slot.status === "loading" ? (
            <button
              type="button"
              onClick={removeModel}
              className="mt-3 w-full rounded-sm border border-line-strong py-2 text-[12.5px] font-medium text-ink-700 transition-colors hover:border-ink-400 hover:text-ink-900"
            >
              Anuluj analizę
            </button>
          ) : (
            <label
              htmlFor={inputId}
              className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-line-strong py-2 text-[12.5px] font-medium text-ink-700 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 hover:border-ink-400 hover:text-ink-900"
            >
              <UploadCloudIcon size={16} />
              {dragging ? "Upuść, aby zastąpić model" : "Zastąp innym plikiem"}
              {input}
            </label>
          )}
          <span id={hintId} className="sr-only">
            Plik STEP, STP lub STL.
          </span>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          {...dragHandlers}
          className={cn(
            "group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border bg-surface/80 px-5 py-8 text-center transition-[border-color,background-color,box-shadow] duration-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 hover:border-ink-300 lg:min-h-[250px]",
            dragging ? "border-accent bg-accent-soft/60 ring-4 ring-accent/10" : "border-line",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-2 rounded-md border border-dashed transition-colors",
              dragging ? "border-accent/50" : "border-transparent group-hover:border-line-strong",
            )}
          />
          <UploadCloudIcon
            size={44}
            strokeWidth={1.2}
            className={cn("transition-transform duration-300", dragging ? "-translate-y-1 text-accent" : "text-ink-800")}
          />
          <span className="mt-4 text-[15px] font-semibold text-ink-900">{dragging ? "Upuść, aby wczytać" : "Przeciągnij plik tutaj"}</span>
          <span className="mt-1 text-[13px] text-ink-500">lub kliknij, aby wybrać</span>
          <span id={hintId} className="mt-4 text-[11.5px] leading-relaxed text-ink-500">
            STEP, STP (maks. {formatFileSize(MAX_MODEL_FILE_SIZE.step)}) · STL (maks. {formatFileSize(MAX_MODEL_FILE_SIZE.stl)})
            <br />
            Plik jest analizowany w Twojej przeglądarce
          </span>
          {input}
        </label>
      )}

      {slot.status === "error" ? (
        <div role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-[12.5px] text-ink-800">
          <p className="flex gap-2">
            <AlertIcon size={16} className="mt-px shrink-0 text-danger" />
            <span>
              {slot.fileName ? <span className="font-semibold break-all">{slot.fileName}: </span> : null}
              {slot.message}
            </span>
          </p>
          {slot.retryable ? (
            <button
              type="button"
              onClick={retry}
              className="mt-2.5 ml-6 rounded-sm border border-danger/30 bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-900 hover:border-danger/60"
            >
              Ponów analizę
            </button>
          ) : null}
        </div>
      ) : null}

      {multiNotice && hasFile ? (
        <p className="text-[11.5px] text-ink-500">Wczytano pierwszy z upuszczonych plików — konfigurator obsługuje jeden model na zapytanie.</p>
      ) : null}
    </div>
  );
}
