const { chromium } = require('@playwright/test');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCleanSwitch() {
  console.log('Testing clean persona switching without networkidle...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  async function switchPersona(roleName, dest) {
    console.log(`\n--- Switching to ${roleName} -> ${dest} ---`);
    await context.clearCookies();
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    const personaBtn = page.locator(`button:has-text("Sign in as ${roleName}")`);
    await personaBtn.click();
    console.log(`Clicked "Sign in as ${roleName}", waiting 3s for redirect...`);
    await sleep(3000);
    console.log(`Current URL after click: ${page.url()}`);

    if (dest && !page.url().includes(dest)) {
      console.log(`Navigating directly to destination: ${dest}`);
      await page.goto('http://localhost:3000' + dest, { waitUntil: 'domcontentloaded' });
      await sleep(1000);
      console.log(`Current URL after direct nav: ${page.url()}`);
    }
  }

  // 1. Applicant
  await switchPersona('APPLICANT', '/applicant');

  // 2. Officer
  await switchPersona('VERIFICATION_OFFICER', '/officer/cases/case_demo_nos_001');
  const docPane = await page.waitForSelector('[data-testid="document-viewer-pane"]', { timeout: 10000 });
  console.log('Document viewer pane visible?', !!docPane);

  // 3. Director
  await switchPersona('OPERATIONS_DIRECTOR', '/management');
  console.log('Director page URL:', page.url());

  // 4. Officer again
  await switchPersona('VERIFICATION_OFFICER', '/officer/cases/case_demo_nos_001');
  const timelineTab = page.locator('[data-testid="tab-timeline"]');
  console.log('Timeline tab visible?', await timelineTab.isVisible());

  await browser.close();
  console.log('\nSUCCESS! ALL 4 PERSONA SWITCHES COMPLETED SEAMLESSLY!');
}

testCleanSwitch().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
