"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export type ScrollerControls = {
  prev: () => void;
  next: () => void;
  canPrev: boolean;
  canNext: boolean;
};

/** Ref listy i sterowanie — do użycia, gdy strzałki są poza listą. */
export function useScroller(): [RefObject<HTMLUListElement | null>, ScrollerControls] {
  const ref = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setCanPrev(el.scrollLeft > 4);
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const scroll = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const item = el.querySelector("li");
    const step = item ? item.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  }, []);

  const prev = useCallback(() => scroll(-1), [scroll]);
  const next = useCallback(() => scroll(1), [scroll]);

  return [ref, { prev, next, canPrev, canNext }];
}

type HorizontalScrollerProps = {
  children: ReactNode;
  label: string;
  className?: string;
  /** Zewnętrzny scroller z useScroller() (gdy strzałki renderuje rodzic). Brak = strzałki po bokach. */
  scroller?: ReturnType<typeof useScroller>;
};

/** Poziomo przewijana lista z przyciąganiem (scroll-snap) i strzałkami. */
export function HorizontalScroller({ children, label, className, scroller }: HorizontalScrollerProps) {
  const own = useScroller();
  const [listRef, s] = scroller ?? own;
  const arrow =
    "size-10 place-items-center rounded-full border border-line bg-surface text-ink-800 shadow-card transition-[opacity,border-color] hover:border-ink-300 disabled:opacity-35";

  return (
    <div className={cn("relative", className)}>
      <ul
        ref={listRef}
        aria-label={label}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 py-2 sm:mx-0 sm:scroll-px-0 sm:px-0"
      >
        {children}
      </ul>
      {scroller ? null : (
        <>
          <button type="button" onClick={s.prev} disabled={!s.canPrev} aria-label="Poprzednie" className={cn(arrow, "absolute top-1/2 -left-5 z-10 hidden -translate-y-1/2 xl:grid")}>
            <ChevronLeftIcon size={18} />
          </button>
          <button type="button" onClick={s.next} disabled={!s.canNext} aria-label="Następne" className={cn(arrow, "absolute top-1/2 -right-5 z-10 hidden -translate-y-1/2 xl:grid")}>
            <ChevronRightIcon size={18} />
          </button>
        </>
      )}
    </div>
  );
}

export function ScrollerArrows({ prev, next, canPrev, canNext, className }: ScrollerControls & { className?: string }) {
  const arrow =
    "grid size-9 place-items-center rounded-full border border-line bg-surface text-ink-800 transition-[opacity,border-color] hover:border-ink-300 disabled:opacity-35";
  return (
    <div className={cn("flex gap-2", className)}>
      <button type="button" onClick={prev} disabled={!canPrev} aria-label="Poprzednie" className={arrow}>
        <ChevronLeftIcon size={17} />
      </button>
      <button type="button" onClick={next} disabled={!canNext} aria-label="Następne" className={arrow}>
        <ChevronRightIcon size={17} />
      </button>
    </div>
  );
}
