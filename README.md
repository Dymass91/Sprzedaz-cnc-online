# VEXOR — platforma zamawiania części CNC

Frontend strony głównej VEXOR: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.
Wzorzec projektu graficznego: [`docs/reference/vexor-homepage-reference.png`](docs/reference/vexor-homepage-reference.png).

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build && npm start
```

Zmienne środowiskowe (opcjonalne):

| Zmienna | Opis |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Publiczny adres serwisu (metadane, sitemap). Domyślnie `http://localhost:3000`. |
| `NEXT_PUBLIC_API_URL` | Adres przyszłego backendu. Bez niego interfejs informuje, że wysyłka nie jest jeszcze aktywna. |

## Struktura

```
src/
  app/                    layout (fonty, metadane PL), strona główna, robots, sitemap, ikona
  config/site.ts          nawigacja, stopka, linki prawne i społecznościowe
  components/
    ui/                   przyciski, ikony, select, nagłówki sekcji, przewijana lista
    layout/               nagłówek (menu mobilne, wyszukiwarka, panel konta), stopka, newsletter
    sections/             sekcje strony głównej (każda w osobnym pliku)
    engineering/          EngineeringGrid, DimensionLine, TechnicalCrosshair,
                          BlueprintAnnotation, TechnicalSection, AnimatedDrawing
    illustrations/        części CNC generowane z geometrii izometrycznej (SVG)
  features/
    configurator/         stan konfiguratora (kontekst), dropzone, podgląd, parametry
    cad-files/            walidacja plików CAD (formaty, 50 MB, limit plików)
    materials/            katalog materiałów, gatunków i wykończeń
    quotes/               model zapytania i wyceny, punkt wysyłki (jeszcze niepodłączony)
    orders/               model zamówienia
    viewer-3d/            kontrakt przyszłego viewera Three.js i tryby widoku
  lib/
    geometry/iso.ts       rzut izometryczny, walce, otoczki — źródło ilustracji
    api/client.ts         punkt integracji z backendem
```

## Ilustracje i animacje

Części (korpus, kątownik, koło zębate, tuleja, kołnierz, bloki materiałów, sceny frezowania
i toczenia) są rysowane w SVG z prawdziwej geometrii 3D rzutowanej izometrycznie — są ostre
w każdej rozdzielczości i obsługują tryby: cieniowany, wymiary, przekrój, siatka.

Linie rysunku technicznego rysują się w czasie (`AnimatedDrawing` + `drawProps`) po wejściu
w widok. Wszystkie animacje respektują `prefers-reduced-motion`.

## Stan funkcji

Działa: konfigurator (upload z walidacją, lista plików, parametry, synchronizacja z kartami
materiałów, tryby widoku i zoom podglądu, walidacja zapytania), wyszukiwarka sekcji, menu
mobilne, galerie przewijane strzałkami, walidacja newslettera.

Demonstracyjne / do podłączenia: wysyłka zapytań i newslettera (nic nie jest wysyłane),
podgląd 3D plików klienta (model poglądowy), opinie klientów (oznaczony układ), galeria
realizacji (wizualizacje), podstrony prawne i firmowe, profile społecznościowe.
