export interface ConsoleEntry {
  readonly tabId: string;
  readonly level: string;
  readonly args: unknown[];
  readonly timestamp: number;
}

export class ConsoleCapture {
  private readonly buffers = new Map<string, ConsoleEntry[]>();
  private readonly maxPerTab: number;

  constructor(maxPerTab: number = 10000) {
    this.maxPerTab = maxPerTab;
  }

  add(tabId: string, level: string, args: unknown[]): void {
    const buffer = this.buffers.get(tabId) ?? [];
    buffer.push({ tabId, level, args, timestamp: Date.now() });
    if (buffer.length > this.maxPerTab) {
      buffer.shift();
    }
    this.buffers.set(tabId, buffer);
  }

  getEntries(tabId: string, level?: string): ConsoleEntry[] {
    const buffer = this.buffers.get(tabId) ?? [];
    if (level !== undefined) {
      return buffer.filter((e) => e.level === level);
    }
    return [...buffer];
  }

  getAllEntries(): ConsoleEntry[] {
    const all: ConsoleEntry[] = [];
    for (const buffer of this.buffers.values()) {
      all.push(...buffer);
    }
    return all.sort((a, b) => a.timestamp - b.timestamp);
  }

  clear(tabId: string): void {
    this.buffers.delete(tabId);
  }

  clearAll(): void {
    this.buffers.clear();
  }
}
