import { DocumentType } from "@prisma/client";
import { OCRResult } from "../ocr-provider.interface";

export interface ClassificationResult {
  classifiedType: DocumentType;
  confidenceScore: number; // 0.0 - 1.0
  detectedLanguage?: string;
  pageCount: number;
  classifierVersion: string;
}

interface TypeSignature {
  type: DocumentType;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  negativeKeywords?: string[];
}

export class DocumentClassifier {
  static readonly VERSION = "heuristic-v1.0";

  private static readonly SIGNATURES: TypeSignature[] = [
    {
      type: DocumentType.CASTE_CERTIFICATE,
      primaryKeywords: [
        "caste certificate",
        "community certificate",
        "scheduled tribe",
        "tribe certificate",
        "जाति प्रमाण पत्र",
        "जनजाति",
        "अनुसूची जनजाति",
      ],
      secondaryKeywords: [
        "tehsildar",
        "tahsildar",
        "district magistrate",
        "sub-divisional magistrate",
        "competent authority",
        "meena",
        "gond",
        "bhil",
        "santhal",
        "munda",
        "oraon",
        "constitution (scheduled tribes) order",
      ],
      negativeKeywords: ["income", "passport", "transcript", "admission offer"],
    },
    {
      type: DocumentType.INCOME_CERTIFICATE,
      primaryKeywords: [
        "income certificate",
        "annual family income",
        "annual income",
        "family income",
        "आय प्रमाण पत्र",
        "वार्षिक आय",
        "सकल वार्षिक आय",
      ],
      secondaryKeywords: [
        "revenue department",
        "tehsildar",
        "revenue officer",
        "financial year",
        "fy 20",
        "rupees",
        "per annum",
        "lakh",
      ],
      negativeKeywords: ["caste certificate", "passport", "transcript", "admission offer"],
    },
    {
      type: DocumentType.DEGREE_TRANSCRIPT,
      primaryKeywords: [
        "statement of marks",
        "grade card",
        "transcript",
        "marks sheet",
        "academic record",
        "degree certificate",
        "marksheet",
        "cumulative grade point average",
      ],
      secondaryKeywords: [
        "university",
        "controller of examinations",
        "semester",
        "cgpa",
        "bachelor of",
        "master of",
        "b.tech",
        "m.tech",
        "b.sc",
        "m.sc",
        "b.a",
        "m.a",
        "total marks",
        "credits",
      ],
      negativeKeywords: ["caste certificate", "income certificate", "passport"],
    },
    {
      type: DocumentType.ADMISSION_OFFER_LETTER,
      primaryKeywords: [
        "offer of admission",
        "admission offer",
        "letter of admission",
        "provisional admission",
        "offer letter",
        "acceptance of admission",
        "selection letter",
      ],
      secondaryKeywords: [
        "ph.d",
        "phd",
        "department of",
        "fellowship",
        "academic session",
        "enrolment",
        "enrollment",
        "dean",
        "supervisor",
        "institute",
      ],
      negativeKeywords: ["marksheet", "income certificate", "passport"],
    },
    {
      type: DocumentType.PASSPORT,
      primaryKeywords: [
        "republic of india",
        "passport",
        "passport no",
        "p<ind",
        "type/type",
        "given name",
        "surname",
      ],
      secondaryKeywords: [
        "date of birth",
        "place of birth",
        "date of issue",
        "date of expiry",
        "nationality",
        "indian",
        "mrz",
      ],
      negativeKeywords: ["caste certificate", "income certificate", "transcript"],
    },
    {
      type: DocumentType.RESEARCH_PROPOSAL,
      primaryKeywords: [
        "research proposal",
        "synopsis",
        "statement of purpose",
        "proposed research",
        "doctoral research",
      ],
      secondaryKeywords: [
        "abstract",
        "introduction",
        "objective",
        "objectives",
        "methodology",
        "literature review",
        "hypothesis",
        "references",
        "bibliography",
        "supervisor",
      ],
      negativeKeywords: ["passport", "income certificate", "caste certificate"],
    },
  ];

  /**
   * Classifies an OCR result into a DocumentType with a confidence score.
   */
  static classify(ocrResult: OCRResult): ClassificationResult {
    const text = (ocrResult.fullText || "").toLowerCase();
    const pageCount = ocrResult.pages?.length || 1;

    if (!text || text.trim().length === 0) {
      return {
        classifiedType: DocumentType.OTHER,
        confidenceScore: 0.1,
        pageCount,
        classifierVersion: this.VERSION,
      };
    }

    let bestType: DocumentType = DocumentType.OTHER;
    let highestScore = 0;

    for (const sig of this.SIGNATURES) {
      let score = 0;

      // Primary keyword hits (up to 0.6)
      let primaryHits = 0;
      for (const kw of sig.primaryKeywords) {
        if (text.includes(kw.toLowerCase())) {
          primaryHits++;
        }
      }
      if (primaryHits > 0) {
        score += Math.min(0.6, primaryHits * 0.3);
      }

      // Secondary keyword hits (up to 0.4)
      let secondaryHits = 0;
      for (const kw of sig.secondaryKeywords) {
        if (text.includes(kw.toLowerCase())) {
          secondaryHits++;
        }
      }
      if (secondaryHits > 0) {
        score += Math.min(0.4, secondaryHits * 0.1);
      }

      // Negative keywords deduction
      if (sig.negativeKeywords) {
        for (const kw of sig.negativeKeywords) {
          if (text.includes(kw.toLowerCase())) {
            score -= 0.2;
          }
        }
      }

      // Ensure score stays bounded [0, 1]
      score = Math.max(0, Math.min(1.0, score));

      if (score > highestScore) {
        highestScore = score;
        bestType = sig.type;
      }
    }

    // If highest score is below 0.3, classify as OTHER with low confidence
    if (highestScore < 0.3) {
      return {
        classifiedType: DocumentType.OTHER,
        confidenceScore: Math.max(0.1, highestScore),
        pageCount,
        classifierVersion: this.VERSION,
      };
    }

    return {
      classifiedType: bestType,
      confidenceScore: Math.round(highestScore * 100) / 100,
      detectedLanguage: ocrResult.detectedLanguages?.[0] || "eng",
      pageCount,
      classifierVersion: this.VERSION,
    };
  }
}
