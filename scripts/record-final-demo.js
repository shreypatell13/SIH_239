const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function warmRoutes() {
  console.log('--- WARMING NEXT.JS COMPILATION ROUTES ---');
  const routes = [
    'http://localhost:3000/login',
    'http://localhost:3000/applicant',
    'http://localhost:3000/applicant/schemes',
    'http://localhost:3000/applicant/schemes/NOS',
    'http://localhost:3000/applicant/applications/app_demo_nos_sub_001/status',
    'http://localhost:3000/officer',
    'http://localhost:3000/officer/cases/case_demo_nos_001',
    'http://localhost:3000/management',
    'http://localhost:3000/post-selection',
    'http://localhost:3000/post-selection/psr_demo_nos_001',
  ];
  for (const route of routes) {
    try {
      console.log(`   [Warm-up] ${route}`);
      await fetch(route).catch(() => {});
    } catch {}
  }
  console.log('--- ROUTE WARM-UP COMPLETED ---');
}

async function waitForOfficerWorkspace(page, timeout = 35000) {
  console.log('   Waiting for split-screen workspace container and document viewer pane...');
  await page.waitForSelector('[data-testid="split-screen-workspace-container"]', { timeout });
  await page.waitForSelector('[data-testid="document-viewer-pane"]', { timeout });
  console.log('   Officer workspace verified ready.');
}

/**
 * Robust authentication handler with full session isolation.
 * Uses context.clearCookies() to prevent session bleed across personas.
 * Does NOT rely on networkidle to prevent HMR WebSocket timeouts.
 */
async function loginUser(context, page, roleName, email, pass, dest) {
  if (context) {
    await context.clearCookies();
  }
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(`button:has-text("Sign in as ${roleName}")`, { timeout: 10000 });
  await sleep(800);

  const personaBtn = page.locator(`button:has-text("Sign in as ${roleName}")`);
  if (await personaBtn.isVisible()) {
    console.log(`   [Auth] Clicking one-click persona button for ${roleName}...`);
    await personaBtn.hover();
    await sleep(400);
    await personaBtn.click();
    await sleep(3500);
  } else {
    console.log(`   [Auth] Filling credentials for ${email}...`);
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(pass);
    await sleep(400);
    await page.locator('button[type="submit"]').click();
    await sleep(3500);
  }

  if (dest && !page.url().includes(dest)) {
    console.log(`   [Nav] Moving to intended destination: ${dest}`);
    try {
      await page.goto('http://localhost:3000' + dest, { waitUntil: 'domcontentloaded' });
    } catch (e) {
      if (e.message && e.message.includes('ERR_ABORTED')) {
        console.log('   [Nav] Retrying navigation after redirect settle...');
        await sleep(1500);
        await page.goto('http://localhost:3000' + dest, { waitUntil: 'domcontentloaded' });
      } else {
        throw e;
      }
    }
    await sleep(1500);
  }
}

async function recordWalkthrough() {
  console.log('========================================================');
  console.log('TRIBALSCHOLAR AI — LIVE BROWSER DEMO & SCREEN RECORDING');
  console.log('Target duration: ~3m 35s - 3m 50s (Max: 4m 00s)');
  console.log('Single continuous recording in visible headed browser');
  console.log('========================================================');

  const recordingsDir = path.resolve(__dirname, '../recordings');
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  // Warm up routes to precompile Next.js pages
  await warmRoutes();

  const startTime = Date.now();

  // 1. Launch Visible Headed Chromium Browser
  console.log('[0:00] Launching visible browser (headed mode)...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized', '--window-size=1280,720']
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // =========================================================================
    // PART 1: LOGIN & ROLE-BASED ARCHITECTURE (0:00 - 0:16)
    // =========================================================================
    console.log('[0:00 - 0:16] PART 1: Login & Role-Based Entry...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    // Hover over the demo personas to showcase role-based architecture
    const applicantCard = page.locator('text=Applicant Persona').first();
    if (await applicantCard.isVisible()) {
      await applicantCard.hover();
      await sleep(1200);
    }
    const officerCard = page.locator('text=Officer Persona').first();
    if (await officerCard.isVisible()) {
      await officerCard.hover();
      await sleep(1200);
    }
    const directorCard = page.locator('text=Operations Director').first();
    if (await directorCard.isVisible()) {
      await directorCard.hover();
      await sleep(1200);
    }

    // Authenticate as APPLICANT (Ramesh Kumar Meena)
    console.log('   Authenticating as APPLICANT...');
    await loginUser(context, page, 'APPLICANT', 'ramesh.meena@example.tribal.gov.in', 'Demo@Applicant2026', '/applicant');
    await sleep(2500);

    // =========================================================================
    // PART 2: APPLICANT DASHBOARD (0:16 - 0:34)
    // =========================================================================
    console.log('[0:16 - 0:34] PART 2: Applicant Dashboard & Applications...');
    // Showcase Profile Overview & Badges
    await page.evaluate(() => window.scrollBy({ top: 160, behavior: 'smooth' }));
    await sleep(3500);

    // Showcase My Applications section (Submitted NOS application)
    await page.evaluate(() => window.scrollBy({ top: 240, behavior: 'smooth' }));
    await sleep(2600);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(2000);

    // =========================================================================
    // PART 3: SCHEME CATALOG & APPLICATION FLOW (0:34 - 0:54)
    // =========================================================================
    console.log('[0:34 - 0:54] PART 3: Scheme Catalog & Application Flow...');
    // Navigate to Available Schemes
    await page.goto('http://localhost:3000/applicant/schemes', { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    // View National Overseas Scholarship Details
    const nosDetailsBtn = page.locator('a[href*="/applicant/schemes/NOS"]').first();
    if (await nosDetailsBtn.isVisible()) {
      await nosDetailsBtn.hover();
      await sleep(800);
      await nosDetailsBtn.click();
      await sleep(3000);
    } else {
      await page.goto('http://localhost:3000/applicant/schemes/NOS', { waitUntil: 'domcontentloaded' });
      await sleep(3000);
    }

    // Return to applicant dashboard to showcase active submitted application status
    await page.goto('http://localhost:3000/applicant', { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    // Show application checklist & note withdrawal action is available
    await page.evaluate(() => window.scrollBy({ top: 280, behavior: 'smooth' }));
    await sleep(3000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(1500);

    // =========================================================================
    // PART 4: DOCUMENT INTELLIGENCE & OCR PROVENANCE (0:54 - 1:44) [KEY HIGHLIGHT]
    // =========================================================================
    console.log('[0:54 - 1:44] PART 4: Document Intelligence, Classification & Bounding Boxes...');
    // Authenticate as Verification Officer and navigate directly to case dossier
    await loginUser(context, page, 'VERIFICATION_OFFICER', 'priya.sharma@tribal.gov.in', 'Demo@Officer2026', '/officer/cases/case_demo_nos_001');

    // Wait for URL confirmation
    await page.waitForURL(url => url.pathname.includes('/officer/cases/case_demo_nos_001'), { timeout: 20000 }).catch(() => {});

    // Resilient workspace readiness check (up to 45 seconds, accepting any reliable combination)
    await waitForOfficerWorkspace(page, 45000);
    await sleep(2500);

    // Document 1: CASTE CERTIFICATE
    console.log('   Showcasing Caste Certificate AI Processing & Bounding Boxes...');
    const casteTab = page.locator('[data-testid="doc-tab-CASTE_CERTIFICATE"]');
    if (await casteTab.isVisible()) {
      await casteTab.click();
      await sleep(2000);
    }

    // Hold briefly so all colored bounding boxes are clearly visible on top of the document
    await sleep(2000);

    // Hover over the casteCategory bounding box to reveal tooltip
    const casteBbox = page.locator('[data-testid="bbox-casteCategory"]').first();
    if (await casteBbox.isVisible()) {
      await casteBbox.hover();
      await sleep(2000);
      // Click the bounding box to trigger selected gold highlight & Evidence Provenance Card
      await casteBbox.click({ force: true });
      await sleep(2000);
    }

    // Scroll slightly down to showcase EvidenceProvenanceCard alongside the document
    await page.evaluate(() => window.scrollBy({ top: 140, behavior: 'smooth' }));
    await sleep(2500);

    // Document 2: ANNUAL INCOME CERTIFICATE
    console.log('   Showcasing Annual Income Certificate Extraction...');
    const incomeTab = page.locator('[data-testid="doc-tab-INCOME_CERTIFICATE"]');
    if (await incomeTab.isVisible()) {
      await incomeTab.click();
      await sleep(1500);
      const incomeBbox = page.locator('[data-testid="bbox-annualFamilyIncome"]').first();
      if (await incomeBbox.isVisible()) {
        await incomeBbox.hover();
        await sleep(1500);
        await incomeBbox.click({ force: true });
        await sleep(2500);
      }
    }

    // Document 3: PASSPORT SAMPLE (MRZ EXTRACTION)
    console.log('   Showcasing Passport MRZ Extraction...');
    const passportTab = page.locator('[data-testid="doc-tab-PASSPORT"]');
    if (await passportTab.isVisible()) {
      await passportTab.click();
      await sleep(1500);
      const passBbox = page.locator('[data-testid="bbox-passportNumber"]').first();
      if (await passBbox.isVisible()) {
        await passBbox.hover();
        await sleep(1500);
        await passBbox.click({ force: true });
        await sleep(2500);
      }
    }

    // Document 4: DEGREE TRANSCRIPT
    console.log('   Showcasing Academic Degree Transcript Extraction...');
    const degreeTab = page.locator('[data-testid="doc-tab-DEGREE_TRANSCRIPT"]');
    if (await degreeTab.isVisible()) {
      await degreeTab.click();
      await sleep(1500);
      const degreeBbox = page.locator('[data-testid="bbox-percentageMarks"]').first();
      if (await degreeBbox.isVisible()) {
        await degreeBbox.hover();
        await sleep(1500);
        await degreeBbox.click({ force: true });
        await sleep(2500);
      }
    }

    // Scroll back up to show split-screen overview
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(2000);

    // =========================================================================
    // PART 5: DETERMINISTIC ELIGIBILITY RULE ENGINE (1:44 - 2:10)
    // =========================================================================
    console.log('[1:44 - 2:10] PART 5: Deterministic Eligibility Engine & Inspect Evidence...');
    const eligibilityTab = page.locator('[data-testid="tab-eligibility"]');
    await eligibilityTab.click();
    await sleep(2500);

    // Show Assessment Banner & Pinned Specification
    await page.evaluate(() => window.scrollBy({ top: 120, behavior: 'smooth' }));
    await sleep(2500);

    // Showcase deterministic rules table: ST, Income Ceiling, Age Limit, Academic %
    await page.evaluate(() => window.scrollBy({ top: 180, behavior: 'smooth' }));
    await sleep(2500);

    // Click "Inspect Evidence" on the rule to show bi-directional navigation
    const inspectBtn = page.getByRole('button', { name: /Inspect Evidence/i }).first();
    if (await inspectBtn.isVisible()) {
      console.log('   Clicking "Inspect Evidence" on rule evaluation...');
      await inspectBtn.hover();
      await sleep(1000);
      await inspectBtn.click();
      await sleep(2500);
    }

    // Scroll up
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(1500);

    // =========================================================================
    // PART 6: DEFICIENCY & STRUCTURED EXCEPTION LIFECYCLE (2:10 - 2:32)
    // =========================================================================
    console.log('[2:10 - 2:32] PART 6: Deficiency & Structured Exception Workflow...');
    const deficienciesTab = page.locator('[data-testid="tab-deficiencies"]');
    await deficienciesTab.click();
    await sleep(2500);

    // Show open deficiency on Income Certificate
    await page.evaluate(() => window.scrollBy({ top: 100, behavior: 'smooth' }));
    await sleep(2500);

    // Demonstrate the "Issue Structured Deficiency" human-in-the-loop modal
    const issueDefBtn = page.getByRole('button', { name: /Issue Structured Deficiency/i }).first();
    if (await issueDefBtn.isVisible()) {
      await issueDefBtn.click();
      await sleep(2000);
      // Close modal gracefully
      const cancelBtn = page.getByRole('button', { name: /Cancel/i });
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await sleep(1200);
      }
    }

    // =========================================================================
    // PART 7 & 8: OFFICER CASE REVIEW & HUMAN-IN-THE-LOOP (2:32 - 2:56)
    // =========================================================================
    console.log('[2:32 - 2:56] PART 7 & 8: Officer Case Queue & Human Decision Controls...');
    // Navigate to Officer Queue
    await page.goto('http://localhost:3000/officer', { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    // Showcase Queue KPIs and Scheme Filters
    const nosFilterBtn = page.getByRole('button', { name: /NOS/i }).first();
    if (await nosFilterBtn.isVisible()) {
      await nosFilterBtn.click();
      await sleep(1500);
    }
    const allFilterBtn = page.getByRole('button', { name: /ALL/i }).first();
    if (await allFilterBtn.isVisible()) {
      await allFilterBtn.click();
      await sleep(1500);
    }

    // Scroll case queue table
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'smooth' }));
    await sleep(2200);

    // Open case back up to demonstrate action bar
    await page.goto('http://localhost:3000/officer/cases/case_demo_nos_001', { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // Scroll to bottom action bar (Human-in-the-loop decisions)
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    await sleep(2500);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(1500);

    // =========================================================================
    // PART 10: MANAGEMENT CONTROL TOWER & BOTTLENECK ANALYTICS (2:56 - 3:16)
    // =========================================================================
    console.log('[2:56 - 3:16] PART 10: Management Operations Control Tower...');
    await loginUser(context, page, 'OPERATIONS_DIRECTOR', 'sunita.rao@tribal.gov.in', 'Demo@Director2026', '/management');
    await sleep(2500);

    // Showcase Executive Metrics & Bottlenecks
    await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
    await sleep(2500);

    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
    await sleep(2500);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(1500);

    // =========================================================================
    // PART 11: SCHOLAR REGISTRY & POST-SELECTION LIFECYCLE (3:16 - 3:38)
    // =========================================================================
    console.log('[3:16 - 3:38] PART 11: Scholar Registry, Renewal & Mock Disbursement...');
    await page.goto('http://localhost:3000/post-selection', { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    // Open Scholar Record Detail
    await page.goto('http://localhost:3000/post-selection/psr_demo_nos_001', { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    // Scroll down to showcase Renewal Cycles (Year 1 APPROVED, Year 2 UPCOMING)
    await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
    await sleep(2500);

    // Scroll down to showcase Mock PFMS Direct Benefit Transfer Disbursement
    await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
    await sleep(2800);

    // =========================================================================
    // PART 12: AUDIT TRAIL & FINAL CLOSING SCREEN (3:38 - 3:48)
    // =========================================================================
    console.log('[3:38 - 3:48] PART 12: Cryptographic Audit Trail & Final Summary Screen...');
    await loginUser(context, page, 'VERIFICATION_OFFICER', 'priya.sharma@tribal.gov.in', 'Demo@Officer2026', '/officer/cases/case_demo_nos_001');
    await page.waitForURL(url => url.pathname.includes('/officer/cases/case_demo_nos_001'), { timeout: 20000 }).catch(() => {});
    await waitForOfficerWorkspace(page, 45000);
    const timelineTab = page.locator('[data-testid="tab-timeline"]');
    if (await timelineTab.isVisible()) {
      await timelineTab.click();
      await sleep(2500);
    }

    // Final showcase pause on split-screen workspace
    console.log('   Final visual showcase hold...');
    await sleep(3000);

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[COMPLETED] Walkthrough finished in ${elapsedSeconds} seconds!`);
  } catch (err) {
    console.error('Walkthrough error:', err);
  } finally {
    console.log('Flushing and finalizing recording video...');
    await sleep(1500);
    const video = page.video();
    let videoPath = null;
    if (video) {
      videoPath = await video.path();
    }
    await context.close();

    console.log('Saved raw video recording at:', videoPath);

    const finalVideoDest = path.join(recordingsDir, 'tribalscholar_ai_final_demo.webm');
    const backupDest = path.join(recordingsDir, 'tribalscholar_ai_final_demo_backup.webm');
    if (fs.existsSync(finalVideoDest) && !fs.existsSync(backupDest)) {
      fs.copyFileSync(finalVideoDest, backupDest);
      console.log('Backed up previous recording to:', backupDest);
    }

    if (videoPath && fs.existsSync(videoPath)) {
      fs.copyFileSync(videoPath, finalVideoDest);
      const stats = fs.statSync(finalVideoDest);
      console.log('FINAL RECORDING ESTABLISHED AT:', finalVideoDest);
      console.log(`VIDEO SIZE: ${(stats.size / (1024 * 1024)).toFixed(2)} MB (${stats.size} bytes)`);
    }

    const totalDurationSec = Math.round((Date.now() - startTime) / 1000);
    const mins = Math.floor(totalDurationSec / 60);
    const secs = totalDurationSec % 60;
    console.log(`FINAL RECORDING DURATION: ${mins}m ${secs.toString().padStart(2, '0')}s (${totalDurationSec}s total)`);

    await browser.close();
    console.log('Browser closed cleanly. Recording finalized.');
  }
}

recordWalkthrough();
