import { chromium } from 'playwright';
import { preview } from 'vite';
import path from 'path';
import fs from 'fs';

async function main() {
  const server = await preview({
    preview: { port: 4173 },
  });

  const url = 'http://localhost:4173';
  console.log(`Server preview running at ${url}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  const screenshotsDir = path.resolve('test-results/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Capture full landing page
  const screenshotPath = path.join(screenshotsDir, 'sadapay_landing_clone.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to: ${screenshotPath}`);

  // 2. Click "Create Account" button in the navbar to open AuthModal
  const createAccountBtn = page.getByRole('button', { name: 'Create Account' }).first();
  if (await createAccountBtn.isVisible()) {
    await createAccountBtn.click();
    await page.waitForTimeout(500);
    const modalPath = path.join(screenshotsDir, 'sadapay_auth_modal.png');
    await page.screenshot({ path: modalPath });
    console.log(`Saved auth modal screenshot to: ${modalPath}`);
  }

  await browser.close();
  await server.httpServer.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
