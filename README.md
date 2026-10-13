# VEXOR — platforma zamawiania części CNC

Frontend strony głównej VEXOR: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.
Wzorzec projektu graficznego: [`docs/reference/vexor-homepage-reference.png`](docs/reference/vexor-homepage-reference.png).

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build    # eksport statyczny do out/
```

Zmienne środowiskowe (opcjonalne):

| Zmienna | Opis |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Publiczny adres serwisu (metadane). Domyślnie `https://vexor-cnc.pages.dev`. |
| `NEXT_PUBLIC_API_URL` | Adres przyszłego backendu. Bez niego interfejs informuje, że wysyłka nie jest jeszcze aktywna. |

## Hosting

Produkcja: **https://vexor-cnc.pages.dev** (Cloudflare Pages, projekt `vexor-cnc`).
Push na `main` uruchamia [deploy.yml](.github/workflows/deploy.yml) — wymaga sekretów repozytorium
`CLOUDFLARE_API_TOKEN` (uprawnienie: Cloudflare Pages → Edit) i `CLOUDFLARE_ACCOUNT_ID`.

## Struktura

```
src/
  app/                    layout (fonty, metadane PL), strona główna, ikona (robots.txt w public/)
  config/site.ts          nawigacja, stopka, linki prawne i społecznościowe
  components/
    ui/                   przyciski, ikony, select, nagłówki sekcji, przewijana lista
    layout/               nagłówek (menu mobilne, wyszukiwarka, panel konta), stopka, newsletter
    sections/             sekcje strony głównej (każda w osobnym pliku)
    engineering/          EngineeringGrid, DimensionLine, TechnicalCrosshair,
                          BlueprintAnnotation, TechnicalSection, AnimatedDrawing
    illustrations/        części CNC generowane z geometrii izometrycznej (SVG)
  features/
    cad-files/            limity i formaty (config.ts), walidacja, parser STL + Web Worker
    geometry/             analiza siatki (gabaryty, topologia, objętość), jednostki
    viewer-3d/            viewer Three.js / React Three Fiber (ładowany leniwie)
    configurator/         stan, opcje zamówienia, migawka konfiguracji, komponenty UI
    inquiry/              formularz zapytania, walidacja, punkt integracji API
    pricing/              typy przyszłego silnika wycen (bez implementacji)
    materials/            katalog materiałów (sekcja „Wybierz materiał”)
    orders/               model zamówienia
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

## Konfigurator CNC

Przepływ: plik STL → analiza w Web Workerze → podgląd 3D → jednostki → parametry → podsumowanie → formularz zapytania.

- **Formaty:** wyłącznie STL (binarny i ASCII). Limity w [`src/features/cad-files/config.ts`](src/features/cad-files/config.ts).
  STEP/IGES wymagają Open CASCADE (WASM w workerze lub konwersja na serwerze) — pliki te są rozpoznawane i odrzucane z konkretnym komunikatem.
- **Analiza:** bounding box, pole powierzchni, topologia (krawędzie brzegowe, niemanifoldowe, niespójna orientacja).
  Objętość tylko dla siatki zamkniętej i spójnej — w przeciwnym razie „nie do ustalenia” z podanym powodem.
- **Jednostki:** STL ich nie zapisuje — użytkownik wybiera mm/cm/m/cal i musi je potwierdzić przed zapytaniem.
- **Viewer:** Three.js + React Three Fiber, ładowany dopiero po wczytaniu modelu, `frameloop="demand"`,
  orbit/zoom/pan (także dotyk), reset kamery, widok pełny/siatka, wymiary gabarytowe, zwalnianie geometrii przy usunięciu.
- **Zapytanie:** formularz z walidacją; wysyłka nieaktywna (`submitInquiry` zwraca `not-connected`), dane nie są zapisywane.

### Testowanie

1. `npm run dev`, przejdź do sekcji „Konfigurator CNC”.
2. Przeciągnij plik STL (np. eksport z dowolnego CAD). Sprawdź wymiary, objętość i status siatki.
3. Obracaj model (przeciągnij), przybliżaj (kółko/szczypanie), przesuwaj (prawy przycisk/dwa palce), użyj „Reset kamery”, „Siatka”, „Wymiary”.
4. Zmień jednostki i potwierdź je, ustaw parametry, kliknij „Przejdź do zapytania”, wypełnij formularz.

## Wymaga backendu

Wysyłka zapytań i plików (magazyn plików, API, e-mail), wyceny (silnik po stronie serwera — `src/features/pricing/types.ts`),
konwersja STEP, konta klientów, zamówienia i płatności, newsletter.
