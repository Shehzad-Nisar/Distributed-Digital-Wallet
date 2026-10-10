import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('🚀 Running Playwright verification for complete redesign...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const screenshotsDir = path.resolve('test-results/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    const screenshotPath = path.join(screenshotsDir, '01_wallet_home_redesign.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ Saved main redesign screenshot to: ${screenshotPath}`);

    // Click Virtual Card tab
    const virtualCardTab = page.getByRole('button', { name: /Virtual/i });
    if (await virtualCardTab.isVisible()) {
      await virtualCardTab.click();
      await page.waitForTimeout(600);
      const virtualScreenshotPath = path.join(screenshotsDir, '02_wallet_home_virtual_card.png');
      await page.screenshot({ path: virtualScreenshotPath, fullPage: true });
      console.log(`✅ Saved virtual card screenshot to: ${virtualScreenshotPath}`);
    }

  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
