import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "./icons";

/** Natywny <select> w stylu VEXOR — pełna dostępność i obsługa mobilna za darmo. */
export function Select({ className, children, ...props }: ComponentPropsWithoutRef<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full cursor-pointer appearance-none truncate rounded-sm border border-line bg-surface-muted pr-9 pl-3 text-[13px] text-ink-900 transition-colors hover:border-line-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-400" />
    </div>
  );
}
