import { cn } from "@/lib/cn";
import { siteConfig } from "@/config/site";

/** Logotyp VEXOR: wordmark w kroju technicznym + podpis „CNC Manufacturing”. */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex flex-col leading-none", tone === "dark" ? "text-ink-900" : "text-white", className)}>
      <span className="font-display text-[26px] font-bold tracking-[0.04em]">{siteConfig.name}</span>
      <span
        className={cn(
          "mt-0.5 self-center text-[7px] font-medium tracking-[0.32em] uppercase",
          tone === "dark" ? "text-ink-500" : "text-white/60",
        )}
      >
        {siteConfig.tagline}
      </span>
    </span>
  );
}
