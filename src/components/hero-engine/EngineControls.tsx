"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { CrosshairIcon, PauseIcon, PlayIcon } from "@/components/ui/icons";
import type { RenderStyle } from "./pencilStyle";

export const SPEED_RANGE = { min: 6, max: 60, default: 24 } as const;

type EngineControlsProps = {
  playing: boolean;
  speedRpm: number;
  renderStyle: RenderStyle;
  onToggle: () => void;
  onSpeedChange: (rpm: number) => void;
  onResetCamera: () => void;
  onRenderStyleChange: (style: RenderStyle) => void;
};

const styles: { id: RenderStyle; label: string; title: string }[] = [
  { id: "pencil", label: "Ołówek", title: "Szkic grafitowym ołówkiem" },
  { id: "cad", label: "CAD", title: "Rysunek techniczny CAD" },
];

/** Dyskretny pasek sterowania animacją (prawy dolny róg wizualizacji). */
export function EngineControls({ playing, speedRpm, renderStyle, onToggle, onSpeedChange, onResetCamera, onRenderStyleChange }: EngineControlsProps) {
  const sliderId = useId();
  const button =
    "grid size-8 place-items-center rounded-full text-ink-800 transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-accent";
  return (
    <div
      role="group"
      aria-label="Sterowanie animacją silnika"
      className="flex items-center gap-1 rounded-full border border-line bg-surface/90 py-1 pr-1 pl-1 shadow-card backdrop-blur-sm sm:pr-3"
    >
      <button type="button" onClick={onToggle} className={button} aria-label={playing ? "Zatrzymaj animację" : "Wznów animację"} title={playing ? "Pauza" : "Odtwórz"}>
        {playing ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
      </button>
      <button type="button" onClick={onResetCamera} className={button} aria-label="Przywróć początkowe ustawienie kamery" title="Reset widoku">
        <CrosshairIcon size={15} />
      </button>
      <div role="radiogroup" aria-label="Styl rysunku" className="mx-1 flex rounded-full bg-surface-sunken p-0.5">
        {styles.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={renderStyle === s.id}
            title={s.title}
            onClick={() => onRenderStyleChange(s.id)}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-colors",
              renderStyle === s.id ? "bg-surface text-ink-900 shadow-card" : "text-ink-500 hover:text-ink-800",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <label htmlFor={sliderId} className="sr-only">
        Obroty
      </label>
      <input
        id={sliderId}
        type="range"
        min={SPEED_RANGE.min}
        max={SPEED_RANGE.max}
        step={1}
        value={speedRpm}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        aria-valuetext={`${speedRpm} obrotów na minutę`}
        title="Obroty"
        className="hidden h-1 w-20 cursor-pointer accent-[var(--color-ink-800)] sm:block"
      />
    </div>
  );
}
