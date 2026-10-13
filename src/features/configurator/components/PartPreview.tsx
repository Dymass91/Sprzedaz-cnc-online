"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { AnimatedDrawing, EngineeringGrid, drawProps } from "@/components/engineering";
import { IsoBracket } from "@/components/illustrations/parts/IsoBracket";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { CrosshairIcon, ZoomInIcon, ZoomOutIcon } from "@/components/ui/icons";
import { getMaterial } from "@/features/materials/data";
import { isBrowserRenderable, viewerModes } from "@/features/viewer-3d/types";
import { useConfigurator } from "../ConfiguratorContext";

const ZOOM_STEPS = [0.8, 1, 1.2, 1.4];

/**
 * Obszar podglądu części. Do czasu uruchomienia viewera Three.js
 * (`src/features/viewer-3d`) pokazuje model poglądowy wygenerowany z SVG
 * i jasno to komunikuje. Tryby widoku i zoom działają naprawdę.
 */
export function PartPreview() {
  const { state, setViewMode } = useConfigurator();
  const [zoom, setZoom] = useState(1);
  const material = getMaterial(state.materialId);
  const firstFile = state.files[0];
  const zoomIndex = ZOOM_STEPS.indexOf(zoom);

  const tools = [
    {
      label: "Przybliż",
      icon: ZoomInIcon,
      onClick: () => setZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, zoomIndex + 1)]),
      disabled: zoomIndex === ZOOM_STEPS.length - 1,
    },
    {
      label: "Oddal",
      icon: ZoomOutIcon,
      onClick: () => setZoom(ZOOM_STEPS[Math.max(0, zoomIndex - 1)]),
      disabled: zoomIndex === 0,
    },
    { label: "Wyśrodkuj widok", icon: CrosshairIcon, onClick: () => setZoom(1), disabled: zoom === 1 },
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative flex min-h-[300px] flex-1 overflow-hidden rounded-lg sm:min-h-[340px]">
        <EngineeringGrid cell={16} major={5} fade="radial" />

        {/* Pasek narzędzi */}
        <div role="toolbar" aria-label="Narzędzia podglądu" className="relative z-10 flex flex-col gap-2 p-1">
          {tools.map(({ label, icon: Icon, onClick, disabled }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              disabled={disabled}
              title={label}
              aria-label={label}
              className="grid size-9 place-items-center rounded-md border border-line bg-surface text-ink-800 shadow-card transition-colors hover:border-ink-300 disabled:opacity-40"
            >
              <Icon size={17} />
            </button>
          ))}
        </div>

        {/* Rysunek konstrukcyjny w tle */}
        <AnimatedDrawing viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <g fill="none" stroke="#8592a2" strokeWidth={0.6} opacity={0.6}>
            <path d="M70 250L330 100" strokeDasharray="10 3 2 3" {...drawProps(0)} />
            <path d="M90 120L320 250" strokeDasharray="10 3 2 3" {...drawProps(0.2)} />
            <rect x={300} y={40} width={70} height={56} {...drawProps(0.4)} />
            <circle cx={335} cy={68} r={16} {...drawProps(0.6)} />
          </g>
        </AnimatedDrawing>

        <figure className="relative flex flex-1 items-center justify-center px-2 py-6">
          <div
            className="w-full max-w-[440px] transition-transform duration-500 ease-out"
            style={{ transform: `scale(${zoom})` }}
          >
            <IsoBracket
              key={state.viewMode}
              mode={state.viewMode}
              metal={material.visual}
              lineColor="#2e3848"
              title={`Model poglądowy części — ${viewerModes.find((m) => m.id === state.viewMode)?.label}, ${material.name}`}
            />
          </div>
          <figcaption className="absolute top-2 right-2">
            <DemoBadge>Model poglądowy</DemoBadge>
          </figcaption>
        </figure>
      </div>

      {firstFile ? (
        <p className="rounded-md border border-line bg-surface/80 px-3 py-2 text-[12px] leading-relaxed text-ink-600" aria-live="polite">
          <span className="font-semibold text-ink-900">{firstFile.file.name}</span>
          {state.files.length > 1 ? ` (+${state.files.length - 1})` : ""} dodany.{" "}
          {isBrowserRenderable(firstFile.extension)
            ? "Interaktywny podgląd modeli STL/OBJ pojawi się wraz z viewerem 3D."
            : "Podgląd plików STEP/IGES będzie dostępny po uruchomieniu konwersji modeli."}{" "}
          Powyżej widzisz model poglądowy.
        </p>
      ) : null}

      {/* Tryby widoku */}
      <div role="group" aria-label="Tryb widoku" className="grid grid-cols-4 gap-2 sm:gap-3">
        {viewerModes.map((m) => {
          const active = state.viewMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={active}
              onClick={() => setViewMode(m.id)}
              className={cn(
                "group flex flex-col items-center gap-1 rounded-md border bg-surface px-1.5 pt-2 pb-1.5 transition-[border-color,box-shadow] duration-200",
                active ? "border-ink-800 shadow-card" : "border-line hover:border-ink-300",
              )}
            >
              <span className="block w-full max-w-[72px]">
                <IsoBracket mode={m.id} halo="#ffffff" metal={material.visual} lineColor={active ? "#1c2635" : "#5f6979"} />
              </span>
              <span className={cn("text-[11px]", active ? "font-semibold text-ink-900" : "text-ink-600")}>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
