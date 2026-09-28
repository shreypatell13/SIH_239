import { DocumentType } from "@prisma/client";
import { IFieldExtractor } from "./field-extractor.interface";
import { CasteCertificateExtractor } from "./caste-certificate.extractor";
import { IncomeCertificateExtractor } from "./income-certificate.extractor";
import { DegreeTranscriptExtractor } from "./degree-transcript.extractor";
import { AdmissionOfferExtractor } from "./admission-offer.extractor";
import { PassportExtractor } from "./passport.extractor";
import { ResearchProposalExtractor } from "./research-proposal.extractor";

export * from "./field-extractor.interface";
export * from "./caste-certificate.extractor";
export * from "./income-certificate.extractor";
export * from "./degree-transcript.extractor";
export * from "./admission-offer.extractor";
export * from "./passport.extractor";
export * from "./research-proposal.extractor";

export class FieldExtractorRegistry {
  private static extractors: Map<DocumentType, IFieldExtractor> = new Map<
    DocumentType,
    IFieldExtractor
  >([
    [DocumentType.CASTE_CERTIFICATE, new CasteCertificateExtractor()],
    [DocumentType.INCOME_CERTIFICATE, new IncomeCertificateExtractor()],
    [DocumentType.DEGREE_TRANSCRIPT, new DegreeTranscriptExtractor()],
    [DocumentType.ADMISSION_OFFER_LETTER, new AdmissionOfferExtractor()],
    [DocumentType.PASSPORT, new PassportExtractor()],
    [DocumentType.RESEARCH_PROPOSAL, new ResearchProposalExtractor()],
  ]);

  static getExtractor(type: DocumentType): IFieldExtractor | undefined {
    return this.extractors.get(type);
  }
}
