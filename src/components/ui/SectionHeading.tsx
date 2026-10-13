import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  tone?: "light" | "dark";
};

/** Nagłówek sekcji: duży tytuł w kroju technicznym + krótki opis, opcjonalna akcja po prawej. */
export function SectionHeading({ id, title, description, action, className, tone = "light" }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h2
          id={id}
          className={cn(
            "font-display text-[26px] leading-[1.1] font-semibold tracking-[0.005em] uppercase sm:text-[30px] lg:text-[34px]",
            tone === "dark" ? "text-white" : "text-ink-900",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className={cn("mt-2 text-sm sm:text-[15px]", tone === "dark" ? "text-white/70" : "text-ink-600")}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
