/**
 * Rule Result Repository
 * Phase 2G: Deterministic Eligibility & Evidence Verification Engine
 */

import { prisma } from "../db";
import { RuleResult, Prisma } from "@prisma/client";

export class RuleResultRepository {
  /**
   * Batch creates rule evaluation results for a specific evaluation run.
   */
  async createMany(data: Prisma.RuleResultCreateManyInput[]): Promise<number> {
    if (data.length === 0) return 0;
    const result = await prisma.ruleResult.createMany({
      data,
    });
    return result.count;
  }

  /**
   * Retrieves all rule results for a given evaluation run ID.
   */
  async findByRunId(runId: string): Promise<RuleResult[]> {
    return prisma.ruleResult.findMany({
      where: { runId },
      orderBy: { ruleKey: "asc" },
    });
  }

  /**
   * Retrieves the latest evaluation run results for a case dossier.
   */
  async findLatestByCaseDossierId(caseDossierId: string): Promise<RuleResult[]> {
    // Find the most recent runId for this case dossier
    const latest = await prisma.ruleResult.findFirst({
      where: { caseDossierId },
      orderBy: { evaluatedAt: "desc" },
      select: { runId: true },
    });

    if (!latest) {
      return [];
    }

    return prisma.ruleResult.findMany({
      where: {
        caseDossierId,
        runId: latest.runId,
      },
      orderBy: { ruleKey: "asc" },
    });
  }

  /**
   * Retrieves summary history of all evaluation runs executed for a case dossier.
   */
  async findHistoryByCaseDossierId(caseDossierId: string): Promise<
    Array<{
      runId: string;
      evaluatedAt: Date;
      totalRules: number;
      passed: number;
      failed: number;
      ambiguous: number;
      skipped: number;
    }>
  > {
    const allResults = await prisma.ruleResult.findMany({
      where: { caseDossierId },
      orderBy: { evaluatedAt: "desc" },
    });

    // Group by runId
    const runsMap = new Map<
      string,
      {
        runId: string;
        evaluatedAt: Date;
        totalRules: number;
        passed: number;
        failed: number;
        ambiguous: number;
        skipped: number;
      }
    >();

    for (const r of allResults) {
      if (!runsMap.has(r.runId)) {
        runsMap.set(r.runId, {
          runId: r.runId,
          evaluatedAt: r.evaluatedAt,
          totalRules: 0,
          passed: 0,
          failed: 0,
          ambiguous: 0,
          skipped: 0,
        });
      }

      const run = runsMap.get(r.runId)!;
      run.totalRules++;
      if (r.outcome === "PASS") run.passed++;
      else if (r.outcome === "FAIL") run.failed++;
      else if (r.outcome === "AMBIGUOUS") run.ambiguous++;
      else if (r.outcome === "SKIPPED") run.skipped++;
    }

    return Array.from(runsMap.values());
  }
}

export const ruleResultRepository = new RuleResultRepository();
