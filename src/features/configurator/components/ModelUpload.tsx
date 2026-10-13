"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/cn";
import { MAX_MODEL_FILE_SIZE } from "@/features/cad-files/config";
import { formatFileSize, MODEL_ACCEPT_ATTRIBUTE } from "@/features/cad-files/validation";
import { AlertIcon, CloseIcon, FileIcon, UploadCloudIcon } from "@/components/ui/icons";
import { useConfigurator } from "../ConfiguratorContext";

/**
 * Pole przesyłania modelu STL: przeciągnij i upuść lub wybór z dysku.
 * Plik jest analizowany lokalnie w przeglądarce — nic nie trafia na serwer.
 */
export function ModelUpload() {
  const { state, loadFile, removeModel } = useConfigurator();
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

  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files);
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
    onDrop,
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
              <span className="block text-[11.5px] text-ink-500" aria-live="polite">
                {slot.status === "loading"
                  ? `${formatFileSize(slot.fileSize)} · analiza geometrii…`
                  : `STL ${slot.model.format === "binary" ? "binarny" : "ASCII"} · ${formatFileSize(slot.model.fileSize)}`}
              </span>
            </span>
            <button
              type="button"
              onClick={removeModel}
              className="grid size-8 shrink-0 place-items-center rounded-sm text-ink-500 transition-colors hover:bg-surface-sunken hover:text-ink-900"
              aria-label={slot.status === "loading" ? "Przerwij wczytywanie" : "Usuń model"}
            >
              <CloseIcon size={16} />
            </button>
          </div>
          <label
            htmlFor={inputId}
            className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-line-strong py-2 text-[12.5px] font-medium text-ink-700 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 hover:border-ink-400 hover:text-ink-900"
          >
            <UploadCloudIcon size={16} />
            {dragging ? "Upuść, aby zastąpić model" : "Zastąp innym plikiem STL"}
            {input}
          </label>
          <span id={hintId} className="sr-only">
            Plik STL, maksymalnie {formatFileSize(MAX_MODEL_FILE_SIZE)}.
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
          <span className="mt-4 text-[15px] font-semibold text-ink-900">{dragging ? "Upuść, aby wczytać" : "Przeciągnij plik STL tutaj"}</span>
          <span className="mt-1 text-[13px] text-ink-500">lub kliknij, aby wybrać</span>
          <span id={hintId} className="mt-4 text-[11.5px] leading-relaxed text-ink-500">
            STL (binarny lub ASCII) · maks. {formatFileSize(MAX_MODEL_FILE_SIZE)}
            <br />
            STEP i inne formaty CAD — w przygotowaniu
          </span>
          {input}
        </label>
      )}

      {slot.status === "error" ? (
        <div role="alert" className="flex gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-[12.5px] text-ink-800">
          <AlertIcon size={16} className="mt-px shrink-0 text-danger" />
          <p>
            {slot.fileName ? <span className="font-semibold break-all">{slot.fileName}: </span> : null}
            {slot.message}
          </p>
        </div>
      ) : null}

      {multiNotice && hasFile ? (
        <p className="text-[11.5px] text-ink-500">Wczytano pierwszy z upuszczonych plików — konfigurator obsługuje jeden model na zapytanie.</p>
      ) : null}
    </div>
  );
}
