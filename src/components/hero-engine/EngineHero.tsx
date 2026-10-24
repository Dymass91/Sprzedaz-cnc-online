"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PlayIcon } from "@/components/ui/icons";
import { EngineControls, SPEED_RANGE } from "./EngineControls";
import { DEFAULT_PENCIL_PARAMS, DEFAULT_RENDER_STYLE, type PencilParams, type RenderStyle } from "./pencilStyle";

const EngineScene = dynamic(() => import("./EngineScene"), { ssr: false });

type Capability = "pending" | "auto" | "manual" | "unsupported";

let cachedCapability: Exclude<Capability, "pending"> | null = null;

/** Czy i jak uruchamiać scenę 3D na tym urządzeniu (liczone raz). */
function detectCapability(): Exclude<Capability, "pending"> {
  if (cachedCapability) return cachedCapability;
  let webgl = false;
  try {
    const canvas = document.createElement("canvas");
    webgl = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    webgl = false;
  }
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const small = window.matchMedia("(max-width: 767px)").matches;
  cachedCapability = !webgl ? "unsupported" : small || connection?.saveData ? "manual" : "auto";
  return cachedCapability;
}

const noopSubscribe = () => () => {};

/** Słabsze urządzenia (dotyk lub ≤ 4 rdzenie): 2 warstwy kreskowania zamiast 3. */
function detectHatchLayers(): number {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  return coarse || cores <= 4 ? 2 : 3;
}

/**
 * Faktura papieru: deterministyczny szum SVG (stały seed), nieruchomy względem ekranu —
 * kartka pod animowanym rysunkiem. Ledwo widoczna, chłodna (bez efektu „vintage”).
 */
const PAPER_TEXTURE =
  "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27180%27 height=%27180%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%272%27 seed=%277%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 0.17 0 0 0 0 0.19 0 0 0 0 0.22 0 0 0 0.6 0%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E')";

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * Hero: animowany przekrój silnika R4 w stylu rysunku ołówkiem.
 * Do czasu załadowania sceny (i gdy WebGL jest niedostępny) widoczny jest
 * `fallback` — dotychczasowa ilustracja SVG renderowana po stronie serwera.
 */
export type EngineHeroProps = {
  fallback: ReactNode;
  /** Styl początkowy (domyślnie szkic ołówkiem). */
  initialStyle?: RenderStyle;
  /** Strojenie szkicu: kontury, grafit, gęstość kreskowania, papier, nieregularność linii. */
  pencilParams?: PencilParams;
};

export function EngineHero({ fallback, initialStyle = DEFAULT_RENDER_STYLE, pencilParams = DEFAULT_PENCIL_PARAMS }: EngineHeroProps) {
  const capability = useSyncExternalStore<Capability>(noopSubscribe, detectCapability, () => "pending");
  const hatchLayers = useSyncExternalStore(noopSubscribe, detectHatchLayers, () => 3);
  const [renderStyle, setRenderStyle] = useState<RenderStyle>(initialStyle);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  // Po przejściu do 3D ilustracja SVG jest usuwana — jej animacje CSS nie pracują w tle.
  const [fallbackGone, setFallbackGone] = useState(false);
  const [visible, setVisible] = useState(true);
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const [speedRpm, setSpeedRpm] = useState<number>(SPEED_RANGE.default);
  const [introDone, setIntroDone] = useState(false);
  const [stopped, setStopped] = useState(true);
  const [resetSignal, setResetSignal] = useState(0);

  // Przy ograniczonym ruchu silnik startuje zatrzymany — użytkownik może go uruchomić.
  const playing = userPlaying ?? !reducedMotion;

  // Automatyczny start w wolnej chwili przeglądarki — nie konkuruje z pierwszym renderem strony.
  useEffect(() => {
    if (capability !== "auto") return;
    const start = () => setRequested(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(start, 1200);
    return () => clearTimeout(id);
  }, [capability]);

  // Poza ekranem renderowanie jest wstrzymane.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onIntroDone = useCallback(() => setIntroDone(true), []);
  const onStopped = useCallback(() => setStopped(true), []);
  const toggle = () => {
    setStopped(false);
    setUserPlaying(!playing);
  };

  const showScene = requested && capability !== "unsupported";
  const animating = !introDone || playing || !stopped;

  return (
    <div ref={containerRef} className="relative aspect-[720/520] w-full">
      {ready && renderStyle === "pencil" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: PAPER_TEXTURE,
            opacity: 0.05 * pencilParams.paperTextureStrength,
            maskImage: "radial-gradient(ellipse 72% 70% at 58% 50%, #000 45%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 72% 70% at 58% 50%, #000 45%, transparent 100%)",
          }}
        />
      ) : null}
      {fallbackGone ? null : (
        <div
          className={cn("absolute inset-0 transition-opacity duration-700", ready ? "pointer-events-none opacity-0" : "opacity-100")}
          aria-hidden={ready}
          onTransitionEnd={() => ready && setFallbackGone(true)}
        >
          {fallback}
        </div>
      )}

      {showScene ? (
        <div className={cn("absolute inset-0 transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}>
          <EngineScene
            playing={playing}
            speedRpm={speedRpm}
            reducedMotion={reducedMotion}
            renderStyle={renderStyle}
            pencilParams={pencilParams}
            hatchLayers={hatchLayers}
            visible={visible}
            animating={animating}
            resetSignal={resetSignal}
            onReady={onReady}
            onIntroDone={onIntroDone}
            onStopped={onStopped}
          />
        </div>
      ) : null}

      {ready ? (
        <>
          <p className="pointer-events-none absolute top-2 left-2 font-mono text-[10.5px] leading-snug tracking-wide text-ink-500 uppercase sm:left-4">
            Silnik R4 · przekrój
            <span className="block normal-case tracking-normal text-ink-400">Wizualizacja poglądowa · przeciągnij, aby obrócić</span>
          </p>
          <div className="absolute right-2 bottom-2 sm:right-4 sm:bottom-3">
            <EngineControls
              playing={playing}
              speedRpm={speedRpm}
              renderStyle={renderStyle}
              onRenderStyleChange={setRenderStyle}
              onToggle={toggle}
              onSpeedChange={setSpeedRpm}
              onResetCamera={() => setResetSignal((n) => n + 1)}
            />
          </div>
        </>
      ) : null}

      {capability === "manual" && !requested ? (
        <button
          type="button"
          onClick={() => setRequested(true)}
          className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-surface/95 px-4 py-2 text-[12.5px] font-medium text-ink-800 shadow-card backdrop-blur-sm hover:border-ink-300"
        >
          <PlayIcon size={14} />
          Uruchom animację 3D
        </button>
      ) : null}

      {requested && !ready && capability !== "unsupported" ? (
        <p role="status" className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11.5px] text-ink-500">
          Ładowanie wizualizacji…
        </p>
      ) : null}
    </div>
  );
}
