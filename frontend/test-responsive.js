import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function testResponsive() {
  const browser = await chromium.launch({ headless: true });
  const url = 'http://localhost:5173';

  const screenshotsDir = path.resolve('test-results/screenshots/responsive');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const viewports = [
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'desktop_1440', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const shotPath = path.join(screenshotsDir, `${vp.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`Captured ${vp.name} to: ${shotPath}`);
    await context.close();
  }

  await browser.close();
  console.log('All responsive tests completed.');
}

testResponsive().catch((err) => {
  console.error(err);
  process.exit(1);
});
