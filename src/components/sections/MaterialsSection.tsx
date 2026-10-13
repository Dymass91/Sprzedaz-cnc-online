"use client";

import { cn } from "@/lib/cn";
import { MaterialBlock } from "@/components/illustrations/parts/IsoParts";
import { Container } from "@/components/ui/Container";
import { CornerMarks } from "@/components/ui/CornerMarks";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
import { useConfigurator } from "@/features/configurator/ConfiguratorContext";
import { finishLabels, getMaterial, materials } from "@/features/materials/data";
import { getMaterialOption } from "@/features/configurator/options";

export function MaterialsSection() {
  const { state, selectMaterialCategory } = useConfigurator();
  // Karta odpowiada grupie materiału wybranego w konfiguratorze.
  const activeCategory = getMaterialOption(state.material).category;
  const selected = getMaterial(activeCategory ?? "aluminium");

  return (
    <section id="materialy" aria-labelledby="materialy-title" className="relative py-9 lg:py-12">
      <Container>
        <SectionHeading
          id="materialy-title"
          title="Wybierz materiał"
          description="Pracujemy z najpopularniejszymi materiałami stosowanymi w przemyśle."
          action={
            <a href="#konfigurator" className="group inline-flex items-center gap-2 text-[13px] font-medium text-accent hover:text-accent-strong">
              Dobierz w konfiguratorze
              <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
            </a>
          }
        />

        <div role="group" aria-label="Materiał części" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {materials.map((m) => {
            const active = m.id === activeCategory;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => selectMaterialCategory(m.id)}
                className={cn(
                  "group relative flex flex-col rounded-lg border bg-surface p-3 text-left transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5",
                  active
                    ? "border-accent shadow-[0_0_0_3px_rgb(47_102_208/0.12),var(--shadow-card)]"
                    : "border-line shadow-card hover:border-line-strong hover:shadow-raised",
                )}
              >
                {active ? <CornerMarks className="text-accent" size={10} /> : null}
                <span className="block overflow-hidden rounded-md bg-gradient-to-b from-surface-muted to-surface-sunken px-3 pt-4 pb-2">
                  <MaterialBlock metal={m.visual} className="mx-auto max-w-[150px] transition-transform duration-500 group-hover:scale-[1.04]" />
                </span>
                <span className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[14px] font-semibold text-ink-900">{m.name}</span>
                  {active ? (
                    <span className="grid size-5 place-items-center rounded-full bg-accent text-white">
                      <CheckIcon size={13} strokeWidth={2.2} />
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 text-[12px] text-ink-500">{m.tagline}</span>
              </button>
            );
          })}
        </div>

        <div aria-live="polite" className="mt-5 grid gap-5 rounded-lg border border-line bg-surface/70 p-5 sm:p-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:gap-8">
          <div>
            <p className="font-display text-lg font-semibold text-ink-900 uppercase">{selected.name}</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">{selected.description}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] text-ink-400 uppercase">Przykładowe gatunki</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {selected.grades.map((g) => (
                <li key={g} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[12px] text-ink-700">
                  {g}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] text-ink-400 uppercase">Właściwości i wykończenia</p>
            <ul className="mt-2 space-y-1 text-[12.5px] text-ink-700">
              {selected.properties.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <CheckIcon size={14} className="text-accent" /> {p}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[12px] text-ink-500">{selected.finishes.map((f) => finishLabels[f]).join(" · ")}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
