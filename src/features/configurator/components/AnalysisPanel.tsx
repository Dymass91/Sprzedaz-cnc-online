"use client";

import { useId, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/Select";
import { AlertIcon, CheckCircleIcon, InfoIcon } from "@/components/ui/icons";
import { ANALYSIS_VERSION } from "@/features/cad-files/config";
import { approx, formatAreaMm2, formatCount, formatMm, formatVolumeMm3, lengthUnits, type LengthUnit } from "@/features/geometry/units";
import { buildCadAnalysis } from "@/features/project/buildProjectRecord";
import type { Measured } from "@/features/project/types";
import { useConfigurator } from "../ConfiguratorContext";

const formatLabels = { binary: "STL (binarny)", ascii: "STL (ASCII)", "iso-10303-21": "STEP (ISO 10303-21)" } as const;

function AutoBadge() {
  return (
    <span
      title="Obliczone automatycznie z geometrii — niezweryfikowane"
      className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-px align-middle font-sans text-[9.5px] font-semibold tracking-wide text-accent uppercase"
    >
      auto
    </span>
  );
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-[12.5px]">
      <dt className="shrink-0 text-ink-600">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-ink-900">{children}</dd>
    </div>
  );
}

function MeasuredValue<T>({ m, format }: { m: Measured<T>; format: (v: T) => string }) {
  if (m.provenance === "unavailable") {
    return (
      <span className="text-[12px] font-normal text-ink-500" title={m.reason}>
        niedostępne
      </span>
    );
  }
  return (
    <>
      <span title={m.note}>{format(m.value)}</span>
      <AutoBadge />
    </>
  );
}

/**
 * Panel „Analiza projektu”: format, jednostki, wymiary, objętość, liczba brył,
 * status analizy i ostrzeżenia. Wszystkie wartości pochodzą z `buildCadAnalysis`
 * — tego samego źródła, które trafia do rekordu projektu.
 */
export function AnalysisPanel() {
  const { state, setUnit, confirmUnit } = useConfigurator();
  const ids = { title: useId(), unit: useId(), confirm: useId() };
  const slot = state.model;
  const model = slot.status === "ready" ? slot.model : null;
  const analysis = useMemo(() => (model ? buildCadAnalysis(model, state.unit, state.unitConfirmed) : null), [model, state.unit, state.unitConfirmed]);
  if (!model || !analysis) return null;

  const blocking = analysis.warnings.filter((w) => w.severity === "warning");
  const [sx, sy, sz] = analysis.boundingBoxMm.value ?? [0, 0, 0];

  return (
    <section aria-labelledby={ids.title} className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <h3 id={ids.title} className="font-display text-[14px] font-semibold tracking-[0.02em] text-ink-900 uppercase">
          Analiza projektu
        </h3>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
            blocking.length ? "bg-[#fff6e0] text-[#8a5a00]" : "bg-success/10 text-success",
          )}
        >
          {blocking.length ? <AlertIcon size={12} /> : <CheckCircleIcon size={12} />}
          {blocking.length ? "Wymaga uwagi" : "Analiza zakończona"}
        </span>
      </div>

      <dl className="mt-2 divide-y divide-line-faint">
        <Row label="Format">{formatLabels[model.encoding]}</Row>
        <Row label="Metoda">
          <span className="text-[12px] font-normal text-ink-600">
            {model.cad ? `Open CASCADE (${model.cad.engine} ${model.cad.engineVersion})` : "Parser siatki STL"}
          </span>
        </Row>
        <Row label={<><span className="mr-1.5 font-mono text-[11px] text-accent">X</span>Szerokość</>}>
          <span className="font-mono">{formatMm(sx)}</span>
          <AutoBadge />
        </Row>
        <Row label={<><span className="mr-1.5 font-mono text-[11px] text-accent">Y</span>Głębokość</>}>
          <span className="font-mono">{formatMm(sy)}</span>
          <AutoBadge />
        </Row>
        <Row label={<><span className="mr-1.5 font-mono text-[11px] text-accent">Z</span>Wysokość</>}>
          <span className="font-mono">{formatMm(sz)}</span>
          <AutoBadge />
        </Row>
      </dl>

      {model.unitsFromFile ? (
        <p className="mt-2 flex gap-1.5 rounded-md bg-surface-muted p-2.5 text-[11.5px] leading-snug text-ink-600">
          <CheckCircleIcon size={14} className="mt-px shrink-0 text-success" />
          Jednostki odczytane z pliku STEP i przeliczone na milimetry.
        </p>
      ) : (
        <div className="mt-2 rounded-md border border-line bg-surface-muted p-3">
          <label htmlFor={ids.unit} className="block text-[12px] font-medium text-ink-700">
            Jednostki pliku STL
          </label>
          <p className="mt-0.5 text-[11.5px] leading-snug text-ink-500">Format STL nie zapisuje jednostek — wskaż, w czym przygotowano model.</p>
          <div className="mt-2">
            <Select id={ids.unit} value={state.unit} onChange={(e) => setUnit(e.target.value as LengthUnit)} className="bg-surface">
              {lengthUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </Select>
          </div>
          <label htmlFor={ids.confirm} className="mt-2.5 flex cursor-pointer items-start gap-2 text-[12px] leading-snug text-ink-800">
            <input
              id={ids.confirm}
              type="checkbox"
              checked={state.unitConfirmed}
              onChange={(e) => confirmUnit(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
            />
            Potwierdzam, że wymiary powyżej odpowiadają rzeczywistej części.
          </label>
        </div>
      )}

      <dl className="mt-2 divide-y divide-line-faint">
        <Row label="Objętość">
          <MeasuredValue m={analysis.volumeMm3} format={(v) => approx(formatVolumeMm3(v))} />
        </Row>
        <Row label="Pole powierzchni">
          <MeasuredValue m={analysis.surfaceAreaMm2} format={(v) => approx(formatAreaMm2(v))} />
        </Row>
        <Row label="Liczba brył">
          <MeasuredValue m={analysis.solidCount} format={(v) => formatCount(v)} />
        </Row>
        {model.cad ? (
          <>
            <Row label="Obiekty w pliku">
              <MeasuredValue m={analysis.fileObjectCount} format={(v) => formatCount(v)} />
            </Row>
            <Row label="Ściany B-Rep">
              <MeasuredValue m={analysis.brepFaceCount} format={(v) => formatCount(v)} />
            </Row>
          </>
        ) : null}
        <Row label="Geometria zamknięta">
          <MeasuredValue m={analysis.closedGeometry} format={(v) => (v ? "tak" : "nie")} />
        </Row>
        <Row label="Otwory">
          <span className="text-[12px] font-normal text-ink-500">do oceny technologa</span>
        </Row>
      </dl>

      {analysis.volumeMm3.provenance === "unavailable" ? (
        <p className="mt-2 text-[11.5px] leading-snug text-ink-500">Objętość: {analysis.volumeMm3.reason}</p>
      ) : null}

      {analysis.warnings.length ? (
        <ul aria-label="Ostrzeżenia dotyczące modelu" className="mt-3 space-y-1.5">
          {analysis.warnings.map((w) => (
            <li
              key={w.code}
              className={cn(
                "flex gap-1.5 rounded-md p-2 text-[11.5px] leading-snug",
                w.severity === "warning" ? "bg-[#fff6e0] text-ink-800" : "bg-surface-muted text-ink-600",
              )}
            >
              {w.severity === "warning" ? (
                <AlertIcon size={14} className="mt-px shrink-0 text-[#8a5a00]" />
              ) : (
                <InfoIcon size={14} className="mt-px shrink-0 text-ink-400" />
              )}
              {w.message}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 flex gap-1.5 text-[11px] leading-snug text-ink-400">
        <InfoIcon size={13} className="mt-px shrink-0" />
        <span>
          Wartości oznaczone „auto” obliczono automatycznie z geometrii — są niezweryfikowane. Otwory, gwinty i tolerancje oceni technolog
          przy wycenie. Wersja analizy {ANALYSIS_VERSION}.
        </span>
      </p>
    </section>
  );
}
