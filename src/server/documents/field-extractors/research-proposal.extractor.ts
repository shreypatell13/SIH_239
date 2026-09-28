import { DocumentType } from "@prisma/client";
import { OCRResult } from "../ocr-provider.interface";
import { ExtractedEvidenceField, IFieldExtractor } from "./field-extractor.interface";

export class ResearchProposalExtractor implements IFieldExtractor {
  readonly documentType = DocumentType.RESEARCH_PROPOSAL;
  private readonly provider = "deterministic-extractor";
  private readonly version = "1.0.0";

  async extract(ocrResult: OCRResult): Promise<ExtractedEvidenceField[]> {
    const text = ocrResult.fullText || "";
    const fields: ExtractedEvidenceField[] = [];

    // 1. Applicant Name / Principal Investigator
    const nameMatch =
      text.match(
        /(?:submitted by|researcher|candidate name|applicant\s*[:\-]?)\s*([A-Za-z\s]{3,35})(?:\s+under|\s+department|\n|,)/i
      ) || text.match(/(?:by\s*[:\-]?\s*)([A-Za-z\s]{3,35})(?:\n|\s+roll)/i);
    if (nameMatch && nameMatch[1]) {
      const raw = nameMatch[1].trim();
      fields.push({
        fieldKey: "applicantName",
        fieldLabel: "Applicant / Scholar Name",
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

    // 2. Research Title / Topic
    const titleMatch =
      text.match(
        /(?:title of (?:the )?research|research title|proposed title|topic\s*[:\-]?)\s*["“]?([^"\n”\r]{10,120})["”]?/i
      ) || text.match(/(?:synopsis on|proposal on)\s*["“]?([^"\n”\r]{10,120})["”]?/i);
    if (titleMatch && titleMatch[1]) {
      const raw = titleMatch[1].trim();
      fields.push({
        fieldKey: "researchTitle",
        fieldLabel: "Proposed Research Title",
        rawValue: raw,
        normalizedValue: raw,
        confidenceScore: 0.89,
        pageNumber: 1,
        sourceSnippet: titleMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 3. Supervisor / Guide Name
    const supervisorMatch = text.match(
      /(?:under the supervision of|guided by|supervisor\s*[:\-]?|guide\s*[:\-]?)\s*(?:dr\.|prof\.|shri|smt)?\s*([A-Za-z\s\.]{3,35})(?:\n|,|\s+department)/i
    );
    if (supervisorMatch && supervisorMatch[1]) {
      const raw = supervisorMatch[1].trim();
      fields.push({
        fieldKey: "supervisorName",
        fieldLabel: "Research Supervisor / Guide",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.87,
        pageNumber: 1,
        sourceSnippet: supervisorMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "REGEX",
      });
    }

    // 4. Host Institution / Department
    const instMatch = text.match(
      /(?:department of [A-Za-z\s]{3,30}|[A-Za-z\s]{3,30} university|[A-Za-z\s]{3,30} institute of technology)/i
    );
    if (instMatch) {
      const raw = instMatch[0].trim();
      fields.push({
        fieldKey: "institutionName",
        fieldLabel: "Department / Host Institution",
        rawValue: raw,
        normalizedValue: raw.toUpperCase(),
        confidenceScore: 0.88,
        pageNumber: 1,
        sourceSnippet: instMatch[0],
        extractorProvider: this.provider,
        extractorVersion: this.version,
        extractionMethod: "KEYWORD_PROXIMITY",
      });
    }

    return fields;
  }
}
