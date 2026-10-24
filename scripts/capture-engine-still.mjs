// Generuje statyczny szkic silnika do hero (public/hero/engine-r4-sketch*.webp) z PRAWDZIWEJ sceny 3D:
// ta sama kamera, styl ołówka i poza startowa (wał 0°), przezroczyste tło, proporcje 2:1.
// Obraz jest wyświetlany do czasu odsłonięcia sceny Three.js — musi się z nią pokrywać.
// Gęstość kreskowania zależy od liczby pikseli na kreskę (wzór wygasza się poniżej rozdzielczości),
// dlatego kadr ma wysokość sceny w hero (480 px) i powstaje w dwóch gęstościach, jak canvas:
// 1× oraz 1,5× (limit DPR trybu ołówka w EngineScene).
//
// Użycie (strona musi działać, np. `npm run dev`):
//   node scripts/capture-engine-still.mjs [http://localhost:3000]
// Zmienna CHROME_PATH wskazuje przeglądarkę (domyślnie Chrome w Windows).
// Uruchom ponownie po każdej zmianie geometrii, kamery lub materiałów silnika.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.argv[2] ?? "http://localhost:3000";
const chrome = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT_DIR = join(process.cwd(), "public", "hero");
/** Rozmiar kadru w px CSS (proporcje 2:1, wysokość jak scena w hero od xl). */
const FRAME = { width: 960, height: 480 };
/** Warianty: gęstość pikseli zrzutu → plik. */
const VARIANTS = [
  { scale: 1, file: "engine-r4-sketch.webp" },
  { scale: 1.5, file: "engine-r4-sketch@1.5x.webp" },
];
const PORT = 9399;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(
  chrome,
  ["--headless=new", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(tmpdir(), `vexor-still-${Date.now()}`)}`, "about:blank"],
  { stdio: "ignore" },
);

try {
  let targets;
  for (let i = 0; i < 40 && !targets; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    } catch {
      await sleep(250);
    }
  }
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      pending.get(d.id)(d);
      pending.delete(d.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id;
      pending.set(i, r);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.result?.value;

  await send("Page.enable");
  // Ograniczony ruch: silnik zatrzymany w pozie startowej, szkic w pełni narysowany i zacieniowany.
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
  const capture = async (scale) => {
    await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 900, deviceScaleFactor: scale, mobile: false });
    await send("Page.navigate", { url });
    await sleep(500);

    for (let i = 0; i < 300 && (await ev(`document.querySelector("[data-engine-phase]")?.dataset.enginePhase`)) !== "ready"; i++) await sleep(100);
    if ((await ev(`document.querySelector("[data-engine-phase]")?.dataset.enginePhase`)) !== "ready") throw new Error("Scena silnika nie osiągnęła stanu ready.");

    // Tylko canvas, w kadrze 2:1, na przezroczystym tle.
    await ev(`(() => {
      const style = document.createElement("style");
      style.textContent = \`
        html, body { background: transparent !important; }
        body * { visibility: hidden !important; }
        [data-engine-phase] { position: fixed !important; inset: 0 auto auto 0 !important; width: ${FRAME.width}px !important; height: ${FRAME.height}px !important; aspect-ratio: auto !important; z-index: 2147483647; }
        [data-engine-phase] canvas { visibility: visible !important; }
      \`;
      document.head.appendChild(style);
      window.scrollTo(0, 0);
    })()`);
    await sleep(2000);

    const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: FRAME.width, height: FRAME.height, scale: 1 } });
    // Konwersja PNG → WebP (z kanałem alfa) w samej przeglądarce — bez dodatkowych zależności.
    const toWebp =
      "new Promise((resolve) => {" +
      "  const img = new Image();" +
      "  img.onload = () => {" +
      "    const c = document.createElement('canvas');" +
      "    c.width = img.width; c.height = img.height;" +
      "    c.getContext('2d').drawImage(img, 0, 0);" +
      // Miniatura 64×32 — rozmyty podgląd osadzany w HTML (widoczny od pierwszej klatki, przed pobraniem obrazu)
      "    const t = document.createElement('canvas'); t.width = 64; t.height = 32;" +
      "    t.getContext('2d').drawImage(img, 0, 0, 64, 32);" +
      "    resolve({ full: c.toDataURL('image/webp', 0.9).split(',')[1], tiny: t.toDataURL('image/webp', 0.6) });" +
      "  };" +
      `  img.src = 'data:image/png;base64,${shot.result.data}';` +
      "})";
    return ev(toWebp);
  };

  mkdirSync(OUT_DIR, { recursive: true });
  let tiny = "";
  for (const v of VARIANTS) {
    const result = await capture(v.scale);
    const buf = Buffer.from(result.full, "base64");
    writeFileSync(join(OUT_DIR, v.file), buf);
    if (v.scale === 1) tiny = result.tiny;
    console.log(`Zapisano public/hero/${v.file} (${Math.round(buf.length / 1024)} KB, ${FRAME.width * v.scale}×${FRAME.height * v.scale})`);
  }
  const meta = join(process.cwd(), "src", "components", "hero-engine", "engineStill.ts");
  writeFileSync(
    meta,
    `// Wygenerowane przez scripts/capture-engine-still.mjs — nie edytuj ręcznie.
` +
      `export const ENGINE_STILL = {
  src: "/hero/${VARIANTS[0].file}",
  src15x: "/hero/${VARIANTS[1].file}",
  width: ${FRAME.width},
  height: ${FRAME.height},
  blurDataURL: "${tiny}",
} as const;
`,
  );
  console.log(`Zapisano ${meta} (podgląd ${tiny.length} B)`);
  ws.close();
} finally {
  proc.kill();
}
