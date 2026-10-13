"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { AlertIcon, InfoIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import { useConfigurator } from "../ConfiguratorContext";
import {
  finishOptions,
  getFinishAvailability,
  getMaterialOption,
  getToleranceAvailability,
  leadTimeOptions,
  materialOptions,
  parseQuantity,
  QUANTITY_MAX,
  QUANTITY_MIN,
  toleranceOptions,
  type FinishId,
  type LeadTimeId,
  type MaterialOptionId,
  type ToleranceId,
} from "../options";
import { buildConfigurationSnapshot, getInquiryBlockers } from "../snapshot";
import { ConfigurationSummary } from "./ConfigurationSummary";

function Row({ label, htmlFor, children, note }: { label: string; htmlFor: string; children: ReactNode; note?: ReactNode }) {
  return (
    <div>
      <div className="grid grid-cols-1 items-center gap-1.5 sm:grid-cols-[108px_minmax(0,1fr)] sm:gap-3 lg:grid-cols-1 xl:grid-cols-[108px_minmax(0,1fr)]">
        <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-ink-700">
          {label}
        </label>
        {children}
      </div>
      {note ? <div className="mt-1 text-[11.5px] leading-snug sm:pl-[120px] lg:pl-0 xl:pl-[120px]">{note}</div> : null}
    </div>
  );
}

function Note({ tone, children, id }: { tone: "info" | "warn" | "error"; children: ReactNode; id?: string }) {
  const Icon = tone === "info" ? InfoIcon : AlertIcon;
  const color = tone === "error" ? "text-danger" : tone === "warn" ? "text-[#8a5a00]" : "text-ink-500";
  return (
    <p id={id} className={`flex gap-1.5 ${color}`}>
      <Icon size={13} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

const groups = ["Metale", "Tworzywa", "Do konsultacji"] as const;

export function ParametersPanel() {
  const { state, setMaterial, setQuantityInput, setTolerance, setFinish, setLeadTime, setInquiryOpen } = useConfigurator();
  const ids = { material: useId(), quantity: useId(), quantityError: useId(), tolerance: useId(), finish: useId(), lead: useId() };
  const [blockers, setBlockers] = useState<{ list: string[]; forState: object } | null>(null);

  const snapshot = useMemo(() => buildConfigurationSnapshot(state), [state]);
  const quantity = parseQuantity(state.quantityInput);
  const material = getMaterialOption(state.material);
  const toleranceAvailability = getToleranceAvailability(state.material, state.tolerance);
  const finishAvailability = getFinishAvailability(state.material, state.finish);
  const lead = leadTimeOptions.find((l) => l.id === state.leadTime);
  const visibleBlockers = blockers?.forState === state ? blockers.list : null;

  const stepQuantity = (delta: number) => {
    const base = quantity.ok ? quantity.value : QUANTITY_MIN;
    setQuantityInput(String(Math.min(QUANTITY_MAX, Math.max(QUANTITY_MIN, base + delta))));
  };

  const goToInquiry = () => {
    const list = getInquiryBlockers(snapshot);
    if (list.length) {
      setBlockers({ list, forState: state });
      return;
    }
    setInquiryOpen(true);
    // Przewinięcie i fokus po wyrenderowaniu formularza
    requestAnimationFrame(() => {
      const form = document.getElementById("zapytanie");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      form?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      form?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
    });
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-surface p-5 shadow-card sm:p-6">
      <h3 className="font-display text-[15px] font-semibold tracking-[0.02em] text-ink-900 uppercase">Parametry części</h3>

      <div className="mt-5 flex flex-col gap-3.5">
        <Row
          label="Materiał"
          htmlFor={ids.material}
          note={material.requiresConsultation ? <Note tone="warn">Dostępność materiału potwierdzimy po analizie projektu.</Note> : null}
        >
          <Select id={ids.material} value={state.material} onChange={(e) => setMaterial(e.target.value as MaterialOptionId)}>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {materialOptions
                  .filter((m) => m.group === g)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </Select>
        </Row>

        <Row
          label="Liczba sztuk"
          htmlFor={ids.quantity}
          note={!quantity.ok ? <Note tone="error" id={ids.quantityError}>{quantity.message}</Note> : null}
        >
          <div className="flex h-10 items-stretch overflow-hidden rounded-sm border border-line bg-surface-muted focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 has-[input[aria-invalid=true]]:border-danger">
            <button
              type="button"
              onClick={() => stepQuantity(-1)}
              disabled={quantity.ok && quantity.value <= QUANTITY_MIN}
              className="grid w-9 place-items-center text-ink-600 hover:bg-surface-sunken disabled:opacity-40"
              aria-label="Zmniejsz liczbę sztuk"
            >
              <MinusIcon size={15} />
            </button>
            <input
              id={ids.quantity}
              type="number"
              inputMode="numeric"
              min={QUANTITY_MIN}
              max={QUANTITY_MAX}
              step={1}
              value={state.quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              aria-invalid={!quantity.ok}
              aria-describedby={!quantity.ok ? ids.quantityError : undefined}
              className="w-full min-w-0 [appearance:textfield] bg-transparent text-center text-[13px] text-ink-900 outline-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => stepQuantity(1)}
              disabled={quantity.ok && quantity.value >= QUANTITY_MAX}
              className="grid w-9 place-items-center text-ink-600 hover:bg-surface-sunken disabled:opacity-40"
              aria-label="Zwiększ liczbę sztuk"
            >
              <PlusIcon size={15} />
            </button>
          </div>
        </Row>

        <Row
          label="Tolerancja"
          htmlFor={ids.tolerance}
          note={
            toleranceAvailability.status === "consult" ? (
              <Note tone="warn">{toleranceAvailability.note}</Note>
            ) : (
              <Note tone="info">{toleranceOptions.find((t) => t.id === state.tolerance)?.hint}</Note>
            )
          }
        >
          <Select id={ids.tolerance} value={state.tolerance} onChange={(e) => setTolerance(e.target.value as ToleranceId)}>
            {toleranceOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
                {getToleranceAvailability(state.material, t.id).status === "consult" ? " — do konsultacji" : ""}
              </option>
            ))}
          </Select>
        </Row>

        <Row
          label="Wykończenie"
          htmlFor={ids.finish}
          note={finishAvailability.status === "consult" ? <Note tone="warn">{finishAvailability.note}</Note> : null}
        >
          <Select id={ids.finish} value={state.finish} onChange={(e) => setFinish(e.target.value as FinishId)}>
            {finishOptions.map((o) => {
              const a = getFinishAvailability(state.material, o.id);
              return (
                <option key={o.id} value={o.id} disabled={a.status === "unavailable"}>
                  {o.label}
                  {a.status === "unavailable" ? " — niedostępne dla materiału" : a.status === "consult" && o.id !== "other" ? " — do konsultacji" : ""}
                </option>
              );
            })}
          </Select>
        </Row>

        <Row label="Termin" htmlFor={ids.lead} note={<Note tone={state.leadTime === "urgent" ? "warn" : "info"}>{lead?.hint}</Note>}>
          <Select id={ids.lead} value={state.leadTime} onChange={(e) => setLeadTime(e.target.value as LeadTimeId)}>
            {leadTimeOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </Select>
        </Row>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-ink-400 uppercase">Podsumowanie</p>
        <ConfigurationSummary snapshot={snapshot} className="mt-1.5" />
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="font-display text-[22px] leading-tight font-semibold text-ink-900">Wycena po analizie projektu</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">
          Cenę i termin przygotujemy na podstawie modelu i wybranych parametrów. Automatyczny kalkulator jest w przygotowaniu.
        </p>
      </div>

      <Button onClick={goToInquiry} withArrow className="mt-5 w-full" aria-controls="zapytanie" aria-expanded={state.inquiryOpen}>
        Przejdź do zapytania
      </Button>

      <div aria-live="polite">
        {visibleBlockers ? (
          <div className="mt-3 flex gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-[12px] text-ink-800">
            <AlertIcon size={16} className="mt-px shrink-0 text-danger" />
            <ul className="space-y-1">
              {visibleBlockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
