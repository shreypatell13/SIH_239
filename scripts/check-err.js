const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login');
  await page.click('button:has-text("Sign in as APPLICANT")');
  await new Promise(r => setTimeout(r, 4000));
  console.log('URL:', page.url());
  const errorText = await page.locator('.text-rose-700').textContent().catch(() => null);
  console.log('Error text on screen:', errorText);
  await browser.close();
})();
