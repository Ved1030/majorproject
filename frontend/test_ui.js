const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`CONSOLE ERROR:`, msg.text());
    }
  });
  
  await page.goto('http://localhost:3000/pdf/split', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.resolve('D:/Projects/ZipDrop/test_pdfs/text_heavy.pdf'));
  console.log('File uploaded');
  
  // Poll for page count to appear (max 3s before HMR reload)
  let pageCountText = null;
  for (let i = 0; i < 3; i++) {
    await page.waitForTimeout(1000);
    const bodyText = await page.locator('body').textContent();
    const match = bodyText?.match(/(\d+) page/);
    if (match) {
      pageCountText = match[0];
      console.log(`Page count found after ${i+1}s: ${match[0]}`);
      break;
    }
    console.log(`Waiting for page count... (${i+1}s)`);
  }
  
  const allButtons = page.locator('button');
  const count = await allButtons.count();
  console.log(`\nTotal buttons: ${count}`);
  for (let i = 0; i < count; i++) {
    const btn = allButtons.nth(i);
    const disabled = await btn.getAttribute('disabled');
    const className = await btn.getAttribute('class');
    const text = await btn.textContent();
    console.log(`Button ${i}: disabled=${disabled}, text="${(text || '').trim()}", class="${className}"`);
  }
  
  await browser.close();
  process.exit(0);
})();
