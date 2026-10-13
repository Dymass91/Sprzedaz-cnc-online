import { cn } from "@/lib/cn";
import { InfoIcon } from "./icons";

/** Wyraźne oznaczenie treści demonstracyjnych / poglądowych. */
export function DemoBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink-300 bg-surface/80 px-2.5 py-1 text-[11px] font-medium tracking-wide text-ink-600 uppercase",
        className,
      )}
    >
      <InfoIcon size={13} />
      {children}
    </span>
  );
}
