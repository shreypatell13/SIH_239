import { AuthenticatedUser } from "../auth/roles";

export interface SchemeDefinition {
  code: "NFST" | "NOS";
  title: string;
  version: string;
  isActive: boolean;
  incomeCeilingInr?: number;
  academicMinPercentage?: number;
  ageLimitYears?: number;
  requiredDocuments: string[];
}

export interface ISchemeService {
  getActiveSchemes(): Promise<SchemeDefinition[]>;
  getSchemeByCode(code: string): Promise<SchemeDefinition | null>;
  publishSchemeVersion(
    definition: SchemeDefinition,
    user: AuthenticatedUser
  ): Promise<SchemeDefinition>;
}

export class SchemeService implements ISchemeService {
  async getActiveSchemes(): Promise<SchemeDefinition[]> {
    // Stub baseline: Demonstrating NFST and NOS configurations
    return [
      {
        code: "NFST",
        title: "National Fellowship for Higher Education of ST Students",
        version: "v2025.1",
        isActive: true,
        ageLimitYears: 36, // 31 + 5 years ST relaxation
        academicMinPercentage: 55,
        requiredDocuments: ["CASTE_CERTIFICATE", "DEGREE_TRANSCRIPT", "ADMISSION_OFFER_LETTER"],
      },
      {
        code: "NOS",
        title: "National Overseas Scholarship for ST Students",
        version: "v2025.1",
        isActive: true,
        incomeCeilingInr: 800000,
        ageLimitYears: 35,
        academicMinPercentage: 60,
        requiredDocuments: [
          "CASTE_CERTIFICATE",
          "INCOME_CERTIFICATE",
          "PASSPORT",
          "ADMISSION_OFFER_LETTER",
        ],
      },
    ];
  }

  async getSchemeByCode(code: string): Promise<SchemeDefinition | null> {
    const schemes = await this.getActiveSchemes();
    return schemes.find((s) => s.code === code) ?? null;
  }

  async publishSchemeVersion(
    definition: SchemeDefinition,
    _user: AuthenticatedUser
  ): Promise<SchemeDefinition> {
    // Stub: Implementation in Phase 2D (Scheme Studio)
    return definition;
  }
}

export const schemeService = new SchemeService();
