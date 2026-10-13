"use client";

import { Container } from "@/components/ui/Container";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { HorizontalScroller, ScrollerArrows, useScroller } from "@/components/ui/HorizontalScroller";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StarIcon, UserIcon } from "@/components/ui/icons";

/**
 * Opinie klientów — STAN DEMONSTRACYJNY.
 * VEXOR nie ma jeszcze opinii, więc karty pokazują wyłącznie układ
 * i są wyraźnie oznaczone. Prawdziwe opinie (np. z systemu recenzji
 * po dostawie) należy podłączyć w miejsce `demoSlots`.
 */
const demoSlots = [
  { persona: "Konstruktor / firma produkcyjna", text: "Miejsce na opinię klienta o jakości wykonania i przebiegu zamówienia." },
  { persona: "Majsterkowicz / pasjonat", text: "Miejsce na opinię osoby, która zamawiała część po raz pierwszy." },
  { persona: "Właściciel warsztatu", text: "Miejsce na opinię stałego klienta o terminowości i komunikacji." },
  { persona: "Dział zakupów", text: "Miejsce na opinię dotyczącą zamówień seryjnych i dokumentacji." },
];

export function TestimonialsSection() {
  const scroller = useScroller();
  const { prev, next, canPrev, canNext } = scroller[1];
  return (
    <section id="opinie" aria-labelledby="opinie-title" className="relative py-9 lg:py-11">
      <Container>
        <SectionHeading
          id="opinie-title"
          title="Co mówią nasi klienci?"
          description="Zaufali nam zarówno profesjonaliści, jak i pasjonaci."
          action={<ScrollerArrows prev={prev} next={next} canPrev={canPrev} canNext={canNext} />}
          className="mb-4"
        />
        <HorizontalScroller label="Opinie klientów (wersja demonstracyjna)" scroller={scroller}>
          {demoSlots.map((slot, i) => (
            <li key={slot.persona} className="w-[86%] shrink-0 snap-start sm:w-[48%] lg:w-[calc((100%-32px)/3)]">
              <figure className="flex h-full flex-col rounded-lg border border-dashed border-line-strong bg-surface/80 p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-sunken text-ink-400">
                    <UserIcon size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-ink-900">Opinia demonstracyjna {i + 1}</span>
                    <span className="block truncate text-[12px] text-ink-500">{slot.persona}</span>
                  </span>
                  <span className="flex text-ink-300" aria-label="Brak oceny — przykład układu">
                    {Array.from({ length: 5 }, (_, s) => (
                      <StarIcon key={s} size={14} filled={false} />
                    ))}
                  </span>
                </div>
                <blockquote className="mt-4 text-[13.5px] leading-relaxed text-ink-500 italic">„{slot.text}”</blockquote>
              </figure>
            </li>
          ))}
        </HorizontalScroller>
        <p className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-500">
          <DemoBadge>Wersja demonstracyjna</DemoBadge>
          <span>Pierwsze opinie opublikujemy po realizacji zamówień.</span>
        </p>
      </Container>
    </section>
  );
}
