const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("Sign in as VERIFICATION_OFFICER")');
  await page.click('button:has-text("Sign in as VERIFICATION_OFFICER")');
  await new Promise(r => setTimeout(r, 2500));

  console.log('Navigating directly to case...');
  const t0 = Date.now();
  await page.goto('http://localhost:3000/officer/cases/case_demo_nos_001', { waitUntil: 'domcontentloaded' });
  const el = await page.waitForSelector('[data-testid="document-viewer-pane"], [data-testid="split-screen-workspace-container"]', { timeout: 20000 });
  console.log('Found element in', Date.now() - t0, 'ms. Visible?', !!el);
  await browser.close();
})();
