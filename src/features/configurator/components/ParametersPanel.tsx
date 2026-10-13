"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { AlertIcon, CheckCircleIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import { finishLabels, getMaterial, materials, type FinishId, type MaterialId } from "@/features/materials/data";
import { buildQuoteRequestDraft, checkQuoteRequest, submitQuoteRequest } from "@/features/quotes/request";
import { useConfigurator } from "../ConfiguratorContext";
import { leadTimes, QUANTITY_MAX, QUANTITY_MIN, tolerances, type LeadTimeId, type ToleranceId } from "../options";

/** Komunikat jest ważny tylko dla stanu, w którym powstał — każda zmiana parametrów go ukrywa. */
type Feedback = ({ kind: "issues"; issues: string[] } | { kind: "ready" }) & { forState: object };

function Row({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-center gap-1.5 sm:grid-cols-[108px_minmax(0,1fr)] sm:gap-3 lg:grid-cols-1 xl:grid-cols-[108px_minmax(0,1fr)]">
      <label htmlFor={htmlFor} className="text-[12.5px] font-medium text-ink-700">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ParametersPanel() {
  const { state, setMaterial, setQuantity, setTolerance, setFinish, setLeadTime } = useConfigurator();
  const [lastFeedback, setFeedback] = useState<Feedback | null>(null);
  const [quantityDraft, setQuantityDraft] = useState<string | null>(null);
  const feedback = lastFeedback?.forState === state ? lastFeedback : null;
  const ids = { material: useId(), quantity: useId(), tolerance: useId(), finish: useId(), lead: useId() };
  const material = getMaterial(state.materialId);


  const onRequestQuote = async () => {
    const draft = buildQuoteRequestDraft({
      files: state.files.map((f) => f.file),
      materialId: state.materialId,
      grade: state.grade,
      quantity: state.quantity,
      tolerance: state.tolerance,
      finish: state.finish,
      leadTime: state.leadTime,
    });
    const check = checkQuoteRequest(draft);
    if (!check.ready) {
      setFeedback({ kind: "issues", issues: check.issues, forState: state });
      return;
    }
    await submitQuoteRequest(draft);
    setFeedback({ kind: "ready", forState: state });
  };

  const summary = [
    { label: "Pliki", value: state.files.length ? `${state.files.length}` : "brak" },
    { label: "Materiał", value: state.grade },
    { label: "Ilość", value: `${state.quantity} szt.` },
    { label: "Tolerancje", value: tolerances.find((t) => t.id === state.tolerance)?.label ?? "" },
    { label: "Wykończenie", value: finishLabels[state.finish] },
    { label: "Termin", value: leadTimes.find((l) => l.id === state.leadTime)?.label ?? "" },
  ];

  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-surface p-5 shadow-card sm:p-6">
      <h3 className="font-display text-[15px] font-semibold tracking-[0.02em] text-ink-900 uppercase">Parametry części</h3>

      <div className="mt-5 flex flex-col gap-3.5">
        <Row label="Materiał" htmlFor={ids.material}>
          <Select
            id={ids.material}
            value={`${state.materialId}::${state.grade}`}
            onChange={(e) => {
              const [materialId, grade] = e.target.value.split("::");
              setMaterial(materialId as MaterialId, grade);
            }}
          >
            {materials.map((m) => (
              <optgroup key={m.id} label={m.name}>
                {m.grades.map((g) => (
                  <option key={g} value={`${m.id}::${g}`}>
                    {g}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Row>

        <Row label="Liczba sztuk" htmlFor={ids.quantity}>
          <div className="flex h-10 items-stretch overflow-hidden rounded-sm border border-line bg-surface-muted focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <button
              type="button"
              onClick={() => setQuantity(state.quantity - 1)}
              disabled={state.quantity <= QUANTITY_MIN}
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
              value={quantityDraft ?? String(state.quantity)}
              onChange={(e) => {
                setQuantityDraft(e.target.value);
                const n = Number(e.target.value);
                if (e.target.value !== "" && Number.isFinite(n)) setQuantity(n);
              }}
              onBlur={() => setQuantityDraft(null)}
              className="w-full min-w-0 [appearance:textfield] bg-transparent text-center text-[13px] text-ink-900 outline-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setQuantity(state.quantity + 1)}
              disabled={state.quantity >= QUANTITY_MAX}
              className="grid w-9 place-items-center text-ink-600 hover:bg-surface-sunken disabled:opacity-40"
              aria-label="Zwiększ liczbę sztuk"
            >
              <PlusIcon size={15} />
            </button>
          </div>
        </Row>

        <Row label="Tolerancje" htmlFor={ids.tolerance}>
          <Select id={ids.tolerance} value={state.tolerance} onChange={(e) => setTolerance(e.target.value as ToleranceId)}>
            {tolerances.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </Row>

        <Row label="Wykończenie" htmlFor={ids.finish}>
          <Select id={ids.finish} value={state.finish} onChange={(e) => setFinish(e.target.value as FinishId)}>
            {material.finishes.map((f) => (
              <option key={f} value={f}>
                {finishLabels[f]}
              </option>
            ))}
          </Select>
        </Row>

        <Row label="Termin realizacji" htmlFor={ids.lead}>
          <Select id={ids.lead} value={state.leadTime} onChange={(e) => setLeadTime(e.target.value as LeadTimeId)}>
            {leadTimes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </Select>
        </Row>
        <p className="-mt-1 text-[11.5px] text-ink-500 sm:pl-[120px] lg:pl-0 xl:pl-[120px]">
          {tolerances.find((t) => t.id === state.tolerance)?.hint}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line pt-4 text-[11.5px]">
        {summary.map((s) => (
          <div key={s.label} className="min-w-0">
            <dt className="text-ink-400">{s.label}</dt>
            <dd className="truncate font-medium text-ink-800" title={s.value}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-[12.5px] text-ink-600">Cena netto</p>
        <p className="mt-1 font-display text-[24px] leading-tight font-semibold text-ink-900">Po analizie projektu</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">
          Cenę i termin przygotujemy na podstawie pliku oraz wybranych parametrów. Automatyczna wycena jest w przygotowaniu.
        </p>
      </div>

      <Button onClick={onRequestQuote} withArrow className="mt-5 w-full">
        Poproś o wycenę
      </Button>

      <div aria-live="polite">
        {feedback?.kind === "issues" ? (
          <div className="mt-3 flex gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-[12px] text-ink-800">
            <AlertIcon size={16} className="mt-px shrink-0 text-danger" />
            <ul className="space-y-1">
              {feedback.issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {feedback?.kind === "ready" ? (
          <div className="mt-3 flex gap-2 rounded-md border border-accent/25 bg-accent-soft p-3 text-[12px] leading-relaxed text-ink-800">
            <CheckCircleIcon size={16} className="mt-px shrink-0 text-accent" />
            <p>
              <span className="font-semibold">Zapytanie jest kompletne.</span> Wysyłkę zapytań uruchomimy wraz z systemem wycen — na tym
              etapie pliki i parametry nie zostały nigdzie przesłane.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
