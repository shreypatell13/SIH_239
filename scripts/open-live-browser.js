const { chromium } = require('@playwright/test');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('1. Launching visible headed browser (1440x900)...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  console.log('2. Navigating to login page: http://localhost:3000/login');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("Sign in as VERIFICATION_OFFICER")', { timeout: 15000 });
  await sleep(1000);

  console.log('3. Clicking VERIFICATION_OFFICER persona button...');
  const personaBtn = page.locator('button:has-text("Sign in as VERIFICATION_OFFICER")');
  await personaBtn.click();
  await sleep(2500);

  console.log('4. Navigating to officer case: http://localhost:3000/officer/cases/case_demo_nos_001');
  await page.goto('http://localhost:3000/officer/cases/case_demo_nos_001', { waitUntil: 'domcontentloaded' });
  
  await page.waitForSelector('[data-testid="split-screen-workspace-container"]', { timeout: 20000 });
  await page.waitForSelector('[data-testid="document-viewer-pane"]', { timeout: 20000 });
  console.log('5. Split-screen workspace container and document viewer pane loaded successfully.');

  // Select casteCategory so the bounding box and provenance card are highlighted
  await sleep(1500);
  const casteTab = page.locator('[data-testid="doc-tab-CASTE_CERTIFICATE"]');
  if (await casteTab.isVisible()) {
    await casteTab.click();
    await sleep(1000);
  }

  const casteCategoryBox = page.locator('[data-testid="bbox-casteCategory"]');
  if (await casteCategoryBox.isVisible()) {
    await casteCategoryBox.hover();
    await sleep(1000);
    await casteCategoryBox.click();
    console.log('6. Caste Category bounding box clicked and Evidence Provenance Card displayed.');
  }

  console.log('7. Live browser is open at http://localhost:3000/officer/cases/case_demo_nos_001. Keeping session alive.');
  while (true) {
    await sleep(60000);
  }
}

main().catch(err => {
  console.error('Error opening browser:', err);
});
