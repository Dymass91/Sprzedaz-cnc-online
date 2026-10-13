import { useId } from "react";
import { cn } from "@/lib/cn";
import { DimensionLine, BlueprintAnnotation } from "@/components/engineering";
import { CylinderGradient, MetalDefs, metalPalettes, type MetalName } from "../metal";
import { anchors, base, baseHoles, baseNotch, bracketBounds, bracketClipPaths, sideBoss, topBoss, web } from "./bracket-geometry";
import type { IllustrationMode } from "../types";

type IsoBracketProps = {
  className?: string;
  metal?: MetalName;
  mode?: IllustrationMode;
  /** Przesuwający się odblask na metalu. */
  sheen?: boolean;
  /** Kolor linii w trybie siatki / wymiarów. */
  lineColor?: string;
  /** Kolor tła pod opisami wymiarów. */
  halo?: string;
  /** Opis dostępny dla czytników ekranu. Brak = ilustracja dekoracyjna. */
  title?: string;
  /** Opóźnienie rysowania wymiarów (w <AnimatedDrawing>); false = statyczne. */
  dimensionDelay?: number | false;
};

/**
 * Wspornik/korpus CNC w rzucie izometrycznym, generowany z geometrii.
 * Ten sam model obsługuje tryby: cieniowany, siatka, przekrój i wymiary —
 * stąd podgląd w konfiguratorze może przełączać widoki bez obrazków.
 */
export function IsoBracket({
  className,
  metal = "aluminium",
  mode = "shaded",
  sheen = false,
  lineColor = "#2e3848",
  halo = "#f4f6f8",
  title,
  dimensionDelay = false,
}: IsoBracketProps) {
  const id = `b${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const p = metalPalettes[metal];
  const wire = mode === "wireframe";
  const section = mode === "section";
  const hatch = `url(#${id}-hatch)`;
  const fill = (key: "top" | "front" | "side" | "slope" | "bore") => (wire ? "none" : `url(#${id}-${key})`);
  const stroke = wire ? lineColor : p.outline;
  const sw = wire ? 0.75 : 0.6;
  const vb = bracketBounds;
  const extra = mode === "dimensions" ? 34 : 0;
  const viewBox = `${vb.minX - extra} ${vb.minY - extra / 2} ${vb.width + extra * 2} ${vb.height + extra * 1.4}`;

  return (
    <svg
      viewBox={viewBox}
      className={cn("h-auto w-full overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <MetalDefs id={id} palette={p} />
        <CylinderGradient id={`${id}-cylTop`} from={topBoss.cyl.shadeFrom} to={topBoss.cyl.shadeTo} palette={p} />
        <CylinderGradient id={`${id}-cylSide`} from={sideBoss.cyl.shadeFrom} to={sideBoss.cyl.shadeTo} palette={p} />
        <linearGradient id={`${id}-sheenGrad`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-window`}>
          <path d={web.windowFront} />
        </clipPath>
        <clipPath id={`${id}-clip`}>
          {bracketClipPaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </clipPath>
      </defs>

      {/* Cień kontaktowy */}
      {!wire ? (
        <path
          d={base.top}
          transform="translate(6 22)"
          fill="#1c2635"
          opacity={0.22}
          filter={`url(#${id}-shadow)`}
        />
      ) : null}

      {/* Krawędzie niewidoczne (tylko siatka) */}
      {wire ? (
        <g fill="none" stroke={lineColor} strokeWidth={0.5} strokeDasharray="3 2" opacity={0.55}>
          <path d={base.hidden} />
          <path d={base.hiddenVertical} />
          <path d={web.back} />
          <path d={web.windowBack} />
          <path d={topBoss.cyl.backCap} />
          <path d={sideBoss.cyl.backCap} />
          <path d={sideBoss.boreBack} />
          <path d={topBoss.boreBack} />
        </g>
      ) : null}

      <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
        {/* Podstawa */}
        <path d={base.front} fill={fill("front")} />
        {section ? <path d={base.front} fill={hatch} stroke="none" /> : null}
        <path d={base.side} fill={fill("side")} />
        <path d={base.top} fill={fill("top")} />
        <path d={baseNotch} fill={wire ? "none" : p.bore[0]} />

        {/* Otwory w podstawie */}
        <path d={baseHoles.counterbore.outer} fill={wire ? "none" : `url(#${id}-slope)`} />
        <path d={baseHoles.counterbore.inner} fill={fill("bore")} />
        {baseHoles.small.map((h, i) => (
          <path key={i} d={h.d} fill={fill("bore")} />
        ))}

        {/* Żebro z wybraniem */}
        <path d={web.slope} fill={fill("slope")} />
        <path d={web.front} fill={fill("front")} fillRule="evenodd" />
        {section ? <path d={web.front} fill={hatch} fillRule="evenodd" stroke="none" /> : null}
        <g clipPath={wire ? undefined : `url(#${id}-window)`}>
          <path d={web.windowBottom} fill={wire ? "none" : `url(#${id}-side)`} />
          <path d={web.windowLeft} fill={wire ? "none" : `url(#${id}-slope)`} />
        </g>

        {/* Górna piasta */}
        <path d={topBoss.cyl.body} fill={wire ? "none" : `url(#${id}-cylTop)`} />
        <path d={topBoss.cyl.cap} fill={fill("front")} />
        <path d={topBoss.chamfer} fill="none" stroke={wire ? lineColor : p.edge} strokeWidth={wire ? 0.4 : 0.8} />
        <path d={topBoss.bore} fill={fill("bore")} />
        {topBoss.holes.map((h, i) => (
          <path key={i} d={h.d} fill={fill("bore")} />
        ))}

        {/* Lewa piasta z kołnierzem */}
        <path d={sideBoss.cyl.body} fill={wire ? "none" : `url(#${id}-cylSide)`} />
        <path d={sideBoss.cyl.cap} fill={fill("front")} />
        {section ? <path d={sideBoss.ring} fill={hatch} fillRule="evenodd" stroke="none" /> : null}
        <path d={sideBoss.chamfer} fill="none" stroke={wire ? lineColor : p.edge} strokeWidth={wire ? 0.4 : 0.9} />
        <path d={sideBoss.bore} fill={fill("bore")} />
        <path d={sideBoss.boreStep} fill="none" stroke={wire ? lineColor : "rgba(255,255,255,0.25)"} strokeWidth={0.6} />
        {sideBoss.bolts.map((h, i) => (
          <path key={i} d={h.d} fill={fill("bore")} />
        ))}
      </g>

      {/* Podświetlenie krawędzi górnych */}
      {!wire ? (
        <g fill="none" stroke={p.edge} strokeWidth={0.7} opacity={0.9}>
          <path d={base.top} />
          <path d={web.slope} opacity={0.6} />
        </g>
      ) : null}

      {/* Przekrój: kreskowanie płaszczyzn cięcia */}
      {section ? (
        <g>
          <line
            x1={anchors.sideBossCenter[0] - 60}
            y1={anchors.sideBossCenter[1] - 34.6}
            x2={anchors.baseFrontRightBottom[0] + 40}
            y2={anchors.baseFrontRightBottom[1] + 23}
            stroke="#2f66d0"
            strokeWidth={0.8}
            strokeDasharray="10 3 2 3"
          />
        </g>
      ) : null}

      {/* Odblask */}
      {sheen && !wire ? (
        <g clipPath={`url(#${id}-clip)`} style={{ mixBlendMode: "soft-light" }}>
          <rect
            x={vb.minX}
            y={vb.minY}
            width={vb.width * 0.35}
            height={vb.height}
            fill={`url(#${id}-sheenGrad)`}
            transform={`skewX(-18) translate(${vb.width * 0.35} 0)`}
            className="metal-sheen"
          />
        </g>
      ) : null}

      {mode === "dimensions" ? (
        <g>
          <DimensionLine
            from={anchors.baseFrontLeftBottom}
            to={anchors.baseFrontRightBottom}
            offset={16}
            label="172.00"
            color={lineColor}
            halo={halo}
            delay={dimensionDelay}
          />
          <DimensionLine
            from={anchors.baseFrontRightBottom}
            to={anchors.baseRightBackBottom}
            offset={14}
            label="64.00"
            color={lineColor}
            halo={halo}
            delay={dimensionDelay === false ? false : dimensionDelay + 0.3}
          />
          <DimensionLine
            from={[anchors.topBossTop[0] + 60, anchors.topBossTop[1]]}
            to={[anchors.topBossTop[0] + 60, anchors.baseBottomUnderBoss[1]]}
            offset={-40}
            label="135.00"
            color={lineColor}
            halo={halo}
            delay={dimensionDelay === false ? false : dimensionDelay + 0.6}
          />
          <BlueprintAnnotation
            x={anchors.boreEdge[0]}
            y={anchors.boreEdge[1]}
            labelX={anchors.boreEdge[0] - 30}
            labelY={anchors.boreEdge[1] - 34}
            label="Ø32 H7"
            color={lineColor}
            halo={halo}
            delay={dimensionDelay === false ? false : dimensionDelay + 0.9}
          />
          <BlueprintAnnotation
            x={anchors.counterbore[0]}
            y={anchors.counterbore[1]}
            labelX={anchors.counterbore[0] + 26}
            labelY={anchors.counterbore[1] - 30}
            label="Ø26 / Ø17"
            color={lineColor}
            halo={halo}
            delay={dimensionDelay === false ? false : dimensionDelay + 1.1}
          />
          <BlueprintAnnotation
            x={anchors.topBossCenter[0]}
            y={anchors.topBossCenter[1]}
            labelX={anchors.topBossCenter[0] + 34}
            labelY={anchors.topBossCenter[1] - 30}
            label="Ø19 H7"
            color={lineColor}
            halo={halo}
            delay={dimensionDelay === false ? false : dimensionDelay + 1.3}
          />
        </g>
      ) : null}
    </svg>
  );
}
