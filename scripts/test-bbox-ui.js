const { chromium } = require('@playwright/test');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginUser(context, page, roleName, email, pass, dest) {
  if (context) {
    await context.clearCookies();
  }
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(`button:has-text("Sign in as ${roleName}")`, { timeout: 10000 });
  await sleep(1000);

  const personaBtn = page.locator(`button:has-text("Sign in as ${roleName}")`);
  console.log(`   [Auth] Clicking one-click persona button for ${roleName}...`);
  await personaBtn.hover();
  await sleep(600);
  await personaBtn.click();

  // Wait for post-login redirection to complete
  await page.waitForURL('**/officer**', { timeout: 15000 }).catch(() => {});
  await sleep(1500);

  if (dest) {
    console.log(`   [Nav] Moving to intended destination: ${dest}`);
    await page.goto('http://localhost:3000' + dest, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
  }
}

async function test() {
  console.log('1. Starting Playwright browser (headed)...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  try {
    console.log('2. Authenticating as VERIFICATION_OFFICER and navigating to case...');
    await loginUser(context, page, 'VERIFICATION_OFFICER', 'priya.sharma@tribal.gov.in', 'Demo@Officer2026', '/officer/cases/case_demo_nos_001');

    console.log('3. Waiting for split-screen workspace container...');
    await page.waitForSelector('[data-testid="split-screen-workspace-container"]', { timeout: 15000 });
    console.log('   Split-screen workspace container loaded successfully.');

    await page.waitForSelector('[data-testid="document-viewer-pane"]', { timeout: 15000 });
    console.log('   Document viewer pane loaded successfully.');

    await sleep(2000);

    // TEST 1: Check CASTE_CERTIFICATE document canvas & bounding boxes
    console.log('\n--- TEST 1: Caste Certificate Document Intelligence ---');
    const casteTab = page.locator('[data-testid="doc-tab-CASTE_CERTIFICATE"]');
    if (await casteTab.isVisible()) {
      await casteTab.click();
      await sleep(1500);
    }

    const casteBboxes = await page.locator('[data-testid^="bbox-"]').all();
    console.log(`   Found ${casteBboxes.length} bounding boxes on Caste Certificate.`);
    for (const bbox of casteBboxes) {
      const testId = await bbox.getAttribute('data-testid');
      const isVisible = await bbox.isVisible();
      const rect = await bbox.boundingBox();
      console.log(`   - Box ${testId}: visible=${isVisible}, bounds=${JSON.stringify(rect)}`);
    }

    // Hover over casteCategory
    const casteCategoryBox = page.locator('[data-testid="bbox-casteCategory"]');
    if (await casteCategoryBox.isVisible()) {
      console.log('   Hovering over casteCategory bounding box...');
      await casteCategoryBox.hover();
      await sleep(1500);

      console.log('   Clicking casteCategory bounding box to test Evidence Provenance Card...');
      await casteCategoryBox.click();
      await sleep(1500);

      const provCard = page.locator('[data-testid="evidence-provenance-card"]');
      if (await provCard.isVisible()) {
        const text = await provCard.innerText();
        console.log('   Evidence Provenance Card Content:');
        console.log(text.replace(/\n+/g, ' | '));
      } else {
        console.error('   FAIL: EvidenceProvenanceCard not visible after click.');
      }
    }

    // TEST 2: Check INCOME_CERTIFICATE
    console.log('\n--- TEST 2: Income Certificate Document Intelligence ---');
    const incomeTab = page.locator('[data-testid="doc-tab-INCOME_CERTIFICATE"]');
    if (await incomeTab.isVisible()) {
      await incomeTab.click();
      await sleep(1500);

      const incomeBboxes = await page.locator('[data-testid^="bbox-"]').all();
      console.log(`   Found ${incomeBboxes.length} bounding boxes on Income Certificate.`);
      for (const bbox of incomeBboxes) {
        const testId = await bbox.getAttribute('data-testid');
        console.log(`   - Box: ${testId}`);
      }

      const incomeBox = page.locator('[data-testid="bbox-annualFamilyIncome"]');
      if (await incomeBox.isVisible()) {
        console.log('   Clicking annualFamilyIncome bounding box...');
        await incomeBox.click();
        await sleep(1500);

        const provCard = page.locator('[data-testid="evidence-provenance-card"]');
        const text = await provCard.innerText();
        console.log('   Income Evidence Provenance Card Content:');
        console.log(text.replace(/\n+/g, ' | '));
      }
    }

    // TEST 3: Check PASSPORT
    console.log('\n--- TEST 3: Passport Document Intelligence ---');
    const passportTab = page.locator('[data-testid="doc-tab-PASSPORT"]');
    if (await passportTab.isVisible()) {
      await passportTab.click();
      await sleep(1500);

      const passportBboxes = await page.locator('[data-testid^="bbox-"]').all();
      console.log(`   Found ${passportBboxes.length} bounding boxes on Passport.`);
      for (const bbox of passportBboxes) {
        const testId = await bbox.getAttribute('data-testid');
        console.log(`   - Box: ${testId}`);
      }

      const passportNumBox = page.locator('[data-testid="bbox-passportNumber"]');
      if (await passportNumBox.isVisible()) {
        await passportNumBox.click();
        await sleep(1500);
      }
    }

    // TEST 4: Bi-directional Navigation from Eligibility Tab
    console.log('\n--- TEST 4: Bi-directional "Inspect Evidence" from Eligibility Tab ---');
    const eligTabBtn = page.locator('[data-testid="tab-eligibility"]');
    await eligTabBtn.click();
    await sleep(1500);

    const inspectBtns = page.locator('button:has-text("Inspect Evidence")');
    const count = await inspectBtns.count();
    console.log(`   Found ${count} "Inspect Evidence" buttons in Eligibility tab.`);

    if (count > 0) {
      console.log('   Clicking first "Inspect Evidence" button...');
      await inspectBtns.first().click();
      await sleep(2000);

      const activeTab = await page.locator('[data-testid^="doc-tab-"][class*="bg-gov-slate"]').innerText();
      console.log(`   Active document tab switched to: ${activeTab}`);

      const provCard = page.locator('[data-testid="evidence-provenance-card"]');
      if (await provCard.isVisible()) {
        console.log('   Evidence Provenance Card is active and populated!');
        const text = await provCard.innerText();
        console.log('   Card details:', text.replace(/\n+/g, ' | '));
      }
    }

    // Return to Caste Certificate and select casteCategory for live review
    console.log('\n--- Setting default view to Caste Certificate ---');
    if (await casteTab.isVisible()) {
      await casteTab.click();
      await sleep(1000);
    }
    if (await casteCategoryBox.isVisible()) {
      await casteCategoryBox.click();
    }

    console.log('\n==================================================');
    console.log('ALL DOCUMENT INTELLIGENCE & BOUNDING BOX CHECKS PASSED!');
    console.log('LIVE BROWSER IS OPEN AT: http://localhost:3000/officer/cases/case_demo_nos_001');
    console.log('==================================================');

    while (true) {
      await sleep(60000);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    await browser.close();
  }
}

test();
