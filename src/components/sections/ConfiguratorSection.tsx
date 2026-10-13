"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useConfigurator } from "@/features/configurator/ConfiguratorContext";
import { AnalysisPanel } from "@/features/configurator/components/AnalysisPanel";
import { ModelPreview } from "@/features/configurator/components/ModelPreview";
import { ModelUpload } from "@/features/configurator/components/ModelUpload";
import { ParametersPanel } from "@/features/configurator/components/ParametersPanel";
import { InquiryForm } from "@/features/inquiry/components/InquiryForm";

export function ConfiguratorSection() {
  const { state } = useConfigurator();
  // Po pierwszym otwarciu formularz zostaje w drzewie (stan React bez localStorage).
  const [inquiryVisited, setInquiryVisited] = useState(false);
  if (state.inquiryOpen && !inquiryVisited) setInquiryVisited(true);
  return (
    <section id="konfigurator" aria-labelledby="konfigurator-title" className="relative py-9 lg:py-12">
      <Container>
        {/* Kolejność w DOM = kolejność na telefonie: plik → podgląd → wymiary → parametry. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.55fr)_minmax(0,1.05fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-7 lg:gap-y-4">
          <SectionHeading
            id="konfigurator-title"
            title="Konfigurator CNC"
            description="Wgraj plik STEP lub STL, obejrzyj model w 3D, ustaw parametry i przygotuj zapytanie o wycenę."
            className="lg:col-span-2 lg:mb-2"
          />
          <div className="lg:col-start-1 lg:row-start-2">
            <ModelUpload />
          </div>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-2">
            <ModelPreview />
          </div>
          <div className="lg:col-start-1 lg:row-start-3 lg:self-start">
            <AnalysisPanel />
          </div>
          <div className="lg:col-start-3 lg:row-span-3 lg:row-start-1">
            <ParametersPanel />
          </div>
        </div>
        {/* Formularz pozostaje zamontowany po zamknięciu — wpisane dane nie giną (tylko pamięć, bez zapisu). */}
        {state.inquiryOpen || inquiryVisited ? <InquiryForm hidden={!state.inquiryOpen} /> : null}
      </Container>
    </section>
  );
}
