import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:3000";
const CHROME_EXE = "C:\\Users\\guess\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe";
const viewports = [
  { name: "360x800", width: 360, height: 800 },
  { name: "412x924", width: 412, height: 924 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
];
const pages = ["/", "/compress-pdf", "/pdf-to-word"];
const outDir = "screenshots";
fs.mkdirSync(outDir, { recursive: true });

const flags = {};

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME_EXE });
  for (const page of pages) {
    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const pg = await context.newPage();
      await pg.goto(`${BASE}${page}`, { waitUntil: "load", timeout: 60000 });
      await pg.waitForTimeout(1200);

      const safe = page.replace(/\//g, "_") || "home";
      await pg.screenshot({ path: `${outDir}/${safe}_${vp.name}.png`, fullPage: true });

      if (vp.width === 360) {
        const pageFlags = await pg.evaluate(() => {
          const fl = [];
          const sw = document.documentElement.scrollWidth;
          const iw = window.innerWidth;
          if (sw > iw + 2) fl.push(`overflow: scrollWidth=${sw} innerWidth=${iw}`);
          // text elements wrapping one-letter-per-line: width<120 and textLength>12
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
          let el;
          while ((el = walker.nextNode())) {
            if (!el.textContent || el.textContent.trim().length <= 12) continue;
            const cs = window.getComputedStyle(el);
            const r = el.getBoundingClientRect();
            // only leaf-ish text containers
            if (r.width < 120 && r.height > 0) {
              fl.push(`narrowText width=${Math.round(r.width)} text="${el.textContent.trim().slice(0,40)}" tag=${el.tagName}`);
            }
            // cards narrower than 240
            if (el.className && /card|Card/.test(el.className) && r.width < 240 && r.width > 0) {
              fl.push(`cardNarrow width=${Math.round(r.width)} class=${el.className.slice(0,60)}`);
            }
          }
          return fl;
        });
        flags[`${page} @ 360x800`] = pageFlags;
      }
      await context.close();
    }
  }
  try { await browser.close(); } catch {}
  console.log("===== FLAGS AT 360px =====");
  let total = 0;
  for (const [k, v] of Object.entries(flags)) {
    console.log(`\n${k}: ${v.length} flags`);
    for (const f of v) { console.log("  -", f); total++; }
  }
  console.log(`\nTOTAL FLAGS: ${total}`);
  console.log("Screenshots saved in ./" + outDir + "/");
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
