import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const CHROME_EXE = "C:\\Users\\guess\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe";

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME_EXE });
  for (const page of ["/", "/compress-pdf"]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const pg = await context.newPage();
    await pg.goto(`${BASE}${page}`, { waitUntil: "load", timeout: 60000 });
    await pg.waitForTimeout(1000);
    const info = await pg.evaluate(() => {
      const iw = window.innerWidth;
      const sw = document.documentElement.scrollWidth;
      let over = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let el;
      while ((el = walker.nextNode())) {
        const r = el.getBoundingClientRect();
        if (r.right > iw + 3) over.push({ tag: el.tagName, right: Math.round(r.right), class: (el.className||"").slice(0,40) });
      }
      return { innerWidth: iw, scrollWidth: sw, overflow: over.slice(0,10) };
    });
    console.log(`DESKTOP 1440 ${page}:`, JSON.stringify(info));
    await context.close();
  }
  try { await browser.close(); } catch {}
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
