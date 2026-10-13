import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FileDropzone } from "@/features/configurator/components/FileDropzone";
import { ParametersPanel } from "@/features/configurator/components/ParametersPanel";
import { PartPreview } from "@/features/configurator/components/PartPreview";

export function ConfiguratorSection() {
  return (
    <section id="konfigurator" aria-labelledby="konfigurator-title" className="relative py-9 lg:py-12">
      <Container className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.55fr)_minmax(0,1.05fr)] lg:gap-x-7">
        <SectionHeading
          id="konfigurator-title"
          title="Konfigurator CNC"
          description="Wgraj swój projekt, ustaw parametry i poproś o wycenę."
          className="lg:col-span-2"
        />
        <div className="lg:col-start-1 lg:row-start-2">
          <FileDropzone />
        </div>
        <div className="lg:col-start-2 lg:row-start-2">
          <PartPreview />
        </div>
        <div className="lg:col-start-3 lg:row-span-2 lg:row-start-1">
          <ParametersPanel />
        </div>
      </Container>
    </section>
  );
}
