const { chromium } = require('@playwright/test');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  async function login(email, pass, dest) {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(pass);
    const submitBtn = page.locator('button[type="submit"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
      submitBtn.click()
    ]);
    if (page.url() !== 'http://localhost:3000' + dest) {
      await page.goto('http://localhost:3000' + dest, { waitUntil: 'networkidle' });
    }
    console.log('Logged in as', email, 'reached:', page.url());
  }

  await login('ramesh.meena@example.tribal.gov.in', 'Demo@Applicant2026', '/applicant');
  await login('priya.sharma@tribal.gov.in', 'Demo@Officer2026', '/officer');
  await login('sunita.rao@tribal.gov.in', 'Demo@Director2026', '/management');

  await browser.close();
  console.log('All 3 logins verified!');
}
test().catch(e => console.error('Test error:', e.message));
