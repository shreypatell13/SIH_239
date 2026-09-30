import { DocumentType } from "@prisma/client";
import { OCRResult } from "../ocr-provider.interface";
import { ExtractedEvidenceField, IFieldExtractor } from "./field-extractor.interface";

export class PassportExtractor implements IFieldExtractor {
  readonly documentType = DocumentType.PASSPORT;
  private readonly provider = "deterministic-extractor";
  private readonly version = "1.0.0";

  async extract(ocrResult: OCRResult): Promise<ExtractedEvidenceField[]> {
    const text = ocrResult.fullText || "";
    const fields: ExtractedEvidenceField[] = [];

    // 1. Passport Number
    const mrzMatch =
      text.match(/P<([A-Z]{3})([A-Z<]+)\n([A-Z0-9<]{9})([0-9<])([A-Z]{3})([0-9]{6})/i) ||
      text.match(/([A-Z][0-9]{7})/);
    const passNoMatch =
      text.match(/(?:passport no|passport number)\s*[:\-]?\s*([A-Z][0-9]{7})/i) ||
      text.match(/\b([A-Z][0-9]{7})\b/);

    if (passNoMatch && passNoMatch[1]) {
      const raw = passNoMatch[1].trim();
      fields.push({
        fieldKey: "passportNumber",
        fieldLabel: "Passport Number",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.94,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.380, width: 0.21, height: 0.038 },
        sourceSnippet: passNoMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: mrzMatch ? "MRZ" : "REGEX",
      });
    }

    // 2. Applicant Given Name / Surname
    const surnameMatch = text.match(/(?:surname)\s*[:\-]?\s*([A-Za-z\s]{2,30})/i);
    const givenNameMatch = text.match(/(?:given names?)\s*[:\-]?\s*([A-Za-z\s]{2,35})/i);
    const nameMatch = text.match(/(?:name\s*[:\-]?)\s*([A-Za-z\s]{3,40})/i);

    let fullName = "";
    if (givenNameMatch && givenNameMatch[1]) {
      fullName =
        `${givenNameMatch[1].trim()} ${surnameMatch && surnameMatch[1] ? surnameMatch[1].trim() : ""}`.trim();
    } else if (nameMatch && nameMatch[1]) {
      fullName = nameMatch[1].trim();
    }

    if (fullName) {
      fields.push({
        fieldKey: "applicantName",
        fieldLabel: "Passport Holder Name",
        rawValue: fullName,
        normalizedValue: fullName.toUpperCase(),
        confidenceScore: 0.92,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.280, width: 0.28, height: 0.080 },
        sourceSnippet: fullName,
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 3. Nationality
    const natMatch =
      text.match(/(?:nationality)\s*[:\-]?\s*([A-Za-z]{3,20})/i) || text.match(/\b(INDIAN)\b/i);
    if (natMatch && natMatch[1]) {
      const raw = natMatch[1].trim();
      fields.push({
        fieldKey: "nationality",
        fieldLabel: "Nationality",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.95,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.430, width: 0.30, height: 0.038 },
        sourceSnippet: natMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "KEYWORD_PROXIMITY",
      });
    }

    // 4. Date of Birth
    const dobMatch = text.match(
      /(?:date of birth|d\.?o\.?b\.?)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{2}\s+[A-Za-z]{3}\s+\d{4})/i
    );
    if (dobMatch && dobMatch[1]) {
      const raw = dobMatch[1].trim();
      fields.push({
        fieldKey: "dateOfBirth",
        fieldLabel: "Date of Birth",
        rawValue: raw,
        normalizedValue: raw,
        confidenceScore: 0.9,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.480, width: 0.22, height: 0.038 },
        sourceSnippet: dobMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 5. Expiry Date
    const expMatch = text.match(
      /(?:date of expiry|expiry date)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{2}\s+[A-Za-z]{3}\s+\d{4})/i
    );
    if (expMatch && expMatch[1]) {
      const raw = expMatch[1].trim();
      fields.push({
        fieldKey: "expiryDate",
        fieldLabel: "Passport Expiry Date",
        rawValue: raw,
        normalizedValue: raw,
        confidenceScore: 0.91,
        pageNumber: 1,
        boundingBox: { x: 0.0908, y: 0.530, width: 0.25, height: 0.038 },
        sourceSnippet: expMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    return fields;
  }
}
