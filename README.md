# VEXOR — platforma zamawiania części CNC

Frontend strony głównej VEXOR: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.
Wzorzec projektu graficznego: [`docs/reference/vexor-homepage-reference.png`](docs/reference/vexor-homepage-reference.png).

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build    # kopiuje silnik CAD do public/vendor i eksportuje stronę do out/
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
    cad-files/            limity i formaty (config.ts), walidacja, parser STL, worker CAD (STEP/OCCT)
    project/              rekord projektu (plik + parametry + analiza CAD) dla wyceny
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

Przepływ: plik STEP/STP lub STL → analiza w Web Workerze → podgląd 3D → parametry → podsumowanie → formularz zapytania.

### Architektura analizy CAD

| Format | Silnik | Gdzie działa |
| --- | --- | --- |
| STEP / STP (ISO 10303-21) | Open CASCADE w WebAssembly — [`occt-import-js`](https://github.com/kovacsv/occt-import-js) 0.0.23 | Web Worker w przeglądarce |
| STL (binarny, ASCII) | własny parser | Web Worker w przeglądarce |

Dlaczego w przeglądarce, a nie na serwerze:

- **Cloudflare Pages** to hosting statyczny — nie uruchomi pythonOCC ani natywnego OCCT. Plik WASM (7,6 MB) mieści się w limicie 25 MiB na plik.
- **Poufność:** projekt klienta nie opuszcza jego urządzenia — brak uploadu i usług zewnętrznych.
- Silnik jest ładowany dopiero przy pierwszym pliku STEP i utrzymywany w workerze przez sesję.

Przebieg: STEP → odczyt B-Rep i triangulacja OCCT (jednostki z pliku → mm, ugięcie 0,1% przekątnej) →
siatka bez indeksów (ten sam format co STL) → wspólna analiza (`src/features/geometry/analyzeMesh.ts`) → wspólny viewer.

### Co jest analizowane

- Wymiary gabarytowe, pole powierzchni, liczba rozłącznych brył, liczba obiektów i ścian B-Rep (STEP).
- Objętość — tylko dla geometrii zamkniętej, z triangulacji (przybliżenie; dla kostki 10 mm wynik 1000,000 mm³).
- **Otwory nie są rozpoznawane** — `occt-import-js` udostępnia triangulację, ale nie typy powierzchni B-Rep. Panel pokazuje „do oceny technologa”.
- Każda wartość ma pochodzenie (`automatic` / `user` / `unavailable`) i status weryfikacji `unverified` — zob. `src/features/project/types.ts`.

### Bezpieczeństwo i limity (`src/features/cad-files/config.ts`)

- Format rozpoznawany po zawartości (nagłówek `ISO-10303-21;`, struktura STL), nie po rozszerzeniu.
- STEP do 30 MB, STL do 50 MB, maks. 2,5 mln trójkątów, limit czasu analizy STEP 120 s (worker jest wtedy kończony).
- Anulowanie i ponowienie analizy; błędy plików (uszkodzony, fałszywy, STEP XML, brak geometrii) mają osobne komunikaty.
- Modele nie są nigdzie zapisywane ani wysyłane; formularz trzyma dane wyłącznie w pamięci.

### Wymagania wdrożeniowe

- `npm ci && npm run build` — skrypt `prebuild` kopiuje silnik z `node_modules/occt-import-js/dist` do `public/vendor/occt-import-js/<wersja>/`
  (katalog jest w `.gitignore`). Wersja w `CAD_ENGINE` (`config.ts`) musi odpowiadać wersji pakietu.
- Serwer musi podawać `.wasm` z typem `application/wasm` (Cloudflare Pages robi to domyślnie).
- Licencja: `occt-import-js` i Open CASCADE są na **LGPL-2.1** — biblioteka jest dystrybuowana bez zmian, jako osobne pliki,
  razem z tekstami licencji (`public/vendor/.../license.*.txt`).
- Turbopack kopiuje dodatkowo źródła workerów (`*.worker.ts`) do `_next/static/media` — nie zawierają danych ani sekretów.

### Testowanie

1. `npm run dev`, sekcja „Konfigurator CNC”.
2. Pliki STEP do testów: `node_modules/occt-import-js/test/testfiles/` (np. `cube-10x10mm/Cube 10x10.stp`, `cax-if/as1-oc-214.stp`).
3. Sprawdź panel „Analiza projektu”, podgląd (obrót, zoom, reset, siatka, wymiary), parametry, „Przejdź do zapytania”.

## Wymaga backendu (kolejne etapy)

- **Usługa CAD na serwerze** (kontener z OCCT, np. Cloudflare Containers / Fly.io / VPS — nie Pages):
  dokładna objętość (`GProp`), rozpoznawanie otworów i gwintów, cechy obróbkowe, STEP → glTF, dokumentacja PDF.
  Powinna ponawiać analizę zamiast ufać danym z przeglądarki.
- Wysyłka zapytań i plików (prywatny magazyn, np. R2 z podpisanymi adresami), wyceny (`src/features/pricing/types.ts`),
  konta, zamówienia, płatności, newsletter.
