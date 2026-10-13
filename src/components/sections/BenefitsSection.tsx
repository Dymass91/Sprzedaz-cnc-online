import { AnimatedDrawing, drawProps } from "@/components/engineering";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CursorClickIcon, ShieldIcon, StopwatchIcon, TruckIcon } from "@/components/ui/icons";

const benefits = [
  { icon: ShieldIcon, title: "Wysoka jakość", text: "Precyzyjna obróbka i kontrola wymiarów części" },
  { icon: StopwatchIcon, title: "Sprawna realizacja", text: "Termin realizacji znasz już na etapie wyceny" },
  { icon: TruckIcon, title: "Wysyłka w całej Polsce", text: "Dostarczamy kurierem pod wskazany adres" },
  { icon: CursorClickIcon, title: "Wygodne zamawianie", text: "Wszystko online — od pliku do dostawy" },
];

export function BenefitsSection() {
  return (
    <section id="dlaczego-warto" aria-labelledby="dlaczego-title" className="relative overflow-hidden py-9 lg:py-11">
      {/* Szkic w tle, jak w referencji (prawa strona nagłówka) */}
      <AnimatedDrawing viewBox="0 0 400 120" className="pointer-events-none absolute top-0 right-0 hidden h-[150px] w-[500px] lg:block" aria-hidden="true">
        <g fill="none" stroke="#8592a2" strokeWidth={0.6} opacity={0.6}>
          <path d="M40 60h120v40H40z" {...drawProps(0)} />
          <path d="M160 70h60v20h-60" {...drawProps(0.3)} />
          <path d="M20 80h380" strokeDasharray="10 3 2 3" strokeWidth={0.4} {...drawProps(0.1, 2)} />
          <path d="M260 20h90v50h-90z" {...drawProps(0.5)} />
          <circle cx={305} cy={45} r={14} {...drawProps(0.7)} />
          <path d="M40 50v-30M160 50v-30M40 26h120" strokeWidth={0.5} {...drawProps(0.9)} />
        </g>
      </AnimatedDrawing>
      <Container className="relative">
        <SectionHeading id="dlaczego-title" title="Dlaczego warto?" description="Wygoda, jakość i bezpieczeństwo — wszystko w jednym miejscu." />
        <ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {benefits.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="group flex items-center gap-4 rounded-lg border border-line bg-surface/80 p-4 shadow-card transition-[border-color,box-shadow] duration-300 hover:border-line-strong hover:shadow-raised"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-ink-800 transition-colors group-hover:border-ink-400">
                <Icon size={24} strokeWidth={1.4} />
              </span>
              <span>
                <span className="block text-[14px] font-semibold text-ink-900">{title}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-500">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
