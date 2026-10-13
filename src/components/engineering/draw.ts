import type { CSSProperties } from "react";

/**
 * Właściwości elementu SVG rysowanego „w czasie”.
 * Działa wewnątrz <AnimatedDrawing> (atrybut data-drawing="active").
 */
export function drawProps(delay = 0, duration = 1.6) {
  return {
    className: "draw-line",
    pathLength: 1,
    style: { "--draw-delay": `${delay}s`, "--draw-duration": `${duration}s` } as CSSProperties,
  };
}

/** Element pojawiający się (fade) po narysowaniu linii. */
export function fadeProps(delay = 0) {
  return {
    className: "draw-fade",
    style: { "--draw-delay": `${delay}s` } as CSSProperties,
  };
}
