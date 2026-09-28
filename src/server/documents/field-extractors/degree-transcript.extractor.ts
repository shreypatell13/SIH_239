import { DocumentType } from "@prisma/client";
import { OCRResult } from "../ocr-provider.interface";
import { ExtractedEvidenceField, IFieldExtractor } from "./field-extractor.interface";

export class DegreeTranscriptExtractor implements IFieldExtractor {
  readonly documentType = DocumentType.DEGREE_TRANSCRIPT;
  private readonly provider = "deterministic-extractor";
  private readonly version = "1.0.0";

  async extract(ocrResult: OCRResult): Promise<ExtractedEvidenceField[]> {
    const text = ocrResult.fullText || "";
    const fields: ExtractedEvidenceField[] = [];

    // 1. Applicant Name
    const nameMatch =
      text.match(
        /(?:candidate's name|student name|name of the candidate|name\s*[:\-]?)\s*([A-Za-z\s]{3,40})/i
      ) || text.match(/(?:shri|smt|mr\.|ms\.)\s+([A-Za-z\s]{3,35})/i);
    if (nameMatch && nameMatch[1]) {
      const raw = nameMatch[1].trim();
      fields.push({
        fieldKey: "applicantName",
        fieldLabel: "Student Name",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.87,
        pageNumber: 1,
        sourceSnippet: nameMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 2. University / Institute Name
    const uniMatch = text.match(
      /(?:university of [A-Za-z ]{3,30}|[A-Za-z ]{3,30} university|[A-Za-z ]{3,30} institute of technology|[A-Za-z ]{3,30} college)/i
    );
    if (uniMatch) {
      const raw = uniMatch[0].trim();
      fields.push({
        fieldKey: "universityName",
        fieldLabel: "University / Institute Name",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.89,
        pageNumber: 1,
        sourceSnippet: uniMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "KEYWORD_PROXIMITY",
      });
    }

    // 3. Degree / Program
    const degreeMatch = text.match(
      /(bachelor of [A-Za-z\s]{3,25}|master of [A-Za-z\s]{3,25}|b\.tech|m\.tech|b\.sc|m\.sc|b\.e\.|m\.e\.|b\.a\.|m\.a\.|ph\.d)/i
    );
    if (degreeMatch) {
      const raw = degreeMatch[0].trim();
      fields.push({
        fieldKey: "degree",
        fieldLabel: "Degree Program",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.9,
        pageNumber: 1,
        sourceSnippet: degreeMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "KEYWORD_PROXIMITY",
      });
    }

    // 4. Year of Passing
    const yearMatch = text.match(
      /(?:year of passing|passing year|month & year|examination held in)\s*[:\-]?\s*([A-Za-z]*\s*\d{4})/i
    );
    if (yearMatch && yearMatch[1]) {
      const raw = yearMatch[1].trim();
      fields.push({
        fieldKey: "yearOfPassing",
        fieldLabel: "Year of Passing",
        rawValue: raw,
        normalizedValue: raw.replace(/\D/g, ""),
        confidenceScore: 0.85,
        pageNumber: 1,
        sourceSnippet: yearMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 5. Percentage Marks or CGPA
    const marksMatch =
      text.match(
        /(?:percentage|aggregate marks|overall percentage|total marks)\s*[:\-]?\s*(\d{1,3}(?:\.\d{1,2})?)\s*%/i
      ) ||
      text.match(
        /(?:cgpa|gpa|cumulative grade point average)\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)(?:\s*\/\s*10)?/i
      );
    if (marksMatch && marksMatch[1]) {
      const raw = marksMatch[0].trim();
      const val = parseFloat(marksMatch[1]);
      fields.push({
        fieldKey: "percentageMarks",
        fieldLabel: "Qualifying Percentage / CGPA",
        rawValue: raw,
        normalizedValue: val.toString(),
        confidenceScore: 0.91,
        pageNumber: 1,
        sourceSnippet: marksMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 6. Roll Number / Enrolment Number
    const rollMatch = text.match(
      /(?:roll no|enrolment no|enrollment no|registration no)\s*[:\-]?\s*([A-Za-z0-9\-_]{4,25})/i
    );
    if (rollMatch && rollMatch[1]) {
      const raw = rollMatch[1].trim();
      fields.push({
        fieldKey: "rollNumber",
        fieldLabel: "Roll / Registration Number",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.88,
        pageNumber: 1,
        sourceSnippet: rollMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    return fields;
  }
}
