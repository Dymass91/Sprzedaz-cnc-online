"use client";

import dynamic from "next/dynamic";

/**
 * Viewer ładowany dopiero, gdy użytkownik wczyta model — Three.js nie trafia
 * do pierwszego wczytania strony.
 */
export const LazyStlViewer = dynamic(() => import("./StlViewer"), {
  ssr: false,
  loading: () => (
    <div role="status" className="grid h-full place-items-center text-[13px] text-ink-500">
      <span className="flex items-center gap-2">
        <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-ink-800 motion-reduce:animate-none" />
        Ładowanie podglądu 3D…
      </span>
    </div>
  ),
});
