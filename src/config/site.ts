/**
 * Globalna konfiguracja serwisu VEXOR: metadane, nawigacja, stopka.
 * Linki z `href: null` to miejsca przygotowane na przyszłe podstrony —
 * renderujemy je jako nieaktywne, zamiast prowadzić donikąd.
 */

export const siteConfig = {
  name: "VEXOR",
  tagline: "CNC Manufacturing",
  title: "VEXOR — części CNC na zamówienie online",
  description:
    "Zamów części wykonywane metodą obróbki CNC przez internet. Prześlij projekt CAD, wybierz materiał, tolerancje i wykończenie, a my zorganizujemy produkcję i dostawę w całej Polsce.",
  locale: "pl_PL",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** Rok w stopce — stała, aby nie wywoływać `new Date()` podczas prerenderu. */
  copyrightYear: 2026,
} as const;

export type NavLink = {
  label: string;
  href: string | null;
};

export const mainNav: NavLink[] = [
  { label: "Usługi", href: "#uslugi" },
  { label: "Jak to działa?", href: "#jak-to-dziala" },
  { label: "Materiały", href: "#materialy" },
  { label: "Realizacje", href: "#realizacje" },
  { label: "Wiedza", href: "#wiedza" },
  { label: "Ceny", href: "#konfigurator" },
  { label: "Kontakt", href: "#kontakt" },
];

export const footerNav: { id: string; title: string; links: NavLink[] }[] = [
  {
    id: "uslugi-stopka",
    title: "Usługi",
    links: [
      { label: "Frezowanie CNC", href: "#uslugi" },
      { label: "Toczenie CNC", href: "#uslugi" },
      { label: "Materiały", href: "#materialy" },
      { label: "Wycena online", href: "#konfigurator" },
    ],
  },
  {
    id: "firma",
    title: "Firma",
    links: [
      { label: "O nas", href: null },
      { label: "Realizacje", href: "#realizacje" },
      { label: "Kariera", href: null },
      { label: "Kontakt", href: "#kontakt" },
    ],
  },
  {
    id: "wiedza",
    title: "Wiedza",
    links: [
      { label: "Poradniki", href: null },
      { label: "FAQ", href: null },
      { label: "Słownik pojęć", href: null },
      { label: "Blog", href: null },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: "Polityka prywatności", href: null },
  { label: "Regulamin", href: null },
  { label: "Cookies", href: null },
];

/** Profile społecznościowe — uzupełnić adresy, gdy profile zostaną założone. */
export const socialProfiles: { id: "instagram" | "youtube" | "linkedin"; label: string; href: string | null }[] = [
  { id: "instagram", label: "Instagram", href: null },
  { id: "youtube", label: "YouTube", href: null },
  { id: "linkedin", label: "LinkedIn", href: null },
];
