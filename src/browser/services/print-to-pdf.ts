export interface PrintOptions {
  readonly format: string;
  readonly landscape: boolean;
  readonly printBackground: boolean;
  readonly scale: number;
  readonly marginTop?: number;
  readonly marginBottom?: number;
  readonly marginLeft?: number;
  readonly marginRight?: number;
}

export type PrintJobStatus = 'pending' | 'printing' | 'completed' | 'failed';

export interface PrintJob {
  readonly id: string;
  readonly tabId: string;
  readonly options: PrintOptions;
  readonly status: PrintJobStatus;
  readonly createdAt: number;
  readonly outputPath?: string;
  readonly error?: string;
}

interface MutablePrintJob {
  readonly id: string;
  readonly tabId: string;
  readonly options: PrintOptions;
  status: PrintJobStatus;
  readonly createdAt: number;
  outputPath?: string;
  error?: string;
}

const DEFAULT_OPTIONS: PrintOptions = {
  format: 'A4',
  landscape: false,
  printBackground: true,
  scale: 1,
};

function clampScale(scale: number): number {
  return Math.max(0.1, Math.min(2, scale));
}

export class PrintManager {
  private readonly jobs = new Map<string, MutablePrintJob>();

  createPrintJob(tabId: string, options?: Partial<PrintOptions>): PrintJob {
    const merged: PrintOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      scale: clampScale(options?.scale ?? DEFAULT_OPTIONS.scale),
    };
    const job: MutablePrintJob = {
      id: crypto.randomUUID(),
      tabId,
      options: merged,
      status: 'pending',
      createdAt: Date.now(),
    };
    this.jobs.set(job.id, job);
    return { ...job };
  }

  getJob(id: string): PrintJob | undefined {
    const job = this.jobs.get(id);
    return job ? { ...job } : undefined;
  }

  markStarted(id: string): void {
    this.require(id).status = 'printing';
  }

  markCompleted(id: string, outputPath: string): void {
    const job = this.require(id);
    job.status = 'completed';
    job.outputPath = outputPath;
  }

  markFailed(id: string, error: string): void {
    const job = this.require(id);
    job.status = 'failed';
    job.error = error;
  }

  getJobsForTab(tabId: string): PrintJob[] {
    return [...this.jobs.values()]
      .filter((j) => j.tabId === tabId)
      .map((j) => ({ ...j }));
  }

  getAllJobs(): PrintJob[] {
    return [...this.jobs.values()].map((j) => ({ ...j }));
  }

  private require(id: string): MutablePrintJob {
    const job = this.jobs.get(id);
    if (!job) throw new Error(`Print job not found: ${id}`);
    return job;
  }
}
