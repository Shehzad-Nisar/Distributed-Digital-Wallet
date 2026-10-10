import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('🚀 Running Playwright verification for Option B Home Screen...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // HiDPI crisp capture
  });
  const page = await context.newPage();

  const screenshotsDir = path.resolve('test-results/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check key Option B elements
    const brand = await page.getByText('TransMoney').first().isVisible();
    const availableBalance = await page.getByText('Available Balance').first().isVisible();
    const multiCurrency = await page.getByText('Multi-Currency Accounts').first().isVisible();
    const recentActivity = await page.getByText('Recent Activity').first().isVisible();

    console.log(`- TransMoney brand visible: ${brand}`);
    console.log(`- Available Balance visible: ${availableBalance}`);
    console.log(`- Multi-Currency Accounts visible: ${multiCurrency}`);
    console.log(`- Recent Activity visible: ${recentActivity}`);

    const screenshotPath = path.join(screenshotsDir, '01_wallet_home_option_b.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ Saved screenshot to: ${screenshotPath}`);

    // Also toggle card details to verify dynamic state
    const cardToggle = page.getByRole('button', { name: /Show Card Details/i });
    if (await cardToggle.isVisible()) {
      await cardToggle.click();
      await page.waitForTimeout(500);
      const cardDetailsPath = path.join(screenshotsDir, '01_wallet_home_option_b_card_revealed.png');
      await page.screenshot({ path: cardDetailsPath, fullPage: true });
      console.log(`✅ Saved card details revealed screenshot to: ${cardDetailsPath}`);
    }

  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
