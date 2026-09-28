import { schemeRepository } from "../repositories/scheme.repository";
import { schemeValidationService } from "./scheme-validation.service";
import { AuthenticatedUser, assertPermission } from "../auth/roles";
import {
  SchemeSummaryDTO,
  SchemeDetailDTO,
  SchemeVersionSummaryDTO,
  SchemeVersionDTO,
  CreateSchemeDTO,
  PublishSchemeVersionDTO,
  ValidationResultDTO,
  FormSchema,
  DocumentRequirementsSchema,
  EligibilityRulesSchema,
  WorkflowConfig,
  SelectionConfig,
} from "../domain/scheme/types";
import { CreateSchemeValidator } from "../domain/scheme/validators";
import { Scheme, SchemeVersion } from "@prisma/client";

export interface ISchemeService {
  listActiveSchemes(): Promise<SchemeSummaryDTO[]>;
  getActiveVersionByCode(code: string): Promise<SchemeVersionDTO | null>;
  listAllSchemes(actor: AuthenticatedUser): Promise<SchemeSummaryDTO[]>;
  getSchemeById(id: string, actor: AuthenticatedUser): Promise<SchemeDetailDTO | null>;
  getSchemeByCode(code: string): Promise<SchemeSummaryDTO | null>;
  getVersionById(versionId: string, actor?: AuthenticatedUser): Promise<SchemeVersionDTO | null>;
  createScheme(data: CreateSchemeDTO, actor: AuthenticatedUser): Promise<SchemeSummaryDTO>;
  publishVersion(
    schemeId: string,
    config: PublishSchemeVersionDTO,
    actor: AuthenticatedUser
  ): Promise<SchemeVersionDTO>;
  validateConfig(config: PublishSchemeVersionDTO): ValidationResultDTO;
}

export class SchemeService implements ISchemeService {
  private mapVersionToDTO(
    v: SchemeVersion & {
      scheme?: Scheme;
      publishedBy?: { id: string; name: string | null; email: string } | null;
      _count?: { applications: number };
    }
  ): SchemeVersionDTO {
    return {
      id: v.id,
      schemeId: v.schemeId,
      versionNumber: v.versionNumber,
      effectiveFrom: v.effectiveFrom.toISOString(),
      effectiveTo: v.effectiveTo ? v.effectiveTo.toISOString() : null,
      isActive: v.isActive,
      publishedAt: v.publishedAt.toISOString(),
      publishedByName: v.publishedBy?.name || v.publishedBy?.email || null,
      applicationOpenDate: v.applicationOpenDate ? v.applicationOpenDate.toISOString() : null,
      applicationDeadline: v.applicationDeadline ? v.applicationDeadline.toISOString() : null,
      totalApplicationsCount: v._count?.applications ?? 0,
      formSchema: v.formSchema as unknown as FormSchema,
      documentRequirements: v.documentRequirements as unknown as DocumentRequirementsSchema,
      eligibilityRules: v.eligibilityRules as unknown as EligibilityRulesSchema,
      workflowConfig: v.workflowConfig ? (v.workflowConfig as unknown as WorkflowConfig) : null,
      selectionConfig: v.selectionConfig ? (v.selectionConfig as unknown as SelectionConfig) : null,
    };
  }

  private mapSchemeToSummaryDTO(
    s: Scheme & {
      versions?: (SchemeVersion & {
        _count?: { applications?: number };
      })[];
    }
  ): SchemeSummaryDTO {
    const activeVersion = s.versions?.find((v) => v.isActive);
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      description: s.description,
      ministry: s.ministry,
      isActive: s.isActive,
      activeVersionNumber: activeVersion?.versionNumber,
      activeVersionId: activeVersion?.id,
      totalVersionsCount: s.versions?.length ?? 0,
      applicationOpenDate: activeVersion?.applicationOpenDate
        ? activeVersion.applicationOpenDate.toISOString()
        : null,
      applicationDeadline: activeVersion?.applicationDeadline
        ? activeVersion.applicationDeadline.toISOString()
        : null,
    };
  }

  /**
   * Public: List active schemes for applicant scheme explorer
   */
  async listActiveSchemes(): Promise<SchemeSummaryDTO[]> {
    const schemes = await schemeRepository.listActiveSchemes();
    return schemes.map((s) => this.mapSchemeToSummaryDTO(s));
  }

  /**
   * Public / Service: Fetch current active version for a given scheme code (NFST / NOS)
   */
  async getActiveVersionByCode(code: string): Promise<SchemeVersionDTO | null> {
    const version = await schemeRepository.getActiveVersion(code);
    if (!version) return null;
    return this.mapVersionToDTO(version);
  }

  /**
   * Admin / Officer / Management: List all schemes
   */
  async listAllSchemes(actor: AuthenticatedUser): Promise<SchemeSummaryDTO[]> {
    assertPermission(actor, "scheme:read");
    const schemes = await schemeRepository.listAllSchemes();
    return schemes.map((s) => this.mapSchemeToSummaryDTO(s));
  }

  /**
   * Admin / Officer: Get scheme details and all version histories
   */
  async getSchemeById(id: string, actor: AuthenticatedUser): Promise<SchemeDetailDTO | null> {
    assertPermission(actor, "scheme:read");
    const scheme = await schemeRepository.findById(id);
    if (!scheme) return null;

    const summary = this.mapSchemeToSummaryDTO(scheme);
    const versions: SchemeVersionSummaryDTO[] = scheme.versions.map((v) => ({
      id: v.id,
      schemeId: v.schemeId,
      versionNumber: v.versionNumber,
      effectiveFrom: v.effectiveFrom.toISOString(),
      effectiveTo: v.effectiveTo ? v.effectiveTo.toISOString() : null,
      isActive: v.isActive,
      publishedAt: v.publishedAt.toISOString(),
      publishedByName:
        ("publishedBy" in v &&
          (v as { publishedBy?: { name?: string | null; email?: string } | null }).publishedBy
            ?.name) ||
        ("publishedBy" in v &&
          (v as { publishedBy?: { name?: string | null; email?: string } | null }).publishedBy
            ?.email) ||
        null,
      applicationOpenDate: v.applicationOpenDate ? v.applicationOpenDate.toISOString() : null,
      applicationDeadline: v.applicationDeadline ? v.applicationDeadline.toISOString() : null,
      totalApplicationsCount:
        "_count" in v && (v as { _count?: { applications?: number } })._count?.applications
          ? (v as { _count?: { applications?: number } })._count!.applications!
          : 0,
    }));

    return {
      ...summary,
      versions,
    };
  }

  async getSchemeByCode(code: string): Promise<SchemeSummaryDTO | null> {
    const scheme = await schemeRepository.findByCode(code);
    if (!scheme) return null;
    return this.mapSchemeToSummaryDTO(scheme);
  }

  /**
   * Fetch specific version details by ID
   */
  async getVersionById(
    versionId: string,
    actor?: AuthenticatedUser
  ): Promise<SchemeVersionDTO | null> {
    if (actor) {
      assertPermission(actor, "scheme:read");
    }
    const version = await schemeRepository.findVersionById(versionId);
    if (!version) return null;
    return this.mapVersionToDTO(version);
  }

  /**
   * Create a new top-level Scheme entity (Requires SCHEME_ADMIN with scheme:create)
   */
  async createScheme(data: CreateSchemeDTO, actor: AuthenticatedUser): Promise<SchemeSummaryDTO> {
    assertPermission(actor, "scheme:create");

    const validated = CreateSchemeValidator.parse(data);

    // Check code uniqueness
    const existing = await schemeRepository.findByCode(validated.code);
    if (existing) {
      throw new Error(`Scheme with code "${validated.code}" already exists.`);
    }

    const created = await schemeRepository.createScheme({
      code: validated.code,
      name: validated.name,
      description: validated.description,
      ministry: validated.ministry || "Ministry of Tribal Affairs",
      isActive: true,
    });

    return this.mapSchemeToSummaryDTO(created);
  }

  /**
   * Validate a draft version configuration before publication
   */
  validateConfig(config: PublishSchemeVersionDTO): ValidationResultDTO {
    return schemeValidationService.validateVersionConfig(config);
  }

  /**
   * Publish a new SchemeVersion for an existing Scheme.
   * Atomically deactivates the previous version and saves the new version.
   * (Requires SCHEME_ADMIN with scheme:version)
   */
  async publishVersion(
    schemeId: string,
    config: PublishSchemeVersionDTO,
    actor: AuthenticatedUser
  ): Promise<SchemeVersionDTO> {
    assertPermission(actor, "scheme:version");

    // 1. Verify scheme existence
    const scheme = await schemeRepository.findById(schemeId);
    if (!scheme) {
      throw new Error(`Scheme with id "${schemeId}" not found.`);
    }

    // 2. Validate configuration
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      const errorDetails = validation.errors
        .map((e) => `[${e.section}] ${e.field}: ${e.message}`)
        .join("; ");
      throw new Error(`Validation failed before publication: ${errorDetails}`);
    }

    // 3. Perform atomic publish transaction
    const published = await schemeRepository.publishNewVersion(schemeId, config, actor.id);

    return this.mapVersionToDTO(published);
  }
}

export const schemeService = new SchemeService();
