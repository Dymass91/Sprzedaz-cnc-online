// Kopiuje silnik OCCT (WASM) z node_modules do public/vendor — serwowany jako
// plik statyczny i ładowany przez worker dopiero przy pierwszym pliku STEP.
// Biblioteka jest dystrybuowana bez zmian, razem z licencjami (LGPL-2.1).
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("occt-import-js/package.json"));
const { version } = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const target = join(process.cwd(), "public", "vendor", "occt-import-js", version);
mkdirSync(target, { recursive: true });
for (const file of ["occt-import-js.js", "occt-import-js.wasm", "license.occt-import-js.txt", "license.occt.txt"]) {
  copyFileSync(join(pkgDir, "dist", file), join(target, file));
}
console.log(`occt-import-js ${version} → public/vendor/occt-import-js/${version}`);
