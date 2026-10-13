"use client";

import { useState, type ComponentType } from "react";
import { cn } from "@/lib/cn";
import { EngineeringGrid } from "@/components/engineering";
import { IsoBracket } from "@/components/illustrations/parts/IsoBracket";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { CrosshairIcon, CubeIcon, LayersIcon, RulerIcon, type IconProps } from "@/components/ui/icons";
import { unitToMm } from "@/features/geometry/units";
import { LazyStlViewer } from "@/features/viewer-3d/LazyStlViewer";
import { gridStepLabel } from "@/features/viewer-3d/grid";
import { useConfigurator } from "../ConfiguratorContext";
import { getMaterialOption } from "../options";

type ControlProps = {
  label: string;
  icon: ComponentType<IconProps>;
  pressed?: boolean;
  disabled: boolean;
  onClick: () => void;
};

function ViewControl({ label, icon: Icon, pressed, disabled, onClick }: ControlProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-md border bg-surface px-1.5 py-2.5 text-[11px] transition-[border-color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        pressed ? "border-ink-800 font-semibold text-ink-900 shadow-card" : "border-line text-ink-600 hover:border-ink-300",
      )}
    >
      <Icon size={20} strokeWidth={1.4} />
      {label}
    </button>
  );
}

/**
 * Obszar podglądu: interaktywny model 3D po wczytaniu STL,
 * wcześniej — wyraźnie oznaczona ilustracja poglądowa.
 */
export function ModelPreview() {
  const { state } = useConfigurator();
  const [wireframe, setWireframe] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [resetSignal, setResetSignal] = useState(0);
  const slot = state.model;
  const ready = slot.status === "ready";
  const material = getMaterialOption(state.material);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative h-[320px] overflow-hidden rounded-lg border border-line bg-surface-muted/60 sm:h-[380px] lg:h-[430px]">
        <EngineeringGrid cell={16} major={5} fade="radial" />

        {ready ? (
          <>
            <div className="absolute inset-0">
              <LazyStlViewer
                positions={slot.model.positions}
                min={slot.model.analysis.min}
                max={slot.model.analysis.max}
                unitToMm={unitToMm(state.unit)}
                appearance={material.category}
                wireframe={wireframe}
                showDimensions={showDimensions}
                resetSignal={resetSignal}
                label={`Model 3D z pliku ${slot.model.fileName}`}
              />
            </div>
            <p className="pointer-events-none absolute top-2.5 left-3 rounded-xs bg-surface/85 px-2 py-1 font-mono text-[10.5px] text-ink-600 backdrop-blur-sm">
              Siatka: {gridStepLabel(slot.model.analysis.size, state.unit)} · {material.label.replace(/ — do konsultacji$/, "")}
            </p>
            <p className="pointer-events-none absolute bottom-2.5 left-3 hidden rounded-xs bg-surface/85 px-2 py-1 text-[10.5px] text-ink-500 backdrop-blur-sm sm:block">
              Obrót: przeciągnij · Zoom: kółko / szczypanie · Przesuwanie: prawy przycisk / dwa palce
            </p>
          </>
        ) : (
          <figure className="relative flex h-full items-center justify-center px-6 py-6">
            <div className={cn("w-full max-w-[400px] transition-opacity", slot.status === "loading" ? "opacity-30" : "opacity-90")}>
              <IsoBracket metal="aluminium" />
            </div>
            <figcaption className="absolute top-2.5 right-2.5">
              <DemoBadge>Model poglądowy</DemoBadge>
            </figcaption>
            {slot.status === "loading" ? (
              <p role="status" className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-2 text-[13px] font-medium text-ink-700">
                <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-ink-800 motion-reduce:animate-none" />
                Analiza geometrii modelu…
              </p>
            ) : (
              <p className="absolute inset-x-6 bottom-5 text-center text-[12.5px] text-ink-600">
                Wgraj plik STL, aby obejrzeć swoją część w 3D i sprawdzić jej wymiary.
              </p>
            )}
          </figure>
        )}
      </div>

      <div role="group" aria-label="Sterowanie podglądem 3D" className="grid grid-cols-4 gap-2 sm:gap-3">
        <ViewControl label="Widok pełny" icon={CubeIcon} pressed={ready && !wireframe} disabled={!ready} onClick={() => setWireframe(false)} />
        <ViewControl label="Siatka" icon={LayersIcon} pressed={ready && wireframe} disabled={!ready} onClick={() => setWireframe(true)} />
        <ViewControl
          label="Wymiary"
          icon={RulerIcon}
          pressed={ready && showDimensions}
          disabled={!ready}
          onClick={() => setShowDimensions((v) => !v)}
        />
        <ViewControl label="Reset kamery" icon={CrosshairIcon} disabled={!ready} onClick={() => setResetSignal((n) => n + 1)} />
      </div>
    </div>
  );
}
