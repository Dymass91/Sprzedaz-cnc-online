"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";

type Status = { kind: "idle" } | { kind: "error"; message: string } | { kind: "info"; message: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Zapis do newslettera. Usługa mailingowa nie jest jeszcze podłączona —
 * formularz waliduje adres i uczciwie informuje, że niczego nie zapisano.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputId = useId();
  const messageId = useId();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setStatus({ kind: "error", message: "Podaj poprawny adres e-mail." });
      return;
    }
    setStatus({
      kind: "info",
      message: "Dziękujemy! Zapisy ruszą wkrótce — na razie nie zapisaliśmy Twojego adresu.",
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4">
      <label htmlFor={inputId} className="sr-only">
        Adres e-mail
      </label>
      <div className="flex h-11 overflow-hidden rounded-sm border border-line-strong bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status.kind !== "idle") setStatus({ kind: "idle" });
          }}
          placeholder="Twój adres e-mail"
          aria-invalid={status.kind === "error"}
          aria-describedby={status.kind !== "idle" ? messageId : undefined}
          className="min-w-0 flex-1 bg-transparent px-3.5 text-[13px] text-ink-900 outline-none placeholder:text-ink-400"
        />
        <button type="submit" aria-label="Zapisz się do newslettera" className="grid w-11 place-items-center border-l border-line text-ink-800 hover:bg-surface-sunken">
          <ArrowRightIcon size={17} />
        </button>
      </div>
      <p
        id={messageId}
        aria-live="polite"
        className={status.kind === "error" ? "mt-2 text-[12px] text-danger" : "mt-2 text-[12px] text-ink-500"}
      >
        {status.kind === "idle" ? "" : status.message}
      </p>
    </form>
  );
}
