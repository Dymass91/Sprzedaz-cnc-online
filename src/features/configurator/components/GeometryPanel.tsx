"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/Select";
import { AlertIcon, CheckCircleIcon, InfoIcon } from "@/components/ui/icons";
import { approx, formatAreaMm2, formatCount, formatMm, formatVolumeMm3, lengthUnits, unitHint, unitToMm, type LengthUnit } from "@/features/geometry/units";
import { useConfigurator } from "../ConfiguratorContext";

/** Wymiary gabarytowe, jednostki i jakość siatki wczytanego modelu. */
export function GeometryPanel() {
  const { state, setUnit, confirmUnit } = useConfigurator();
  const unitId = useId();
  const confirmId = useId();
  if (state.model.status !== "ready") return null;

  const { analysis } = state.model.model;
  const f = unitToMm(state.unit);
  const [sx, sy, sz] = analysis.size;
  const hint = unitHint(Math.max(sx, sy, sz), state.unit);
  const { topology, volume } = analysis;

  const dims = [
    { axis: "X", label: "Szerokość", value: sx * f },
    { axis: "Y", label: "Głębokość", value: sy * f },
    { axis: "Z", label: "Wysokość", value: sz * f },
  ];

  return (
    <section aria-labelledby={`${unitId}-title`} className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <h3 id={`${unitId}-title`} className="font-display text-[14px] font-semibold tracking-[0.02em] text-ink-900 uppercase">
        Wymiary gabarytowe
      </h3>

      <dl className="mt-3 divide-y divide-line-faint">
        {dims.map((d) => (
          <div key={d.axis} className="flex items-baseline justify-between gap-3 py-1.5 text-[12.5px]">
            <dt className="text-ink-600">
              <span className="mr-1.5 inline-block w-3 font-mono text-[11px] text-accent">{d.axis}</span>
              {d.label}
            </dt>
            <dd className="font-mono font-medium text-ink-900">{formatMm(d.value)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 rounded-md border border-line bg-surface-muted p-3">
        <label htmlFor={unitId} className="block text-[12px] font-medium text-ink-700">
          Jednostki pliku STL
        </label>
        <p className="mt-0.5 text-[11.5px] leading-snug text-ink-500">Format STL nie zapisuje jednostek — wskaż, w czym przygotowano model.</p>
        <div className="mt-2">
          <Select id={unitId} value={state.unit} onChange={(e) => setUnit(e.target.value as LengthUnit)} className="bg-surface">
            {lengthUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </Select>
        </div>
        {hint ? (
          <p className="mt-2 flex gap-1.5 text-[11.5px] leading-snug text-[#8a5a00]">
            <AlertIcon size={14} className="mt-px shrink-0" />
            {hint}
          </p>
        ) : null}
        <label htmlFor={confirmId} className="mt-2.5 flex cursor-pointer items-start gap-2 text-[12px] leading-snug text-ink-800">
          <input
            id={confirmId}
            type="checkbox"
            checked={state.unitConfirmed}
            onChange={(e) => confirmUnit(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
          />
          Potwierdzam, że wymiary powyżej odpowiadają rzeczywistej części.
        </label>
      </div>

      <dl className="mt-3 space-y-1 text-[12px]">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-500">Objętość</dt>
          <dd className="text-right font-medium text-ink-900">
            {volume.status === "reliable" ? approx(formatVolumeMm3(volume.value * f ** 3)) : "nie do ustalenia"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-500">Pole powierzchni</dt>
          <dd className="text-right font-medium text-ink-900">{approx(formatAreaMm2(analysis.surfaceArea * f ** 2))}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-500">Trójkąty</dt>
          <dd className="text-right font-medium text-ink-900">{formatCount(analysis.triangleCount)}</dd>
        </div>
      </dl>

      <div
        className={cn(
          "mt-3 flex gap-2 rounded-md p-2.5 text-[11.5px] leading-snug",
          topology.closed ? "bg-success/8 text-ink-800" : "bg-[#fff6e0] text-ink-800",
        )}
      >
        {topology.closed ? (
          <CheckCircleIcon size={15} className="mt-px shrink-0 text-success" />
        ) : (
          <AlertIcon size={15} className="mt-px shrink-0 text-[#8a5a00]" />
        )}
        <p>
          {topology.closed ? (
            <>
              <span className="font-semibold">Siatka zamknięta.</span> Objętość obliczona z geometrii STL
              {volume.status === "reliable" && volume.normalsInverted ? " (normalne w pliku były odwrócone)" : ""}.
            </>
          ) : (
            <>
              <span className="font-semibold">Model wymaga sprawdzenia.</span>{" "}
              {volume.status === "unreliable" ? volume.reason : null} Wymiary gabarytowe pozostają poprawne.
            </>
          )}
        </p>
      </div>

      <p className="mt-2 flex gap-1.5 text-[11px] leading-snug text-ink-400">
        <InfoIcon size={13} className="mt-px shrink-0" />
        Wartości orientacyjne z siatki STL — nie są danymi produkcyjnymi. Technolog zweryfikuje model przy wycenie.
      </p>
    </section>
  );
}
