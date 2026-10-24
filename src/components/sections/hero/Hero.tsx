import { EngineeringGrid } from "@/components/engineering";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CalendarIcon, GaugeIcon, TruckIcon } from "@/components/ui/icons";
import { EngineHero } from "@/components/hero-engine/EngineHero";

const highlights = [
  { icon: GaugeIcon, title: "Wycena online", text: "bez zbędnych formalności" },
  { icon: CalendarIcon, title: "Termin realizacji", text: "znany już w wycenie" },
  { icon: TruckIcon, title: "Wysyłka", text: "na terenie całej Polski" },
];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <EngineeringGrid fade="bottom" />
      <Container className="relative grid items-center gap-8 pt-10 pb-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-2 lg:pt-10 lg:pb-10">
        <div className="relative z-10 animate-fade-up">
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-ink-600 uppercase">
            <span aria-hidden="true" className="h-px w-5 bg-ink-400" />
            Frezowanie CNC / Toczenie CNC
          </p>
          <h1
            id="hero-title"
            className="mt-5 font-display text-[clamp(30px,9.4vw,42px)] leading-[1.02] font-semibold tracking-[0.005em] uppercase sm:text-[56px] lg:text-[52px] lg:whitespace-nowrap xl:text-[60px]"
          >
            <span className="block text-ink-600">Twoje pomysły.</span>
            <span className="block text-ink-900">Nasza precyzja.</span>
          </h1>
          <p className="mt-6 max-w-[400px] text-[16px] leading-relaxed text-ink-700 sm:text-[17px]">
            Części CNC na zamówienie — szybko, precyzyjnie,{" "}
            <span className="font-medium text-ink-900">bez zbędnych formalności.</span>
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <ButtonLink href="#konfigurator" size="lg" withArrow>
              Prześlij projekt
            </ButtonLink>
            <ButtonLink href="#jak-to-dziala" size="lg" variant="secondary">
              Zobacz jak to działa
            </ButtonLink>
          </div>
          <ul className="mt-10 grid max-w-[540px] grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong bg-surface/70 text-ink-800">
                  <Icon size={18} />
                </span>
                <span className="text-[12.5px] leading-snug text-ink-600">
                  <span className="block font-medium text-ink-900">{title}</span>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative -mx-4 sm:mx-0 lg:-mr-6 xl:-mr-10 min-[1400px]:-mr-16">
          <EngineHero />
        </div>
      </Container>
    </section>
  );
}
