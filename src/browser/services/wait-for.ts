export type WaitCondition = 'selector' | 'text' | 'url' | 'idle';
export type WaitStatus = 'waiting' | 'satisfied' | 'timeout' | 'cancelled';

export const DEFAULT_TIMEOUT = 30_000;
export const DEFAULT_POLL_INTERVAL = 250;

export interface WaitJob {
  readonly id: string;
  readonly tabId: string;
  readonly condition: WaitCondition;
  readonly value: string;
  readonly timeout: number;
  readonly pollingInterval: number;
  readonly status: WaitStatus;
  readonly createdAt: number;
}

export interface CreateJobInput {
  readonly tabId: string;
  readonly condition: WaitCondition;
  readonly value: string;
  readonly timeout?: number;
  readonly pollingInterval?: number;
}

interface MutableJob {
  readonly id: string;
  readonly tabId: string;
  readonly condition: WaitCondition;
  readonly value: string;
  readonly timeout: number;
  readonly pollingInterval: number;
  status: WaitStatus;
  readonly createdAt: number;
}

function validateInput(input: CreateJobInput): void {
  if (input.tabId === '') {
    throw new Error('Tab ID must not be empty');
  }
  if (input.value === '') {
    throw new Error('Wait value must not be empty');
  }
  if (input.timeout !== undefined && input.timeout <= 0) {
    throw new Error('Timeout must be positive');
  }
  if (input.pollingInterval !== undefined && input.pollingInterval <= 0) {
    throw new Error('Polling interval must be positive');
  }
}

function toReadonly(job: MutableJob): WaitJob {
  return { ...job };
}

export class WaitForManager {
  private readonly jobs: Map<string, MutableJob> = new Map();

  createJob(input: CreateJobInput): WaitJob {
    validateInput(input);
    const job: MutableJob = {
      id: crypto.randomUUID(),
      tabId: input.tabId,
      condition: input.condition,
      value: input.value,
      timeout: input.timeout ?? DEFAULT_TIMEOUT,
      pollingInterval: input.pollingInterval ?? DEFAULT_POLL_INTERVAL,
      status: 'waiting',
      createdAt: Date.now(),
    };
    this.jobs.set(job.id, job);
    return toReadonly(job);
  }

  getJob(id: string): WaitJob | undefined {
    const job = this.jobs.get(id);
    return job !== undefined ? toReadonly(job) : undefined;
  }

  satisfy(id: string): WaitJob | undefined {
    return this.transitionStatus(id, 'satisfied');
  }

  markTimeout(id: string): WaitJob | undefined {
    return this.transitionStatus(id, 'timeout');
  }

  cancel(id: string): WaitJob | undefined {
    return this.transitionStatus(id, 'cancelled');
  }

  getActiveJobsForTab(tabId: string): readonly WaitJob[] {
    const results: WaitJob[] = [];
    for (const job of this.jobs.values()) {
      if (job.tabId === tabId && job.status === 'waiting') {
        results.push(toReadonly(job));
      }
    }
    return results;
  }

  getElapsedTime(id: string): number | undefined {
    const job = this.jobs.get(id);
    return job !== undefined ? Date.now() - job.createdAt : undefined;
  }

  isExpired(id: string): boolean | undefined {
    const elapsed = this.getElapsedTime(id);
    const job = this.jobs.get(id);
    if (elapsed === undefined || job === undefined) {
      return undefined;
    }
    return elapsed >= job.timeout;
  }

  cancelAllForTab(tabId: string): number {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.tabId === tabId && job.status === 'waiting') {
        job.status = 'cancelled';
        count++;
      }
    }
    return count;
  }

  private transitionStatus(
    id: string,
    target: WaitStatus,
  ): WaitJob | undefined {
    const job = this.jobs.get(id);
    if (job === undefined) {
      return undefined;
    }
    if (job.status === 'waiting') {
      job.status = target;
    }
    return toReadonly(job);
  }
}
