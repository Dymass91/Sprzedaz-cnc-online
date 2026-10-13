import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MillingScene, TurningScene } from "@/components/illustrations/scenes/ServiceScenes";
import { ServiceCard } from "./ServiceCard";

const services = [
  {
    id: "frezowanie",
    title: "Frezowanie CNC",
    points: ["Od prostych elementów po skomplikowane geometrie", "Wysoka precyzja", "Możliwość obróbki 3D i 5-osiowej"],
    details:
      "Typowe części: korpusy, płyty, wsporniki, obudowy, kieszenie i gniazda. Dostępne wymiary, tolerancje i technologię potwierdzamy indywidualnie w wycenie.",
    scene: <MillingScene />,
  },
  {
    id: "toczenie",
    title: "Toczenie CNC",
    points: ["Wałki, tuleje, pierścienie i więcej", "Szybko i precyzyjnie", "Idealne dla elementów obrotowych"],
    details:
      "Typowe części: wałki, tuleje, sworznie, kołnierze i złączki. Możliwe połączenie toczenia z frezowaniem w jednej części — zapytaj w wycenie.",
    scene: <TurningScene />,
  },
];

export function ServicesSection() {
  return (
    <section id="uslugi" aria-labelledby="uslugi-title" className="relative py-9 lg:py-12">
      <Container>
        <SectionHeading id="uslugi-title" title="Nasze usługi" description="Nowoczesna obróbka CNC dla Twoich projektów." />
        <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {services.map((s) => (
            <ServiceCard key={s.id} {...s} />
          ))}
        </div>
      </Container>
    </section>
  );
}
