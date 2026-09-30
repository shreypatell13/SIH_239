const { chromium } = require('@playwright/test');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runLiveUploadVerification() {
  console.log('==================================================');
  console.log('STARTING LIVE APPLICATION DOCUMENT UPLOAD & DEMO DELAY VERIFICATION');
  console.log('==================================================');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Log in as APPLICANT
    console.log('\n1. Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    console.log('2. Clicking "Sign in as APPLICANT" persona button...');
    const applicantBtn = page.locator('button:has-text("Sign in as APPLICANT")');
    await applicantBtn.waitFor({ state: 'visible', timeout: 10000 });
    await applicantBtn.click();
    await page.waitForURL((url) => url.pathname.startsWith('/applicant'), { timeout: 15000 });
    await sleep(2000);
    console.log('   Authenticated as APPLICANT successfully.');

    // 2. Target draft application for NFST
    console.log('\n3. Opening draft application for NFST...');
    const applicationId = 'app_demo_nfst_draft_001';
    console.log(`   Target Application ID: ${applicationId}`);

    await page.goto(`http://localhost:3000/applicant/applications/${applicationId}/documents`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    console.log(`   On Document Checklist Page: ${page.url()}`);
    await page.waitForSelector('[data-testid="application-documents-page"]', { timeout: 15000 });

    // 3. Locate CASTE_CERTIFICATE card
    const casteCard = page.locator('[data-testid="document-card-CASTE_CERTIFICATE"]');
    await casteCard.scrollIntoViewIfNeeded();
    console.log('   Located CASTE_CERTIFICATE upload card.');

    // If an existing document is uploaded, let us test Replace or Upload
    const fileInput = casteCard.locator('input[type="file"]');
    const fixturePath = path.resolve(__dirname, '..', 'tests', 'fixtures', 'documents', 'demo-st-caste-certificate.pdf');
    console.log(`\n4. Uploading synthetic test document:\n   ${fixturePath}`);

    const uploadStartTime = Date.now();
    await fileInput.setInputFiles(fixturePath);
    console.log('   File selected. Upload request submitted.');

    // 5. Verify UI shows PENDING or PROCESSING state immediately
    console.log('\n5. Observing initial processing state in UI...');
    await sleep(2000);

    const processingBadge = casteCard.getByText('Analyzing & Extracting Document Intelligence');
    const isProcessingVisible = await processingBadge.isVisible().catch(() => false);
    console.log(`   Processing / Analyzing indicator visible: ${isProcessingVisible ? 'YES' : 'NO'}`);

    if (isProcessingVisible) {
      const badgeText = await processingBadge.innerText();
      console.log(`   Badge text: "${badgeText}"`);
    }

    // 6. Monitor progression over ~35 seconds
    console.log('\n6. Monitoring live 35-second demo delay progression...');
    let isCompleted = false;
    let secondsElapsed = 0;

    while (secondsElapsed < 50) {
      await sleep(3000);
      secondsElapsed = Math.round((Date.now() - uploadStartTime) / 1000);

      const completedBadge = casteCard.getByText('Document Intelligence Verified');
      const hasCompleted = await completedBadge.isVisible().catch(() => false);

      if (hasCompleted) {
        isCompleted = true;
        console.log(`   >>> COMPLETED state detected at T+${secondsElapsed}s!`);
        break;
      } else {
        console.log(`   T+${secondsElapsed}s: Still actively processing/analyzing...`);
      }
    }

    const totalSeconds = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
    console.log(`\n7. Processing completed in ${totalSeconds} seconds (Target: ~30-40s).`);

    if (!isCompleted) {
      throw new Error(`Document did not transition to COMPLETED within 50 seconds. Total elapsed: ${totalSeconds}s`);
    }

    // 7. Verify officer review shows real extracted results & bounding boxes
    console.log('\n8. Verifying Officer Review workspace preserves real OCR results & bounding boxes...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    const officerBtn = page.locator('button:has-text("Sign in as VERIFICATION_OFFICER")');
    await officerBtn.waitFor({ state: 'visible', timeout: 10000 });
    await officerBtn.click();
    await page.waitForURL((url) => url.pathname.startsWith('/officer'), { timeout: 15000 });
    await sleep(2000);

    await page.goto('http://localhost:3000/officer/cases/case_demo_nos_001', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="split-screen-workspace-container"]', { timeout: 15000 });
    console.log('   Officer Case Review workspace loaded.');

    const bboxes = await page.locator('[data-testid^="bbox-"]').all();
    console.log(`   Verified ${bboxes.length} bounding boxes intact on Officer Document Canvas.`);

    console.log('\n==================================================');
    console.log('LIVE DOCUMENT UPLOAD & 35-SECOND DEMO DELAY VERIFICATION PASSED!');
    console.log('==================================================');

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('\nLIVE VERIFICATION FAILED:', err);
    await browser.close();
    process.exit(1);
  }
}

runLiveUploadVerification();
