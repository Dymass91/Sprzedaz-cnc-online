import { AnimatedDrawing, BlueprintAnnotation, EngineeringGrid, drawProps } from "@/components/engineering";
import { IsoBracket } from "@/components/illustrations/parts/IsoBracket";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const LINE = "rgba(210,222,240,0.55)";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="relative isolate overflow-hidden bg-ink-950 text-white">
      <EngineeringGrid tone="dark" cell={20} major={5} />
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_90%_at_75%_50%,rgb(60_80_110/0.45),transparent_70%)]"
        aria-hidden="true"
      />

      {/* Część w ujęciu „blueprint” */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 right-[-14%] w-[min(760px,110%)] -translate-y-[38%] opacity-90 sm:right-[-6%] lg:right-[-2%] lg:w-[640px]"
        style={{
          maskImage: "linear-gradient(to right, transparent, #000 30%)",
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 30%)",
        }}
      >
        <div className="relative">
          <IsoBracket metal="steel" sheen className="opacity-80 mix-blend-screen" />
          <div className="absolute inset-0">
            <IsoBracket mode="wireframe" lineColor="rgba(210,225,245,0.55)" />
          </div>
        </div>
      </div>
      <AnimatedDrawing viewBox="0 0 1200 260" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <g fill="none" stroke={LINE} strokeWidth={0.7}>
          <path d="M560 40h120M560 36v8M680 36v8" {...drawProps(0.2)} />
          <path d="M600 210l60 -34h80" {...drawProps(0.5)} />
          <circle cx={1120} cy={70} r={26} {...drawProps(0.4)} />
          <path d="M1080 70h80M1120 30v80" strokeDasharray="10 3 2 3" strokeWidth={0.5} {...drawProps(0.6)} />
        </g>
        <BlueprintAnnotation x={760} y={120} labelX={700} labelY={80} label="Ø20 H7" color={LINE} halo="#0a111c" delay={0.8} />
      </AnimatedDrawing>

      <Container className="relative py-14 sm:py-16 lg:py-[72px]">
        <h2 id="cta-title" className="max-w-[640px] font-display text-[28px] leading-[1.1] font-semibold uppercase sm:text-[34px] lg:text-[38px]">
          Gotowy, aby zrealizować swój projekt?
        </h2>
        <p className="mt-3 max-w-md text-[15px] text-white/75">Prześlij projekt, poznaj cenę i zamów część CNC online.</p>
        <ButtonLink href="#konfigurator" variant="inverse" size="lg" withArrow className="mt-7">
          Zamów część teraz
        </ButtonLink>
      </Container>
    </section>
  );
}
