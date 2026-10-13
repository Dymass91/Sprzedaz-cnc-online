"use client";

import { useId, useState, type DragEvent } from "react";
import { cn } from "@/lib/cn";
import { ACCEPTED_CAD_EXTENSIONS, CAD_ACCEPT_ATTRIBUTE, formatFileSize } from "@/features/cad-files/validation";
import { AlertIcon, CloseIcon, FileIcon, UploadCloudIcon } from "@/components/ui/icons";
import { useConfigurator } from "../ConfiguratorContext";

/**
 * Pole przesyłania plików CAD: przeciągnij i upuść lub wybór z dysku.
 * Pliki są walidowane lokalnie (format, rozmiar) i trzymane w pamięci
 * przeglądarki — nic nie jest jeszcze wysyłane na serwer.
 */
export function FileDropzone() {
  const { state, addFiles, removeFile, clearRejected } = useConfigurator();
  const [dragging, setDragging] = useState(false);
  const inputId = useId();
  const hintId = useId();

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={inputId}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={onDrop}
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
        <UploadCloudIcon size={44} strokeWidth={1.2} className={cn("transition-transform duration-300", dragging ? "-translate-y-1 text-accent" : "text-ink-800")} />
        <span className="mt-4 text-[15px] font-semibold text-ink-900">{dragging ? "Upuść, aby dodać" : "Przeciągnij plik tutaj"}</span>
        <span className="mt-1 text-[13px] text-ink-500">lub kliknij, aby wybrać</span>
        <span id={hintId} className="mt-4 text-[11.5px] leading-relaxed text-ink-500">
          {ACCEPTED_CAD_EXTENSIONS.filter((e) => e !== "igs")
            .map((e) => e.toUpperCase())
            .join(", ")}
          <br />
          Maks. 50 MB
        </span>
        <input
          id={inputId}
          type="file"
          multiple
          accept={CAD_ACCEPT_ATTRIBUTE}
          aria-describedby={hintId}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(Array.from(e.target.files));
            e.target.value = "";
          }}
        />
      </label>

      {state.rejected.length > 0 ? (
        <div role="alert" className="relative rounded-md border border-danger/30 bg-danger/5 p-3 pr-9 text-[12.5px] text-ink-800">
          <p className="flex items-center gap-1.5 font-semibold text-danger">
            <AlertIcon size={15} /> Nie dodano {state.rejected.length === 1 ? "pliku" : "plików"}
          </p>
          <ul className="mt-1.5 space-y-1">
            {state.rejected.map((r, i) => (
              <li key={`${r.name}-${i}`}>
                <span className="font-medium break-all">{r.name}</span> — {r.reason}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={clearRejected}
            className="absolute top-2 right-2 grid size-6 place-items-center rounded-xs text-ink-500 hover:bg-danger/10"
            aria-label="Zamknij komunikat"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      ) : null}

      {state.files.length > 0 ? (
        <ul aria-label="Wybrane pliki" className="flex flex-col gap-2">
          {state.files.map(({ id, file, extension }) => (
            <li
              key={id}
              className="flex animate-fade-up items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-3 shadow-card"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-sm border border-line text-ink-800">
                <FileIcon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink-900" title={file.name}>
                  {file.name}
                </span>
                <span className="block text-[11.5px] text-ink-500">
                  {extension.toUpperCase()} · {formatFileSize(file.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(id)}
                className="grid size-8 shrink-0 place-items-center rounded-sm text-ink-500 transition-colors hover:bg-surface-sunken hover:text-ink-900"
                aria-label={`Usuń plik ${file.name}`}
              >
                <CloseIcon size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong px-3.5 py-3 text-[12px] text-ink-500">
          Nie dodano jeszcze plików. Możesz dodać do 10 plików w jednym zapytaniu.
        </p>
      )}
    </div>
  );
}
