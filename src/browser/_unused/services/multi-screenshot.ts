export type ScreenshotFormat = 'png' | 'jpeg';
export type ScreenshotStatus = 'pending' | 'capturing' | 'completed' | 'failed';

export interface ScreenshotJob {
  readonly id: string;
  readonly tabId: string;
  readonly format: ScreenshotFormat;
  readonly status: ScreenshotStatus;
  readonly data?: string;
  readonly error?: string;
}

export interface ScreenshotBatch {
  readonly id: string;
  readonly jobs: readonly ScreenshotJob[];
  readonly createdAt: number;
}

interface MutableJob {
  readonly id: string;
  readonly tabId: string;
  readonly format: ScreenshotFormat;
  status: ScreenshotStatus;
  data?: string;
  error?: string;
}

interface MutableBatch {
  readonly id: string;
  readonly jobs: MutableJob[];
  readonly createdAt: number;
}

interface BatchProgress {
  readonly completed: number;
  readonly total: number;
}

const TERMINAL_STATUSES: ReadonlySet<ScreenshotStatus> = new Set([
  'completed',
  'failed',
]);

function snapshotBatch(batch: MutableBatch): ScreenshotBatch {
  return {
    id: batch.id,
    jobs: batch.jobs.map((j) => ({ ...j })),
    createdAt: batch.createdAt,
  };
}

export class MultiScreenshotService {
  private readonly batches = new Map<string, MutableBatch>();

  createBatch(
    tabIds: readonly string[],
    format: ScreenshotFormat = 'png',
  ): ScreenshotBatch {
    if (tabIds.length === 0) {
      throw new Error('Must provide at least one tab ID');
    }
    const batch: MutableBatch = {
      id: crypto.randomUUID(),
      jobs: tabIds.map((tabId) => createJob(tabId, format)),
      createdAt: Date.now(),
    };
    this.batches.set(batch.id, batch);
    return snapshotBatch(batch);
  }

  getBatch(batchId: string): ScreenshotBatch | undefined {
    const batch = this.batches.get(batchId);
    return batch ? snapshotBatch(batch) : undefined;
  }

  markCapturing(batchId: string, jobId: string): void {
    this.requireJob(batchId, jobId).status = 'capturing';
  }

  markCompleted(batchId: string, jobId: string, data: string): void {
    const job = this.requireJob(batchId, jobId);
    job.status = 'completed';
    job.data = data;
  }

  markFailed(batchId: string, jobId: string, error: string): void {
    const job = this.requireJob(batchId, jobId);
    job.status = 'failed';
    job.error = error;
  }

  getProgress(batchId: string): BatchProgress {
    const batch = this.requireBatch(batchId);
    const completed = batch.jobs.filter((j) =>
      TERMINAL_STATUSES.has(j.status),
    ).length;
    return { completed, total: batch.jobs.length };
  }

  isBatchComplete(batchId: string): boolean {
    const batch = this.requireBatch(batchId);
    return batch.jobs.every((j) => TERMINAL_STATUSES.has(j.status));
  }

  getCompletedScreenshots(batchId: string): readonly ScreenshotJob[] {
    const batch = this.requireBatch(batchId);
    return batch.jobs
      .filter((j) => j.status === 'completed')
      .map((j) => ({ ...j }));
  }

  cancelBatch(batchId: string): void {
    this.requireBatch(batchId);
    this.batches.delete(batchId);
  }

  private requireBatch(batchId: string): MutableBatch {
    const batch = this.batches.get(batchId);
    if (!batch) throw new Error(`Batch not found: ${batchId}`);
    return batch;
  }

  private requireJob(batchId: string, jobId: string): MutableJob {
    const batch = this.requireBatch(batchId);
    const job = batch.jobs.find((j) => j.id === jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    return job;
  }
}

function createJob(tabId: string, format: ScreenshotFormat): MutableJob {
  return {
    id: crypto.randomUUID(),
    tabId,
    format,
    status: 'pending',
  };
}
