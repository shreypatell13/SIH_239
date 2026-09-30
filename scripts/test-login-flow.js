const { chromium } = require('@playwright/test');

async function testAllPersonas() {
  console.log('Testing full persona switching with credentials submission...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  async function loginAs(email, pass, roleName, dest) {
    console.log(`Clearing cookies and navigating to /login for ${roleName}...`);
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    console.log(`Filling credentials for ${email}...`);
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(pass);

    const submitBtn = page.locator('button[type="submit"]');
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/callback/credentials') && resp.status() === 200, { timeout: 12000 }),
      submitBtn.click()
    ]);
    console.log(`   Credentials callback returned 200 OK.`);

    await page.waitForTimeout(1500);
    const cookies = await context.cookies();
    const hasSession = cookies.some(c => c.name.includes('session-token'));
    console.log(`   Session established: ${hasSession}. Navigating to ${dest}...`);

    await page.goto('http://localhost:3000' + dest);
    await page.waitForTimeout(1000);
    console.log(`   Reached destination: ${page.url()}`);
    if (page.url().includes('/login')) {
      throw new Error(`Redirected back to login when trying to access ${dest}`);
    }
  }

  // 1. Applicant
  await loginAs('ramesh.meena@example.tribal.gov.in', 'Demo@Applicant2026', 'APPLICANT', '/applicant');

  // 2. Officer
  await loginAs('priya.sharma@tribal.gov.in', 'Demo@Officer2026', 'VERIFICATION_OFFICER', '/officer');
  await page.goto('http://localhost:3000/officer/cases/case_demo_nos_001');
  const docPane = await page.waitForSelector('[data-testid="document-viewer-pane"]', { timeout: 10000 });
  console.log('   Document viewer pane visible?', !!docPane);

  // 3. Director
  await loginAs('sunita.rao@tribal.gov.in', 'Demo@Director2026', 'OPERATIONS_DIRECTOR', '/management');
  await page.goto('http://localhost:3000/post-selection/psr_demo_nos_001');
  console.log('   Post-selection detail URL:', page.url());

  // 4. Officer again
  await loginAs('priya.sharma@tribal.gov.in', 'Demo@Officer2026', 'VERIFICATION_OFFICER', '/officer/cases/case_demo_nos_001');
  const timelineTab = page.locator('[data-testid="tab-timeline"]');
  console.log('   Timeline tab visible?', await timelineTab.isVisible());

  await browser.close();
  console.log('ALL PERSONA SWITCHES VERIFIED PERFECTLY!');
}

testAllPersonas().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
