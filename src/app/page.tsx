import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BenefitsSection } from "@/components/sections/BenefitsSection";
import { ConfiguratorSection } from "@/components/sections/ConfiguratorSection";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/hero/Hero";
import { MaterialsSection } from "@/components/sections/MaterialsSection";
import { OrderSteps } from "@/components/sections/OrderSteps";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { ShowcaseSection } from "@/components/sections/ShowcaseSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { ConfiguratorProvider } from "@/features/configurator/ConfiguratorContext";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="tresc">
        <Hero />
        <OrderSteps />
        {/* Konfigurator i karty materiałów dzielą stan wyboru materiału */}
        <ConfiguratorProvider>
          <ConfiguratorSection />
          <MaterialsSection />
        </ConfiguratorProvider>
        <ServicesSection />
        <ShowcaseSection />
        <BenefitsSection />
        <TestimonialsSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
