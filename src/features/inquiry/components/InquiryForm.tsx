"use client";

import { useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { AlertIcon, CheckCircleIcon, CloseIcon, InfoIcon } from "@/components/ui/icons";
import { useConfigurator } from "@/features/configurator/ConfiguratorContext";
import { ConfigurationSummary } from "@/features/configurator/components/ConfigurationSummary";
import { buildConfigurationSnapshot } from "@/features/configurator/snapshot";
import { buildProjectRecord } from "@/features/project/buildProjectRecord";
import { submitInquiry } from "../api";
import type { InquiryContact, InquiryErrors, InquiryField, InquirySubmitResult } from "../types";
import { emptyContact, NOTES_MAX_LENGTH, validateContact } from "../validation";

const fieldOrder: InquiryField[] = ["fullName", "email", "phone", "company", "notes", "consent"];

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-[12.5px] font-medium text-ink-800">
        {label}
        {optional ? <span className="text-[11px] font-normal text-ink-400">opcjonalnie</span> : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 flex gap-1.5 text-[11.5px] text-danger">
          <AlertIcon size={13} className="mt-px shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-sm border border-line bg-surface-muted px-3 text-[13.5px] text-ink-900 transition-colors placeholder:text-ink-400 hover:border-line-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20 aria-[invalid=true]:border-danger";

/**
 * Formularz zapytania ofertowego. Dane osobowe są trzymane wyłącznie
 * w pamięci komponentu (bez localStorage) i — dopóki nie ma backendu —
 * nigdzie nie są wysyłane.
 */
export function InquiryForm({ hidden = false }: { hidden?: boolean }) {
  const { state, setInquiryOpen } = useConfigurator();
  const [contact, setContact] = useState<InquiryContact>(emptyContact);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [result, setResult] = useState<InquirySubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const base = useId();
  const id = (f: InquiryField) => `${base}-${f}`;
  const snapshot = useMemo(() => buildConfigurationSnapshot(state), [state]);
  const project = useMemo(
    () => (state.model.status === "ready" ? buildProjectRecord(state.model.model, state.unit, state.unitConfirmed, snapshot) : null),
    [state.model, state.unit, state.unitConfirmed, snapshot],
  );

  const update = <K extends InquiryField>(field: K, value: InquiryContact[K]) => {
    setContact((c) => ({ ...c, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    setResult(null);
  };

  const a11y = (f: InquiryField) => ({
    id: id(f),
    "aria-invalid": Boolean(errors[f]),
    "aria-describedby": errors[f] ? `${id(f)}-error` : undefined,
  });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validateContact(contact);
    setErrors(found);
    const first = fieldOrder.find((f) => found[f]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(first))}`)?.focus();
      return;
    }
    setSubmitting(true);
    const res = await submitInquiry({ contact, configuration: snapshot, project, modelFileId: null });
    setSubmitting(false);
    setResult(res);
  };

  return (
    <section
      id="zapytanie"
      hidden={hidden}
      aria-labelledby={`${base}-title`}
      className="relative mt-8 animate-fade-up scroll-mt-[calc(var(--header-height)+16px)] rounded-lg border border-line bg-surface p-5 shadow-card sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id={`${base}-title`} className="font-display text-[22px] font-semibold text-ink-900 uppercase sm:text-[26px]">
            Zapytanie o wycenę
          </h3>
          <p className="mt-1 text-[13.5px] text-ink-600">Podaj dane kontaktowe — przygotujemy wycenę na podstawie konfiguracji.</p>
        </div>
        <button
          type="button"
          onClick={() => setInquiryOpen(false)}
          className="grid size-9 shrink-0 place-items-center rounded-sm text-ink-500 hover:bg-surface-sunken hover:text-ink-900"
          aria-label="Zamknij formularz zapytania"
        >
          <CloseIcon size={18} />
        </button>
      </div>

      <p className="mt-4 flex gap-2 rounded-md border border-dashed border-ink-300 bg-surface-muted p-3 text-[12.5px] leading-relaxed text-ink-700">
        <InfoIcon size={16} className="mt-0.5 shrink-0 text-ink-500" />
        <span>
          <span className="font-semibold">Wysyłka zapytań nie jest jeszcze aktywna.</span> Formularz pokazuje docelowy proces — po
          kliknięciu przycisku dane i plik nie zostaną nigdzie wysłane ani zapisane.
        </span>
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field id={id("fullName")} label="Imię i nazwisko" error={errors.fullName}>
            <input
              {...a11y("fullName")}
              type="text"
              autoComplete="name"
              value={contact.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field id={id("email")} label="E-mail" error={errors.email}>
            <input
              {...a11y("email")}
              type="email"
              autoComplete="email"
              value={contact.email}
              onChange={(e) => update("email", e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field id={id("phone")} label="Telefon" optional error={errors.phone}>
            <input
              {...a11y("phone")}
              type="tel"
              autoComplete="tel"
              value={contact.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field id={id("company")} label="Nazwa firmy" optional>
            <input
              {...a11y("company")}
              type="text"
              autoComplete="organization"
              value={contact.company}
              onChange={(e) => update("company", e.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id={id("notes")} label="Dodatkowe uwagi" optional error={errors.notes}>
              <textarea
                {...a11y("notes")}
                rows={4}
                maxLength={NOTES_MAX_LENGTH}
                value={contact.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Np. pasowania, gwinty, wymagania wykończenia, przeznaczenie części…"
                className={cn(inputClass, "h-auto py-2.5 leading-relaxed")}
              />
            </Field>
            <p className="mt-1 text-right text-[11px] text-ink-400">
              {contact.notes.length}/{NOTES_MAX_LENGTH}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={id("consent")} className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-700">
              <input
                {...a11y("consent")}
                type="checkbox"
                checked={contact.consent}
                onChange={(e) => update("consent", e.target.checked)}
                className="mt-1 size-4 shrink-0 accent-[var(--color-accent)]"
              />
              <span>
                Wyrażam zgodę na przetwarzanie moich danych osobowych w celu przygotowania wyceny i kontaktu w sprawie zapytania,
                zgodnie z polityką prywatności VEXOR (dokument w przygotowaniu).
              </span>
            </label>
            {errors.consent ? (
              <p id={`${id("consent")}-error`} className="mt-1 ml-6.5 flex gap-1.5 text-[11.5px] text-danger">
                <AlertIcon size={13} className="mt-px shrink-0" />
                {errors.consent}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
            <Button type="submit" withArrow disabled={submitting}>
              {submitting ? "Sprawdzanie…" : "Wyślij zapytanie"}
            </Button>
            <Button variant="secondary" onClick={() => setInquiryOpen(false)}>
              Wróć do konfiguracji
            </Button>
          </div>

          <div aria-live="polite" className="sm:col-span-2">
            {result?.status === "not-connected" ? (
              <div className="flex gap-2 rounded-md border border-accent/25 bg-accent-soft p-3.5 text-[12.5px] leading-relaxed text-ink-800">
                <CheckCircleIcon size={17} className="mt-0.5 shrink-0 text-accent" />
                <p>
                  <span className="font-semibold">Formularz jest wypełniony poprawnie, ale zapytanie NIE zostało wysłane.</span> Wysyłkę
                  uruchomimy wraz z systemem zapytań. Wpisane dane pozostają tylko w tej karcie przeglądarki i znikną po jej zamknięciu.
                </p>
              </div>
            ) : null}
            {result?.status === "error" ? (
              <div role="alert" className="flex gap-2 rounded-md border border-danger/30 bg-danger/5 p-3.5 text-[12.5px] text-ink-800">
                <AlertIcon size={17} className="mt-0.5 shrink-0 text-danger" />
                <p>{result.message}</p>
              </div>
            ) : null}
          </div>
        </form>

        <aside aria-label="Podsumowanie konfiguracji" className="rounded-lg border border-line bg-surface-muted p-4 sm:p-5">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-ink-400 uppercase">Twoja konfiguracja</p>
          <ConfigurationSummary snapshot={snapshot} className="mt-2" />
          <p className="mt-3 border-t border-line pt-3 font-display text-[18px] font-semibold text-ink-900">Wycena po analizie projektu</p>
        </aside>
      </div>
    </section>
  );
}
