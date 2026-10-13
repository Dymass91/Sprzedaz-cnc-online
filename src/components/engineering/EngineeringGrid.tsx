import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type EngineeringGridProps = {
  className?: string;
  /** Rozmiar drobnej siatki w px. */
  cell?: number;
  /** Co ile drobnych pól rysowana jest linia główna. */
  major?: number;
  tone?: "light" | "dark";
  /** Wygaszanie siatki ku krawędziom. */
  fade?: "none" | "radial" | "bottom" | "edges";
};

const masks: Record<NonNullable<EngineeringGridProps["fade"]>, string | undefined> = {
  none: undefined,
  radial: "radial-gradient(ellipse 70% 65% at 50% 45%, #000 40%, transparent 100%)",
  bottom: "linear-gradient(to bottom, #000 55%, transparent)",
  edges: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
};

/**
 * Delikatna siatka konstrukcyjna (jak papier milimetrowy) generowana w CSS —
 * bez obrazków, ostra w każdej rozdzielczości.
 */
export function EngineeringGrid({ className, cell = 24, major = 5, tone = "light", fade = "none" }: EngineeringGridProps) {
  const minor = tone === "light" ? "rgb(46 56 72 / 0.04)" : "rgb(255 255 255 / 0.045)";
  const main = tone === "light" ? "rgb(46 56 72 / 0.07)" : "rgb(255 255 255 / 0.085)";
  const big = cell * major;
  const mask = masks[fade];
  const style: CSSProperties = {
    backgroundImage: [
      `linear-gradient(to right, ${main} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${main} 1px, transparent 1px)`,
      `linear-gradient(to right, ${minor} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${minor} 1px, transparent 1px)`,
    ].join(","),
    backgroundSize: `${big}px ${big}px, ${big}px ${big}px, ${cell}px ${cell}px, ${cell}px ${cell}px`,
    maskImage: mask,
    WebkitMaskImage: mask,
  };
  return <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0", className)} style={style} />;
}
