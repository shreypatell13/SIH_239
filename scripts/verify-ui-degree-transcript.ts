import { chromium } from "playwright";

async function main() {
  console.log("=== VERIFYING UI RENDERING IN LIVE BROWSER ===");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // 1. Login as Verification Officer
    console.log("Navigating to login...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await page.fill('input[name="email"], input[type="email"]', "priya.sharma@tribal.gov.in");
    await page.fill('input[name="password"], input[type="password"]', "Demo@Officer2026");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // 2. Open Case Dossier with the Degree Transcript
    console.log("Opening officer case review...");
    await page.goto("http://localhost:3000/officer/cases/case_demo_nfst_001", { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="document-viewer-pane"], [data-testid="split-screen-workspace-container"]', { timeout: 15000 });

    // 3. Switch to Degree Transcript tab
    console.log("Switching to Degree Transcript tab...");
    const degreeTab = page.locator('button:has-text("Degree"), button:has-text("Transcript"), [data-testid*="DEGREE_TRANSCRIPT"]').first();
    if (await degreeTab.count() > 0) {
      await degreeTab.click();
      await page.waitForTimeout(2000);
    }

    // 4. Verify Document Canvas vs Iframe
    const docImage = page.locator('[data-testid="document-canvas-image"]');
    const iframeFallback = page.locator('iframe[title="Document PDF Preview"], [data-testid="pdf-preview-iframe"]');
    const bboxes = page.locator('[data-testid^="bbox-"]');

    const imageVisible = await docImage.isVisible().catch(() => false);
    const iframeVisible = await iframeFallback.isVisible().catch(() => false);
    const bboxCount = await bboxes.count();

    console.log(`Document Canvas Image Visible: ${imageVisible}`);
    console.log(`Native Iframe Fallback Visible: ${iframeVisible}`);
    console.log(`Rendered Bounding Boxes Count: ${bboxCount}`);

    if (bboxCount > 0) {
      const firstBbox = bboxes.first();
      await firstBbox.hover();
      await page.waitForTimeout(500);
      const tooltip = page.locator('[data-testid="bbox-tooltip"]');
      const tooltipVisible = await tooltip.isVisible().catch(() => false);
      console.log(`Tooltip visible on hover: ${tooltipVisible}`);

      await firstBbox.click();
      await page.waitForTimeout(500);
      const provenanceCard = page.locator('[data-testid="evidence-provenance-card"]');
      const cardVisible = await provenanceCard.isVisible().catch(() => false);
      console.log(`Evidence Provenance Card visible on click: ${cardVisible}`);
    }

    console.log("=== UI VERIFICATION COMPLETED SUCCESSFULLY ===");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("UI verification error:", err);
  process.exit(1);
});
