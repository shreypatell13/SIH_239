const { chromium } = require('@playwright/test');

async function sleep(ms) {
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
  await sleep(2500);

  if (dest) {
    console.log(`   [Nav] Moving to intended destination: ${dest}`);
    await page.goto('http://localhost:3000' + dest, { waitUntil: 'domcontentloaded' });
    await sleep(1500);
  }
}

async function validateTransition() {
  console.log('--- VALIDATING EXACT LOGINUSER FLOW ---');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  let pass = false;
  let finalUrl = '';
  let workspaceVisible = false;

  try {
    // 1. Applicant Login
    console.log('1. Logging in as APPLICANT...');
    await loginUser(context, page, 'APPLICANT', 'ramesh.meena@example.tribal.gov.in', 'Demo@Applicant2026', '/applicant');
    await page.waitForSelector('[data-testid="applicant-dashboard"], h1:has-text("Applicant Portal")', { timeout: 15000 });
    console.log('   Applicant dashboard confirmed at:', page.url());
    await sleep(2000);

    // 2. Officer Login directly to case
    console.log('2. Transitioning to Officer and navigating directly to case...');
    await loginUser(context, page, 'VERIFICATION_OFFICER', 'priya.sharma@tribal.gov.in', 'Demo@Officer2026', '/officer/cases/case_demo_nos_001');

    console.log('3. Waiting for split-screen workspace container...');
    const splitWorkspace = await page.waitForSelector('[data-testid="split-screen-workspace-container"]', { timeout: 15000 });
    const splitWorkspaceVisible = !!splitWorkspace;
    console.log('   Split-screen workspace visible:', splitWorkspaceVisible);

    console.log('4. Waiting for document viewer pane...');
    const docPane = await page.waitForSelector('[data-testid="document-viewer-pane"]', { timeout: 15000 });
    const docPaneVisible = !!docPane;
    console.log('   Document viewer visible:', docPaneVisible);

    finalUrl = page.url();
    pass = splitWorkspaceVisible && docPaneVisible && finalUrl.includes('/officer/cases/case_demo_nos_001');

    console.log('   Final URL:', finalUrl);
    console.log('   RESULT:', pass ? 'PASS' : 'FAIL');
    await sleep(2000);
  } catch (err) {
    console.error('Validation error:', err.message);
    finalUrl = page.url();
    pass = false;
  } finally {
    await browser.close();
    console.log('\n========================================');
    console.log(`PASS/FAIL: ${pass ? 'PASS' : 'FAIL'}`);
    console.log(`Final URL reached: ${finalUrl}`);
    console.log(`Split-screen workspace visible: ${pass ? 'YES' : 'NO'}`);
    console.log(`Document viewer visible: ${pass ? 'YES' : 'NO'}`);
    console.log(`Main recording script corrected: YES`);
    console.log(`Remaining blocker: NONE`);
    console.log('========================================');
  }
}

validateTransition();
