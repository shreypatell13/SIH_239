/**
 * Cross-Document Deterministic Consistency Engine
 * Phase 2G: Deterministic Eligibility & Evidence Verification Engine
 *
 * Compares declared application form fields against extracted document fields
 * with robust, explainable normalization (honorifics, Unicode, Levenshtein distance).
 *
 * Grounding Rule: A mismatch or discrepancy is NOT fraud. It flags AMBIGUOUS / REVIEW_REQUIRED.
 */

import { ConsistencyCheckItem, ExtractedFieldEvidence } from "./types";

/**
 * Standard list of Indian and international honorifics/prefixes to strip during name matching.
 */
const HONORIFICS = [
  "mr",
  "mr.",
  "ms",
  "ms.",
  "mrs",
  "mrs.",
  "shri",
  "shree",
  "smt",
  "smt.",
  "dr",
  "dr.",
  "kumari",
  "km",
  "km.",
  "master",
  "prof",
  "prof.",
];

/**
 * Normalizes name strings for comparison:
 * 1. Unicode NFKC normalization
 * 2. Lowercase & trim
 * 3. Remove punctuation / special characters
 * 4. Remove leading/isolated honorifics
 * 5. Collapse multiple spaces
 */
export function normalizeName(name: string | null | undefined): string {
  if (!name) return "";

  const cleaned = name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ");
  const filteredWords = words.filter((w) => !HONORIFICS.includes(w));

  return filteredWords.join(" ").trim();
}

/**
 * Deterministic Levenshtein Distance implementation.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates similarity ratio between two strings (0.0 to 1.0).
 */
export function stringSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeName(str1);
  const norm2 = normalizeName(str2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  // Check token set match (e.g. "Ramesh Kumar Meena" vs "Meena Ramesh Kumar")
  const tokens1 = new Set(norm1.split(" ").filter(Boolean));
  const tokens2 = new Set(norm2.split(" ").filter(Boolean));

  let tokenMatchCount = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) tokenMatchCount++;
  }

  const tokenOverlap = (tokenMatchCount * 2) / (tokens1.size + tokens2.size);
  if (tokenOverlap >= 0.99) return 1.0;

  const maxLen = Math.max(norm1.length, norm2.length);
  const dist = levenshteinDistance(norm1, norm2);
  const levScore = 1.0 - dist / maxLen;

  return Math.max(levScore, tokenOverlap);
}

/**
 * Parses numeric currency/amount values safely.
 */
function parseAmount(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Runs cross-document consistency checks between application form data and extracted document evidence.
 */
export function runConsistencyChecks(params: {
  formData: Record<string, unknown>;
  applicantProfile: {
    category?: string | null;
    annualFamilyIncome?: number | null;
    user?: { name?: string | null };
  };
  extractedEvidences: ExtractedFieldEvidence[];
}): ConsistencyCheckItem[] {
  const { formData, applicantProfile, extractedEvidences } = params;
  const results: ConsistencyCheckItem[] = [];

  const declaredName =
    (formData.fullName as string) || (applicantProfile.user?.name as string) || "";
  const declaredIncome = formData.annualFamilyIncome ?? applicantProfile.annualFamilyIncome;
  const declaredCategory = (formData.casteCategory as string) || applicantProfile.category || "";
  const declaredPassport = formData.passportNumber as string;

  // 1. Cross-document Name Consistency Checks
  const nameEvidences = extractedEvidences.filter(
    (e) => e.fieldKey.toLowerCase() === "applicantname" || e.fieldKey.toLowerCase() === "name"
  );

  for (const evidence of nameEvidences) {
    const rawExtracted = evidence.rawValue || evidence.normalizedValue || "";
    const similarity = stringSimilarity(declaredName, rawExtracted);
    const isConsistent = similarity >= 0.85;

    results.push({
      fieldKey: "applicantName",
      fieldLabel: "Applicant Full Name",
      formValue: declaredName,
      extractedValue: rawExtracted,
      extractedConfidence: evidence.confidenceScore,
      documentType: evidence.documentType,
      documentId: evidence.documentId,
      isConsistent,
      similarityScore: Math.round(similarity * 100) / 100,
      mismatchExplanation: isConsistent
        ? undefined
        : `Extracted name '${rawExtracted}' from ${evidence.documentType} differs from declared name '${declaredName}' (similarity: ${Math.round(similarity * 100)}%).`,
    });
  }

  // 2. Annual Income Consistency Check (against Income Certificate)
  const incomeEvidences = extractedEvidences.filter(
    (e) =>
      e.fieldKey.toLowerCase() === "annualfamilyincome" ||
      e.fieldKey.toLowerCase() === "annualincome" ||
      e.fieldKey.toLowerCase() === "income"
  );

  for (const evidence of incomeEvidences) {
    const formNum = parseAmount(declaredIncome as string | number);
    const extNum = parseAmount(evidence.normalizedValue || evidence.rawValue);

    if (formNum !== null && extNum !== null) {
      // Allow minor rounding tolerance (within 1%)
      const diff = Math.abs(formNum - extNum);
      const isConsistent = diff <= Math.max(1, formNum * 0.01);

      results.push({
        fieldKey: "annualFamilyIncome",
        fieldLabel: "Annual Family Income",
        formValue: `₹${formNum.toLocaleString("en-IN")}`,
        extractedValue: `₹${extNum.toLocaleString("en-IN")}`,
        extractedConfidence: evidence.confidenceScore,
        documentType: evidence.documentType,
        documentId: evidence.documentId,
        isConsistent,
        mismatchExplanation: isConsistent
          ? undefined
          : `Declared income of ₹${formNum.toLocaleString("en-IN")} does not match extracted income ₹${extNum.toLocaleString("en-IN")} from ${evidence.documentType}.`,
      });
    }
  }

  // 3. Caste Category Consistency Check (against Caste Certificate)
  const casteEvidences = extractedEvidences.filter(
    (e) =>
      e.fieldKey.toLowerCase() === "castecategory" ||
      e.fieldKey.toLowerCase() === "tribename" ||
      e.fieldKey.toLowerCase() === "category"
  );

  for (const evidence of casteEvidences) {
    const extRaw = (evidence.normalizedValue || evidence.rawValue || "").toLowerCase();
    const isDeclaredSt = String(declaredCategory).trim().toUpperCase() === "ST";
    const matchesSt =
      extRaw.includes("st") ||
      extRaw.includes("scheduled tribe") ||
      extRaw.includes("meena") ||
      extRaw.includes("gond") ||
      extRaw.includes("bhil") ||
      extRaw.includes("santhal");

    const isConsistent = isDeclaredSt ? matchesSt : true;

    results.push({
      fieldKey: "casteCategory",
      fieldLabel: "Caste / Tribe Category",
      formValue: declaredCategory,
      extractedValue: evidence.rawValue,
      extractedConfidence: evidence.confidenceScore,
      documentType: evidence.documentType,
      documentId: evidence.documentId,
      isConsistent,
      mismatchExplanation: isConsistent
        ? undefined
        : `Declared category '${declaredCategory}' could not be confirmed against extracted certificate record '${evidence.rawValue}'.`,
    });
  }

  // 4. Passport Number Consistency Check
  if (declaredPassport) {
    const passportEvidences = extractedEvidences.filter(
      (e) => e.fieldKey.toLowerCase() === "passportnumber"
    );

    for (const evidence of passportEvidences) {
      const extNum = (evidence.normalizedValue || evidence.rawValue || "").trim().toUpperCase();
      const formNum = declaredPassport.trim().toUpperCase();
      const isConsistent = extNum === formNum;

      results.push({
        fieldKey: "passportNumber",
        fieldLabel: "Passport Number",
        formValue: formNum,
        extractedValue: extNum,
        extractedConfidence: evidence.confidenceScore,
        documentType: evidence.documentType,
        documentId: evidence.documentId,
        isConsistent,
        mismatchExplanation: isConsistent
          ? undefined
          : `Declared passport number '${formNum}' does not match extracted number '${extNum}'.`,
      });
    }
  }

  return results;
}
