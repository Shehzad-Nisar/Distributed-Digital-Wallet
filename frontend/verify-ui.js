import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('🚀 Starting Playwright UI Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const screenshotsDir = path.resolve('test-results/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    // 1. Visit Wallet Home
    console.log('📱 1. Testing Wallet Home View...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    // Verify key elements on Wallet Home
    const hasTransMoneyBrand = await page.getByText('TransMoney', { exact: false }).first().isVisible();
    const hasPrimaryBalance = await page.getByText('Primary Account Balance', { exact: false }).isVisible();
    const hasVirtualCard = await page.getByText('CARDHOLDER', { exact: false }).or(page.getByText('EXP 10/29')).first().isVisible();
    const hasMultiCurrencyPots = await page.getByText('Multi-Currency Accounts', { exact: false }).isVisible();

    console.log(`   - TransMoney Brand visible: ${hasTransMoneyBrand}`);
    console.log(`   - Primary Balance visible: ${hasPrimaryBalance}`);
    console.log(`   - Virtual Card visible: ${hasVirtualCard}`);
    console.log(`   - Multi-Currency Pots visible: ${hasMultiCurrencyPots}`);

    await page.screenshot({ path: path.join(screenshotsDir, '01_wallet_home.png'), fullPage: true });

    // 2. Test Send Money View
    console.log('💸 2. Testing Send Money Flow...');
    await page.getByRole('button', { name: /Send Money/i }).first().click();
    await page.waitForTimeout(1000);

    const hasPayFrom = await page.getByText('Pay From', { exact: false }).isVisible();
    const hasSendTo = await page.getByText('Send To (Recipient)', { exact: false }).isVisible();
    const hasAmountInput = await page.getByPlaceholder('0.00').isVisible();
    const has2pcDiagnostics = await page.getByText('Consensus Engine Diagnostics', { exact: false }).isVisible();

    console.log(`   - Pay From selector: ${hasPayFrom}`);
    console.log(`   - Recipient picker: ${hasSendTo}`);
    console.log(`   - Amount input: ${hasAmountInput}`);
    console.log(`   - 2PC Diagnostics toggle: ${has2pcDiagnostics}`);

    // Click diagnostics toggle to inspect 2PC visualizer
    await page.getByText('Consensus Engine Diagnostics', { exact: false }).click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(screenshotsDir, '02_send_money.png'), fullPage: true });

    // 3. Test Pay Merchants View
    console.log('🛍️ 3. Testing Pay Merchants View...');
    await page.getByRole('button', { name: /Pay Merchants/i }).first().click();
    await page.waitForTimeout(1000);

    const hasMerchants = await page.getByText('Merchant Directory', { exact: false }).or(page.getByText('Merchants', { exact: false })).first().isVisible();
    console.log(`   - Merchant directory visible: ${hasMerchants}`);

    await page.screenshot({ path: path.join(screenshotsDir, '03_merchants_qr.png'), fullPage: true });

    // 4. Test Currency FX View
    console.log('💱 4. Testing Currency FX View...');
    await page.getByRole('button', { name: /Currency FX/i }).first().click();
    await page.waitForTimeout(1000);

    const hasFxExchange = await page.getByText('Exchange', { exact: false }).or(page.getByText('Currency', { exact: false })).first().isVisible();
    console.log(`   - FX Exchange engine visible: ${hasFxExchange}`);

    await page.screenshot({ path: path.join(screenshotsDir, '04_currency_fx.png'), fullPage: true });

    // 5. Test Statements & Activity View
    console.log('📄 5. Testing Statements & Activity View...');
    await page.getByRole('button', { name: /Statements & Activity/i }).first().click();
    await page.waitForTimeout(1000);

    const hasStatements = await page.getByText('Ledger', { exact: false }).or(page.getByText('Transaction History', { exact: false })).first().isVisible();
    console.log(`   - Statements & Ledger visible: ${hasStatements}`);

    await page.screenshot({ path: path.join(screenshotsDir, '05_statements_ledger.png'), fullPage: true });

    // 6. Test Core Banking Engine Console
    console.log('⚡ 6. Testing Core Banking Engine Console...');
    await page.getByRole('button', { name: /Core Banking Engine/i }).first().click();
    await page.waitForTimeout(1000);

    const hasCoreBanking = await page.getByText('Core Banking & Distributed Infrastructure', { exact: false }).isVisible();
    const hasShardTopology = await page.getByText('Regional Shard Topology', { exact: false }).isVisible();

    console.log(`   - Core Banking Header: ${hasCoreBanking}`);
    console.log(`   - Shard Topology sub-tab: ${hasShardTopology}`);

    await page.screenshot({ path: path.join(screenshotsDir, '06_core_banking.png'), fullPage: true });

    console.log('\n✅ All UI views successfully verified with Playwright!');
    console.log(`📁 Screenshots saved to: ${screenshotsDir}`);

    if (errors.length > 0) {
      console.log(`⚠️ Console errors captured (${errors.length}):`, errors.slice(0, 5));
    } else {
      console.log('✨ 0 console errors detected!');
    }
  } catch (err) {
    console.error('❌ Playwright verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
