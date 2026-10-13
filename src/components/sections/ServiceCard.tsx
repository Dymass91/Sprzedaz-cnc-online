"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon } from "@/components/ui/icons";

type ServiceCardProps = {
  title: string;
  points: string[];
  details: string;
  scene: ReactNode;
};

export function ServiceCard({ title, points, details, scene }: ServiceCardProps) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  return (
    <article className="group relative isolate flex min-h-[320px] overflow-hidden rounded-lg border border-line bg-surface shadow-card sm:min-h-[340px]">
      {/* Ilustracja — prawa część karty, wygaszana ku tekstowi */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 -z-10 w-full transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:w-[68%]"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, #000 38%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 38%)",
        }}
      >
        {scene}
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-surface via-surface/85 to-transparent sm:via-surface/60" aria-hidden="true" />

      <div className="flex w-full flex-col p-6 sm:max-w-[62%] sm:p-8">
        <h3 className="font-display text-[22px] font-semibold text-ink-900 uppercase sm:text-[26px]">{title}</h3>
        <ul className="mt-5 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex gap-2.5 text-[13.5px] leading-snug text-ink-700">
              <CheckCircleIcon size={18} className="shrink-0 text-ink-800" />
              {p}
            </li>
          ))}
        </ul>
        <div
          id={detailsId}
          hidden={!open}
          className="mt-4 max-w-sm rounded-md border border-line bg-surface/90 p-3 text-[12.5px] leading-relaxed text-ink-600 backdrop-blur-sm"
        >
          {details}{" "}
          <a href="#konfigurator" className="font-medium text-accent hover:underline">
            Prześlij projekt →
          </a>
        </div>
        <div className="mt-auto pt-6">
          <Button withArrow aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen((v) => !v)}>
            {open ? "Zwiń opis" : "Poznaj usługę"}
          </Button>
        </div>
      </div>
      <span className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ink-300 to-transparent")} aria-hidden="true" />
    </article>
  );
}
