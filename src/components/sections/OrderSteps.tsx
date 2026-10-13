import { EngineeringGrid } from "@/components/engineering";
import { Container } from "@/components/ui/Container";
import { CornerMarks } from "@/components/ui/CornerMarks";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRightIcon, CubeIcon, QuoteSheetIcon, SlidersIcon, UploadCloudIcon } from "@/components/ui/icons";

const steps = [
  { icon: UploadCloudIcon, title: "Prześlij projekt", text: "STEP, STP, STL, IGES, DXF lub OBJ" },
  { icon: SlidersIcon, title: "Wybierz parametry", text: "Materiał, ilość, tolerancje, wykończenie" },
  { icon: QuoteSheetIcon, title: "Otrzymaj wycenę", text: "Cenę i termin przygotujemy na podstawie projektu" },
  { icon: CubeIcon, title: "Zamów i czekaj na dostawę", text: "Produkcja i wysyłka na terenie całej Polski" },
];

export function OrderSteps() {
  return (
    <section id="jak-to-dziala" aria-labelledby="kroki-title" className="relative py-9 lg:py-12">
      <Container>
        <SectionHeading
          id="kroki-title"
          title="Zamówienie w 4 prostych krokach"
          description={
            <>
              Od projektu do gotowej części. <span className="font-medium text-ink-800">Prosto, sprawnie i bez zbędnych formalności.</span>
            </>
          }
        />
        <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="group relative">
              <div className="relative flex h-full flex-col items-center overflow-hidden rounded-lg border border-line bg-surface/75 px-5 pt-14 pb-6 text-center shadow-card transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised">
                <EngineeringGrid cell={14} major={4} fade="radial" className="opacity-70" />
                <CornerMarks className="text-ink-300" size={8} />
                <span className="absolute top-4 left-4 grid h-9 min-w-11 place-items-center rounded-md border border-line-strong bg-surface px-2 font-display text-lg font-medium text-ink-800">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="relative grid size-14 place-items-center text-ink-800 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <Icon size={40} strokeWidth={1.2} />
                </span>
                <h3 className="relative mt-4 text-[15px] font-semibold text-ink-900">{title}</h3>
                <p className="relative mt-1.5 max-w-[200px] text-[12.5px] leading-relaxed text-ink-500">{text}</p>
              </div>
              {i < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 -right-[30px] hidden -translate-y-1/2 items-center text-ink-400 lg:flex"
                >
                  <span className="h-px w-3 border-t border-dashed border-ink-300" />
                  <ArrowRightIcon size={16} />
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
