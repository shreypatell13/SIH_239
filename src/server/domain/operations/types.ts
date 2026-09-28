import { CaseStage, CaseState, DeficiencyType, DocumentType } from "@prisma/client";

export type BottleneckSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type BottleneckType =
  | "STAGE_VOLUME_CONGESTION"
  | "STAGE_AGE_TRIGGER"
  | "DEFICIENCY_FRICTION_CONCENTRATION"
  | "UNALLOCATED_OFFICER_QUEUE"
  | "OFFICER_WORKLOAD_CONCENTRATION";

export type AgingBucket = "DAYS_0_TO_2" | "DAYS_3_TO_7" | "DAYS_8_TO_14" | "DAYS_15_PLUS";

export interface OperationsFilterParams {
  schemeCode?: string;
  schemeVersionId?: string;
  stage?: CaseStage;
  state?: CaseState;
  fromDate?: string;
  toDate?: string;
}

export interface KpiSummaryDTO {
  totalIngestedCases: number;
  activePipelineCases: number;
  pendingCases: number;
  underVerificationCases: number;
  deficientCases: number;
  awaitingApplicantCases: number;
  completedCases: number;
  officerAttentionCases: number;
  closedCasePercentage: number;
  avgActiveCaseAgeDays: number;
  unresolvedDeficienciesCount: number;
  unassignedOfficerQueueCount: number;
  blockedCasesCount: number;
}

export interface StageWorkloadItemDTO {
  stage: CaseStage;
  stageLabel: string;
  totalCases: number;
  pendingCount: number;
  inReviewCount: number;
  blockedCount: number;
  approvedCount: number;
  rejectedCount: number;
  avgDwellDays: number;
  percentageOfActive: number;
}

export interface AgingBucketItemDTO {
  bucket: AgingBucket;
  label: string;
  count: number;
  percentageOfActive: number;
}

export interface DeficiencyFrictionItemDTO {
  schemeCode: string;
  schemeName: string;
  deficiencyType: DeficiencyType;
  documentType: DocumentType | "UNSPECIFIED";
  openCount: number;
  resolvedCount: number;
  totalCount: number;
  recheckCount: number;
  affectedCaseCount: number;
  recheckFailureRate: number;
}

export interface BottleneckItemDTO {
  id: string;
  type: BottleneckType;
  title: string;
  severity: BottleneckSeverity;
  affectedStage?: CaseStage;
  affectedDocumentType?: DocumentType;
  schemeCode?: string;
  affectedOfficerId?: string;
  caseCount: number;
  metricValue: number;
  thresholdValue: number;
  unit: string;
  explanation: string;
  drillDownFilters: {
    stage?: CaseStage;
    state?: CaseState;
    agingBucket?: AgingBucket;
    deficiencyType?: DeficiencyType;
    documentType?: DocumentType;
    schemeCode?: string;
    assignedOfficerId?: string;
    unassignedOnly?: boolean;
    blockedOnly?: boolean;
  };
}

export interface DrillDownCaseDTO {
  id: string;
  caseNumber: string;
  applicationNumber: string;
  schemeCode: string;
  schemeName: string;
  currentStage: CaseStage;
  currentState: CaseState;
  officerAssignedName: string | null;
  daysInPipeline: number;
  daysInCurrentStage: number;
  openDeficienciesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedDrillDownCasesDTO {
  cases: DrillDownCaseDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OperationsOverviewDTO {
  filter: OperationsFilterParams;
  kpis: KpiSummaryDTO;
  stageDistribution: StageWorkloadItemDTO[];
  agingDistribution: AgingBucketItemDTO[];
  deficiencyHeatmap: DeficiencyFrictionItemDTO[];
  officerWorkload: OfficerWorkloadItemDTO[];
  schemeSummary: SchemeOperationsSummaryDTO[];
  generatedAt: string;
}

export interface OfficerWorkloadItemDTO {
  officerId: string;
  officerName: string;
  assignedCases: number;
  openCases: number;
  completedCases: number;
  oldestOpenCaseAgeDays: number | null;
}

export interface SchemeOperationsSummaryDTO {
  schemeCode: string;
  schemeName: string;
  totalCases: number;
  activeCases: number;
  deficientCases: number;
  averageActiveAgeDays: number;
}

export interface OperationsBottlenecksDTO {
  filter: OperationsFilterParams;
  bottlenecks: BottleneckItemDTO[];
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  generatedAt: string;
}
