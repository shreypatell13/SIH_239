export type DeficiencyStatus = "ISSUED" | "ACKNOWLEDGED" | "RESOLVED" | "WAIVED";

export interface DeficiencyTicket {
  deficiencyId: string;
  caseId: string;
  documentId?: string;
  fieldKey?: string;
  category: "DOCUMENT_EXPIRED" | "DOCUMENT_ILLEGIBLE" | "DATA_MISMATCH" | "MISSING_MANDATORY_PROOF";
  plainEnglishExplanation: string;
  remedyAction: string;
  status: DeficiencyStatus;
  issuedAt: Date;
  deadline: Date;
}

export interface IDeficiencyService {
  issueDeficiency(
    ticket: Omit<DeficiencyTicket, "deficiencyId" | "issuedAt" | "status">
  ): Promise<DeficiencyTicket>;
  resolveDeficiency(deficiencyId: string, updatedDocumentId: string): Promise<DeficiencyTicket>;
  listOpenDeficiencies(caseId: string): Promise<DeficiencyTicket[]>;
}

export class DeficiencyService implements IDeficiencyService {
  async issueDeficiency(
    ticket: Omit<DeficiencyTicket, "deficiencyId" | "issuedAt" | "status">
  ): Promise<DeficiencyTicket> {
    return {
      ...ticket,
      deficiencyId: `def_${Date.now()}`,
      status: "ISSUED",
      issuedAt: new Date(),
    };
  }

  async resolveDeficiency(
    deficiencyId: string,
    _updatedDocumentId: string
  ): Promise<DeficiencyTicket> {
    return {
      deficiencyId,
      caseId: "case_sample",
      category: "DOCUMENT_EXPIRED",
      plainEnglishExplanation: "Resolved via targeted recheck.",
      remedyAction: "None",
      status: "RESOLVED",
      issuedAt: new Date(),
      deadline: new Date(),
    };
  }

  async listOpenDeficiencies(_caseId: string): Promise<DeficiencyTicket[]> {
    return [];
  }
}

export const deficiencyService = new DeficiencyService();
