const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:3000/login');
  await page.locator('input[type="email"]').fill('ramesh.meena@example.tribal.gov.in');
  await page.locator('input[type="password"]').fill('Demo@Applicant2026');

  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('callback/credentials')),
    page.locator('button[type="submit"]').click()
  ]);

  console.log('Callback Status:', response.status());
  const body = await response.text();
  console.log('Callback Body:', body);

  await page.waitForTimeout(2000);
  const cookies = await context.cookies();
  console.log('Context Cookies:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 15) + '...', domain: c.domain, path: c.path })));
  console.log('Page URL after 2s:', page.url());

  await browser.close();
})();
