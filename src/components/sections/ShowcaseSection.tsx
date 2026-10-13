import type { ReactNode } from "react";
import { EngineeringGrid } from "@/components/engineering";
import { IsoBracket } from "@/components/illustrations/parts/IsoBracket";
import { AngleBracketPart, BushingPart, FlangePart, GearPart } from "@/components/illustrations/parts/IsoParts";
import { Container } from "@/components/ui/Container";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRightIcon } from "@/components/ui/icons";

/**
 * Przykładowe części — wizualizacje typów elementów, które można zamówić.
 * Nie są to zdjęcia zrealizowanych zleceń; po pierwszych realizacjach
 * dane zastąpi galeria ze zdjęciami (np. z CMS).
 */
const examples: { name: string; material: string; process: string; visual: ReactNode }[] = [
  { name: "Korpus", material: "Aluminium 7075", process: "Frezowanie 5-osiowe", visual: <IsoBracket metal="aluminium" /> },
  { name: "Uchwyt montażowy", material: "Stal nierdzewna 1.4301", process: "Frezowanie", visual: <AngleBracketPart metal="stainless" /> },
  { name: "Koło zębate", material: "Stal C45", process: "Toczenie + frezowanie", visual: <GearPart metal="steel" /> },
  { name: "Tuleja", material: "Mosiądz CuZn39Pb3", process: "Toczenie", visual: <BushingPart metal="brass" /> },
  { name: "Kołnierz", material: "Aluminium 6082", process: "Toczenie", visual: <FlangePart metal="aluminium" /> },
  { name: "Wspornik", material: "Tytan Grade 5", process: "Frezowanie 5-osiowe", visual: <IsoBracket metal="titanium" /> },
];

export function ShowcaseSection() {
  return (
    <section id="realizacje" aria-labelledby="realizacje-title" className="relative py-9 lg:py-12">
      <Container>
        <SectionHeading
          id="realizacje-title"
          title="Przykładowe realizacje"
          description="Zobacz, co możemy dla Ciebie wykonać. To tylko kilka przykładów — możliwości jest znacznie więcej."
          action={
            <a href="#konfigurator" className="group inline-flex items-center gap-2 text-[13px] font-medium text-accent hover:text-accent-strong">
              Zamów podobną część
              <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
            </a>
          }
        />
        <HorizontalScroller label="Przykładowe części" className="mt-6">
          {examples.map((e) => (
            <li key={e.name} className="w-[78%] shrink-0 snap-start sm:w-[42%] md:w-[31%] lg:w-[calc((100%-64px)/5)]">
              <article className="group h-full overflow-hidden rounded-lg border border-line bg-surface shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-raised">
                <div className="relative aspect-[4/3.3] overflow-hidden bg-surface-muted">
                  <EngineeringGrid cell={12} major={5} />
                  <svg viewBox="0 0 200 165" className="absolute inset-0 h-full w-full" aria-hidden="true">
                    <g fill="none" stroke="#8592a2" strokeWidth={0.5} opacity={0.6}>
                      <path d="M14 20h60M14 16v8M74 16v8" />
                      <circle cx={170} cy={30} r={14} />
                      <path d="M150 30h40M170 10v40" strokeDasharray="6 2 1 2" />
                      <path d="M20 150L180 62" strokeDasharray="8 3 2 3" />
                    </g>
                  </svg>
                  <div className="absolute inset-0 grid place-items-center p-5 transition-transform duration-500 group-hover:scale-[1.05]">
                    <div className="w-[82%]">{e.visual}</div>
                  </div>
                </div>
                <div className="border-t border-line px-4 py-3">
                  <h3 className="text-[14px] font-semibold text-ink-900">{e.name}</h3>
                  <p className="text-[12px] text-ink-500">{e.material}</p>
                  <p className="mt-1 text-[11px] text-ink-400">{e.process}</p>
                </div>
              </article>
            </li>
          ))}
        </HorizontalScroller>
        <p className="mt-3 flex justify-end">
          <DemoBadge>Wizualizacje poglądowe</DemoBadge>
        </p>
      </Container>
    </section>
  );
}
