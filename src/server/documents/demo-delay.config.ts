/**
 * Demo / Prototype Presentation Settings
 *
 * Configures the simulated hold/reveal delay for document intelligence processing.
 * This gives demo viewers a predictable ~35-second period to observe the
 * "processing/analyzing" state before the real OCR & extraction results are revealed.
 */

export const DEFAULT_DEMO_OCR_DELAY_MS = 35000;

export function getDemoOcrDelayMs(): number {
  const envVal = process.env.DEMO_OCR_DELAY_MS;
  if (envVal !== undefined && envVal.trim() !== "") {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return DEFAULT_DEMO_OCR_DELAY_MS;
}
