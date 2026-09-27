export interface AuditRecord {
  id: string;
  caseId: string;
  actorId: string;
  actorRole: string;
  action: string;
  previousState?: string;
  newState?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface IAuditService {
  logEvent(record: Omit<AuditRecord, "id" | "timestamp">): Promise<AuditRecord>;
  getCaseAuditTrail(caseId: string): Promise<AuditRecord[]>;
}

export class AuditService implements IAuditService {
  async logEvent(record: Omit<AuditRecord, "id" | "timestamp">): Promise<AuditRecord> {
    const entry: AuditRecord = {
      ...record,
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
    };
    // In Phase 2B, this writes to the immutable PostgreSQL AuditLog table.
    return entry;
  }

  async getCaseAuditTrail(_caseId: string): Promise<AuditRecord[]> {
    return [];
  }
}

export const auditService = new AuditService();
