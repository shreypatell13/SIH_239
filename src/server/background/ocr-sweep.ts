import { documentProcessingJobRepository } from "../repositories/document-processing-job.repository";
import { documentProcessingService } from "../services/document-processing.service";

export interface OcrSweepSummary {
  recoveredStaleJobs: number;
  claimedJobs: number;
  processedJobs: number;
  failedJobs: number;
  errors: string[];
}

export class OcrBackgroundSweep {
  /**
   * Executes a single sweep iteration.
   */
  static async runSweep(batchSize = 5): Promise<OcrSweepSummary> {
    const summary: OcrSweepSummary = {
      recoveredStaleJobs: 0,
      claimedJobs: 0,
      processedJobs: 0,
      failedJobs: 0,
      errors: [],
    };

    try {
      // 1. Recover stale processing jobs
      summary.recoveredStaleJobs = await documentProcessingJobRepository.recoverStaleJobs(5);

      // 2. Claim and process up to batchSize jobs
      for (let i = 0; i < batchSize; i++) {
        const job = await documentProcessingJobRepository.claimNextPendingJob();
        if (!job) {
          break; // No more pending jobs
        }

        summary.claimedJobs++;

        try {
          await documentProcessingService.processJob(job.id);
          summary.processedJobs++;
        } catch (err: any) {
          summary.failedJobs++;
          summary.errors.push(`Job ${job.id} error: ${err?.message || "Unknown error"}`);
        }
      }
    } catch (err: any) {
      summary.errors.push(`Sweep error: ${err?.message || "Unknown error"}`);
    }

    return summary;
  }
}
