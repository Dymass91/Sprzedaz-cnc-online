"use client";

import { useId } from "react";
import { CrosshairIcon, PauseIcon, PlayIcon } from "@/components/ui/icons";

export const SPEED_RANGE = { min: 6, max: 60, default: 24 } as const;

type EngineControlsProps = {
  playing: boolean;
  speedRpm: number;
  onToggle: () => void;
  onSpeedChange: (rpm: number) => void;
  onResetCamera: () => void;
};

/** Dyskretny pasek sterowania animacją (prawy dolny róg wizualizacji). */
export function EngineControls({ playing, speedRpm, onToggle, onSpeedChange, onResetCamera }: EngineControlsProps) {
  const sliderId = useId();
  const button =
    "grid size-8 place-items-center rounded-full text-ink-800 transition-colors hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-accent";
  return (
    <div
      role="group"
      aria-label="Sterowanie animacją silnika"
      className="flex items-center gap-1 rounded-full border border-line bg-surface/90 py-1 pr-3 pl-1 shadow-card backdrop-blur-sm"
    >
      <button type="button" onClick={onToggle} className={button} aria-label={playing ? "Zatrzymaj animację" : "Wznów animację"} title={playing ? "Pauza" : "Odtwórz"}>
        {playing ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
      </button>
      <button type="button" onClick={onResetCamera} className={button} aria-label="Przywróć początkowe ustawienie kamery" title="Reset widoku">
        <CrosshairIcon size={15} />
      </button>
      <label htmlFor={sliderId} className="ml-1 hidden text-[11px] text-ink-500 sm:block">
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
        className="h-1 w-20 cursor-pointer accent-[var(--color-ink-800)] sm:w-24"
      />
    </div>
  );
}
