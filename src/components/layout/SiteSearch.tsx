"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { materials } from "@/features/materials/data";
import { SearchIcon, CloseIcon, ArrowRightIcon } from "@/components/ui/icons";

type SearchEntry = { title: string; description: string; href: string; keywords?: string };

/** Lokalny indeks treści strony głównej. Docelowo: wyszukiwarka po bazie wiedzy. */
const entries: SearchEntry[] = [
  { title: "Konfigurator CNC", description: "Prześlij plik i ustaw parametry części", href: "#konfigurator", keywords: "wycena cena plik step stl upload" },
  { title: "Jak to działa?", description: "Zamówienie w 4 prostych krokach", href: "#jak-to-dziala", keywords: "proces kroki zamówienie" },
  { title: "Frezowanie CNC", description: "Elementy płaskie i bryłowe, obróbka 3- i 5-osiowa", href: "#uslugi", keywords: "frez usługa" },
  { title: "Toczenie CNC", description: "Wałki, tuleje, pierścienie i elementy obrotowe", href: "#uslugi", keywords: "tokarka usługa" },
  { title: "Materiały", description: "Aluminium, stal, stal nierdzewna, mosiądz, tworzywa, tytan", href: "#materialy" },
  ...materials.map((m) => ({
    title: m.name,
    description: m.tagline,
    href: "#materialy",
    keywords: m.grades.join(" "),
  })),
  { title: "Przykładowe części", description: "Korpusy, uchwyty, koła zębate, tuleje, kołnierze", href: "#realizacje", keywords: "realizacje galeria" },
  { title: "Dlaczego VEXOR", description: "Jakość, sprawna realizacja, wysyłka w całej Polsce", href: "#dlaczego-warto" },
  { title: "Newsletter", description: "Nowości, porady i inspiracje", href: "#kontakt" },
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l");

export function SiteSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return entries.slice(0, 6);
    return entries.filter((e) => normalize(`${e.title} ${e.description} ${e.keywords ?? ""}`).includes(q));
  }, [query]);

  return (
    <dialog
      ref={dialogRef}
      onClose={() => {
        setQuery("");
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label="Wyszukiwarka"
      className="m-auto mt-[12vh] w-[min(640px,calc(100vw-32px))] rounded-lg border border-line bg-surface p-0 text-ink-900 shadow-raised backdrop:bg-ink-950/30 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <SearchIcon className="shrink-0 text-ink-400" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj: materiał, usługa, format pliku…"
          aria-label="Szukana fraza"
          className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-ink-400"
        />
        <button
          type="button"
          onClick={onClose}
          className="grid size-9 shrink-0 place-items-center rounded-sm text-ink-500 hover:bg-surface-sunken"
          aria-label="Zamknij wyszukiwarkę"
        >
          <CloseIcon size={18} />
        </button>
      </div>
      <ul className="max-h-[50vh] overflow-y-auto p-2" aria-live="polite">
        {results.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-ink-500">Brak wyników dla „{query}”.</li>
        ) : (
          results.map((r) => (
            <li key={`${r.title}-${r.href}`}>
              <a
                href={r.href}
                onClick={onClose}
                className="group flex items-center justify-between gap-4 rounded-sm px-3 py-2.5 hover:bg-surface-muted focus-visible:bg-surface-muted"
              >
                <span>
                  <span className="block text-sm font-semibold">{r.title}</span>
                  <span className="block text-[13px] text-ink-500">{r.description}</span>
                </span>
                <ArrowRightIcon size={16} className="shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-700" />
              </a>
            </li>
          ))
        )}
      </ul>
    </dialog>
  );
}
