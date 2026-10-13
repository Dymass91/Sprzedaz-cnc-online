"use client";

import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Miejsce na panel klienta. Konta jeszcze nie istnieją, więc zamiast
 * pozornego logowania informujemy o tym i kierujemy do konfiguratora.
 */
export function AccountPopover({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target) && !ref.current.parentElement?.contains(target)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      id={id}
      hidden={!open}
      role="region"
      aria-label="Konto klienta"
      className="absolute top-12 right-0 w-72 rounded-lg border border-line bg-surface p-5 shadow-raised"
    >
      <p className="font-display text-base font-semibold uppercase">Panel klienta</p>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-600">
        Konta klientów są w przygotowaniu. Znajdziesz tu historię zapytań i zamówień, zapisane projekty oraz faktury.
      </p>
      <ButtonLink href="#konfigurator" size="sm" withArrow className="mt-4 w-full" onClick={onClose}>
        Przejdź do konfiguratora
      </ButtonLink>
    </div>
  );
}
