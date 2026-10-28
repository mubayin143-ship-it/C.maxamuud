const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const viewports = [360, 375, 390, 412];
  
  for (const width of viewports) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    await page.goto('http://localhost:3000/?screen=teacher_home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Check horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Viewport ${width}px: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}, overflow=${scrollWidth > clientWidth}`);
    
    await page.screenshot({ path: `header-${width}-current.png` });
    await page.close();
  }
  
  await browser.close();
})();
