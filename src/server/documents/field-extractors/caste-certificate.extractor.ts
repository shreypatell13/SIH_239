import { DocumentType } from "@prisma/client";
import { OCRResult } from "../ocr-provider.interface";
import { ExtractedEvidenceField, IFieldExtractor } from "./field-extractor.interface";

export class CasteCertificateExtractor implements IFieldExtractor {
  readonly documentType = DocumentType.CASTE_CERTIFICATE;
  private readonly provider = "deterministic-extractor";
  private readonly version = "1.0.0";

  async extract(ocrResult: OCRResult): Promise<ExtractedEvidenceField[]> {
    const text = ocrResult.fullText || "";
    const fields: ExtractedEvidenceField[] = [];

    // 1. Applicant Name
    const nameMatch =
      text.match(
        /(?:this is to certify that|certify that|name\s*[:\-]?)\s*([A-Za-z\s]+?)(?:,|\s+son|\s+daughter|\s+s\/o|\s+d\/o|\s+w\/o|\s+resident)/i
      ) ||
      text.match(
        /(?:shri|smt|kumari|mr\.|ms\.)\s+([A-Za-z\s]{3,35})(?:,|\s+son|\s+daughter|\s+s\/o|\s+d\/o|\n)/i
      );
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

    // 2. Father/Mother/Guardian Name
    const fatherMatch = text.match(
      /(?:son of|daughter of|s\/o|d\/o|father's name\s*[:\-]?)\s*(?:shri\s+)?([A-Za-z\s]{3,40})(?:\s+resident|\s+village|\s+district|,|\n)/i
    );
    if (fatherMatch && fatherMatch[1]) {
      const raw = fatherMatch[1].trim();
      fields.push({
        fieldKey: "fatherName",
        fieldLabel: "Father / Guardian Name",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.85,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.280, width: 0.35, height: 0.038 },
        sourceSnippet: fatherMatch[0].substring(0, 150),
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 3. Caste Category (Scheduled Tribe)
    const categoryMatch = text.match(
      /(scheduled tribe|scheduled caste|other backward class|st|sc|obc)/i
    );
    if (categoryMatch) {
      const raw = categoryMatch[1].trim();
      const normalized =
        raw.toUpperCase().includes("SCHEDULED TRIBE") || raw.toUpperCase() === "ST"
          ? "ST"
          : raw.toUpperCase();
      fields.push({
        fieldKey: "casteCategory",
        fieldLabel: "Caste / Category",
        rawValue: raw,
        normalizedValue: normalized,
        confidenceScore: 0.92,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.345, width: 0.30, height: 0.038 },
        sourceSnippet: categoryMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "KEYWORD_PROXIMITY",
      });
    }

    // 4. Sub-Tribe / Community Name
    const tribeMatch = text.match(
      /(?:belongs to the|community\s*[:\-]?|tribe\s*[:\-]?)\s*([A-Za-z]+?)(?:\s+community|\s+tribe|,|\s+which)/i
    );
    if (tribeMatch && tribeMatch[1]) {
      const raw = tribeMatch[1].trim();
      fields.push({
        fieldKey: "tribeName",
        fieldLabel: "Tribe / Community",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.86,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.295, width: 0.35, height: 0.038 },
        sourceSnippet: tribeMatch[0].substring(0, 150),
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 5. Certificate Number
    const certNoMatch = text.match(
      /(?:certificate no|cert no|caste cert no|application no|ref no|case no)\s*[:\-.]?\s*([A-Za-z0-9\/\-_]{5,30})/i
    );
    if (certNoMatch && certNoMatch[1]) {
      const raw = certNoMatch[1].trim();
      fields.push({
        fieldKey: "certificateNumber",
        fieldLabel: "Certificate Number",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.9,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.395, width: 0.32, height: 0.038 },
        sourceSnippet: certNoMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 6. Issuing Authority
    const authorityMatch = text.match(
      /(tehsildar|tahsildar|sub-divisional magistrate|sdm|district magistrate|revenue divisional officer|competent authority)/i
    );
    if (authorityMatch) {
      const raw = authorityMatch[1].trim();
      fields.push({
        fieldKey: "issuingAuthority",
        fieldLabel: "Issuing Authority",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.89,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.495, width: 0.40, height: 0.038 },
        sourceSnippet: authorityMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "KEYWORD_PROXIMITY",
      });
    }

    // 7. Issue Date
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
        boundingBox: { x: 0.0908, y: 0.445, width: 0.25, height: 0.038 },
        sourceSnippet: dateMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    return fields;
  }
}
