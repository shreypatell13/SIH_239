import { DocumentType } from "@prisma/client";
import { OCRResult } from "../ocr-provider.interface";
import { ExtractedEvidenceField, IFieldExtractor } from "./field-extractor.interface";

export class AdmissionOfferExtractor implements IFieldExtractor {
  readonly documentType = DocumentType.ADMISSION_OFFER_LETTER;
  private readonly provider = "deterministic-extractor";
  private readonly version = "1.0.0";

  async extract(ocrResult: OCRResult): Promise<ExtractedEvidenceField[]> {
    const text = ocrResult.fullText || "";
    const fields: ExtractedEvidenceField[] = [];

    // 1. Applicant Name
    const nameMatch =
      text.match(/(?:dear|to,?\s*)\s*([A-Za-z\s]{3,35})(?:,|\n|\s+application)/i) ||
      text.match(/(?:candidate name|student name|name\s*[:\-]?)\s*([A-Za-z\s]{3,35})/i);
    if (nameMatch && nameMatch[1]) {
      const raw = nameMatch[1].trim();
      fields.push({
        fieldKey: "applicantName",
        fieldLabel: "Applicant Name",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.86,
        pageNumber: 1,
        sourceSnippet: nameMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 2. Institution Name
    const instMatch = text.match(
      /(?:university of [A-Za-z\s]{3,30}|[A-Za-z\s]{3,30} university|[A-Za-z\s]{3,30} institute of [A-Za-z\s]{3,20}|indian institute of technology|iit [a-z]+|oxford university|cambridge university|harvard university)/i
    );
    if (instMatch) {
      const raw = instMatch[0].trim();
      fields.push({
        fieldKey: "institutionName",
        fieldLabel: "Host Institution / University",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.9,
        pageNumber: 1,
        sourceSnippet: instMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "KEYWORD_PROXIMITY",
      });
    }

    // 3. Program / Course Name
    const progMatch = text.match(
      /(?:ph\.?d\.?|phd|master of [A-Za-z\s]{3,25}|m\.?sc\.?|m\.?tech|postdoctoral|fellowship)\s*(?:in|program in)?\s*([A-Za-z\s]{3,35})?/i
    );
    if (progMatch) {
      const raw = progMatch[0].trim();
      fields.push({
        fieldKey: "programName",
        fieldLabel: "Degree / Program Admitted",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.88,
        pageNumber: 1,
        sourceSnippet: progMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "KEYWORD_PROXIMITY",
      });
    }

    // 4. Admission / Commencement Date
    const dateMatch = text.match(
      /(?:commencing on|starting from|admission date|date of admission|session starts)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|[A-Za-z]+\s+\d{4})/i
    );
    if (dateMatch && dateMatch[1]) {
      const raw = dateMatch[1].trim();
      fields.push({
        fieldKey: "admissionDate",
        fieldLabel: "Program Start Date",
        rawValue: raw,
        normalizedValue: raw,
        confidenceScore: 0.85,
        pageNumber: 1,
        sourceSnippet: dateMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 5. Offer Validity / Acceptance Deadline
    const deadlineMatch = text.match(
      /(?:accept this offer by|offer valid until|acceptance deadline|valid up to)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|[A-Za-z]+\s+\d{1,2},?\s*\d{4})/i
    );
    if (deadlineMatch && deadlineMatch[1]) {
      const raw = deadlineMatch[1].trim();
      fields.push({
        fieldKey: "offerValidity",
        fieldLabel: "Offer Validity Deadline",
        rawValue: raw,
        normalizedValue: raw,
        confidenceScore: 0.84,
        pageNumber: 1,
        sourceSnippet: deadlineMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    return fields;
  }
}
