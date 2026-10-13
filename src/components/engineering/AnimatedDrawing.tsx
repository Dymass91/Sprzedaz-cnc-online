"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";

type AnimatedDrawingProps = ComponentPropsWithoutRef<"svg"> & {
  /** Uruchom od razu (np. w hero), bez czekania na wejście w widok. */
  immediate?: boolean;
  /** Część elementu, która musi być widoczna, aby uruchomić rysowanie. */
  threshold?: number;
};

/**
 * Kontener SVG, który uruchamia animację rysowania linii (klasy `.draw-line`
 * i `.draw-fade`, zob. `drawProps`/`fadeProps`) po wejściu w obszar widoku.
 * Przy `prefers-reduced-motion` linie są od razu narysowane (CSS).
 */
export function AnimatedDrawing({ immediate = false, threshold = 0.2, children, ...props }: AnimatedDrawingProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [inView, setInView] = useState(false);
  const active = immediate || inView;

  useEffect(() => {
    if (active) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, threshold]);

  return (
    <svg ref={ref} data-drawing={active ? "active" : "idle"} {...props}>
      {children}
    </svg>
  );
}
