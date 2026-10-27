import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:5000');
  await page.waitForLoadState('networkidle');
  
  // Wait for game to load
  try {
    await page.waitForSelector('[data-testid="game"]', { timeout: 10000 });
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Game loaded, screenshot taken');
  } catch(e) {
    console.log('Game did not load in time:', e.message);
  }
  
  await browser.close();
})();
