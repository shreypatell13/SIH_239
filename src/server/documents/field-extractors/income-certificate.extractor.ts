import { DocumentType } from "@prisma/client";
import { OCRResult } from "../ocr-provider.interface";
import { ExtractedEvidenceField, IFieldExtractor } from "./field-extractor.interface";

export class IncomeCertificateExtractor implements IFieldExtractor {
  readonly documentType = DocumentType.INCOME_CERTIFICATE;
  private readonly provider = "deterministic-extractor";
  private readonly version = "1.0.0";

  /**
   * Normalizes an Indian currency string into clean numeric digits.
   * e.g., "Rs. 4,50,000/-", "₹4,50,000", "4,50,000.00" -> "450000"
   */
  static normalizeIncome(incomeStr: string): string {
    const cleaned = incomeStr.replace(/\.\d{2}$/, "").replace(/[Rs\.₹\/\-\s,]/gi, "");
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? "" : parsed.toString();
  }

  async extract(ocrResult: OCRResult): Promise<ExtractedEvidenceField[]> {
    const text = ocrResult.fullText || "";
    const fields: ExtractedEvidenceField[] = [];

    // 1. Applicant Name
    const nameMatch =
      text.match(
        /(?:this is to certify that|certify that|name\s*[:\-]?)\s*([A-Za-z\s]{3,40})(?:\s+son|\s+daughter|\s+s\/o|\s+d\/o|\s+w\/o|\s+resident)/i
      ) || text.match(/(?:shri|smt|kumari|mr\.|ms\.)\s+([A-Za-z\s]{3,35})/i);
    if (nameMatch && nameMatch[1]) {
      const raw = nameMatch[1].trim();
      fields.push({
        fieldKey: "applicantName",
        fieldLabel: "Applicant Name",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.88,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.230, width: 0.35, height: 0.038 },
        sourceSnippet: nameMatch[0].substring(0, 150),
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 2. Annual Family Income
    const incomeMatch =
      text.match(
        /(?:annual\s*(?:family)?\s*income\s*(?:is|of)?|total\s*income\s*[:\-]?|family\s*income\s*[:\-]?)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{2})?(?:\s*\/\-)??)/i
      ) || text.match(/(?:rs\.?|₹)\s*([\d,]{4,10}(?:\.\d{2})?(?:\s*\/\-)?)/i);

    if (incomeMatch && incomeMatch[1]) {
      const raw = incomeMatch[0].trim();
      const normalized = IncomeCertificateExtractor.normalizeIncome(incomeMatch[1]);
      if (normalized) {
        fields.push({
          fieldKey: "annualFamilyIncome",
          fieldLabel: "Annual Family Income",
          rawValue: raw,
          normalizedValue: normalized,
          confidenceScore: 0.91,
          pageNumber: 1,
          boundingBox: { x: 0.0908, y: 0.295, width: 0.41, height: 0.038 },
          sourceSnippet: incomeMatch[0],
          extractorProvider: this.provider,
          extractorVersion: this.version,
          extractionMethod: "REGEX",
        });
      }
    }

    // 3. Financial Year
    const fyMatch = text.match(
      /(?:financial year|fy|assessment year|ay)\s*[:\-]?\s*(\d{4}\s*[-–\/]\s*\d{2,4})/i
    );
    if (fyMatch && fyMatch[1]) {
      const raw = fyMatch[1].trim();
      fields.push({
        fieldKey: "financialYear",
        fieldLabel: "Financial Year",
        rawValue: raw,
        normalizedValue: raw.replace(/\s+/g, ""),
        confidenceScore: 0.86,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.345, width: 0.24, height: 0.038 },
        sourceSnippet: fyMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 4. Certificate Number
    const certNoMatch = text.match(
      /(?:certificate no|cert no|income cert no|application no|ref no|case no)\s*[:\-.]?\s*([A-Za-z0-9\/\-_]{5,30})/i
    );
    if (certNoMatch && certNoMatch[1]) {
      const raw = certNoMatch[1].trim();
      fields.push({
        fieldKey: "certificateNumber",
        fieldLabel: "Certificate Number",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.95,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.395, width: 0.32, height: 0.038 },
        sourceSnippet: certNoMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 5. Issuing Authority
    const authorityMatch = text.match(
      /(tehsildar|tahsildar|revenue officer|district magistrate|sub-divisional officer|sdo|revenue inspector)/i
    );
    if (authorityMatch) {
      const raw = authorityMatch[1].trim();
      fields.push({
        fieldKey: "issuingAuthority",
        fieldLabel: "Issuing Authority",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.88,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.495, width: 0.37, height: 0.038 },
        sourceSnippet: authorityMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "KEYWORD_PROXIMITY",
      });
    }

    // 6. Issue Date
    const dateMatch = text.match(
      /(?:date of issue|issued on|dated\s*[:\-]?|date\s*[:\-]?)\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
    );
    if (dateMatch && dateMatch[1]) {
      const raw = dateMatch[1].trim();
      fields.push({
        fieldKey: "issueDate",
        fieldLabel: "Certificate Issue Date",
        rawValue: raw,
        normalizedValue: raw,
        confidenceScore: 0.87,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.445, width: 0.21, height: 0.038 },
        sourceSnippet: dateMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    return fields;
  }
}
