import type { SecurityZone } from './security-zones';

export interface ClosedTabEntry {
  readonly url: string;
  readonly title: string;
  readonly zone: SecurityZone;
  readonly closedAt: number;
}

export interface RecordInput {
  readonly url: string;
  readonly title: string;
  readonly zone: SecurityZone;
}

const DEFAULT_CAPACITY = 25;

export class ClosedTabsManager {
  private readonly entries: ClosedTabEntry[] = [];
  private readonly capacity: number;

  constructor(capacity: number = DEFAULT_CAPACITY) {
    this.capacity = capacity;
  }

  record(input: RecordInput): void {
    const entry: ClosedTabEntry = {
      url: input.url,
      title: input.title,
      zone: input.zone,
      closedAt: Date.now(),
    };
    this.entries.push(entry);
    this.enforceCapacity();
  }

  getRecentlyClosed(limit: number): readonly ClosedTabEntry[] {
    return [...this.entries].reverse().slice(0, limit);
  }

  reopenLast(): ClosedTabEntry | undefined {
    return this.entries.pop();
  }

  clear(): void {
    this.entries.length = 0;
  }

  private enforceCapacity(): void {
    while (this.entries.length > this.capacity) {
      this.entries.shift();
    }
  }
}
