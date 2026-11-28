import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const CHROME_EXE = "C:\\Users\\guess\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe";

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME_EXE });
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 1 });
  const pg = await context.newPage();
  await pg.goto(`${BASE}/`, { waitUntil: "load", timeout: 60000 });
  await pg.waitForTimeout(1500);

  const overflow = await pg.evaluate(() => {
    const iw = window.innerWidth;
    const results = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let el;
    while ((el = walker.nextNode())) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      // element extends beyond right edge of viewport
      if (r.right > iw + 3) {
        results.push({
          tag: el.tagName,
          class: el.className ? el.className.slice(0, 60) : "",
          id: el.id || "",
          right: Math.round(r.right),
          width: Math.round(r.width),
          left: Math.round(r.left),
          style: (el.getAttribute("style") || "").slice(0, 80),
        });
      }
    }
    // sort by how far right they extend
    results.sort((a, b) => b.right - a.right);
    return { innerWidth: iw, scrollWidth: document.documentElement.scrollWidth, overflow: results.slice(0, 20) };
  });
  console.log(JSON.stringify(overflow, null, 2));

  await context.close();
  await browser.close();
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
