export interface NetworkEntry {
  readonly id: string;
  readonly tabId: string;
  readonly url: string;
  readonly method: string;
  readonly status: number;
  readonly statusText: string;
  readonly requestHeaders: ReadonlyMap<string, string>;
  readonly responseHeaders: ReadonlyMap<string, string>;
  readonly startTime: number;
  readonly duration: number;
  readonly size: number;
  readonly mimeType: string;
}

export interface NetworkFilter {
  readonly tabId?: string | undefined;
  readonly urlPattern?: string | undefined;
  readonly method?: string | undefined;
  readonly statusMin?: number | undefined;
  readonly statusMax?: number | undefined;
}

export interface NetworkStats {
  readonly totalRequests: number;
  readonly avgDuration: number;
  readonly errorCount: number;
  readonly totalSize: number;
}

const DEFAULT_MAX_PER_TAB = 5000;
const ERROR_STATUS_THRESHOLD = 400;

export class NetworkLog {
  private readonly buffers = new Map<string, NetworkEntry[]>();
  private readonly maxPerTab: number;

  constructor(maxPerTab: number = DEFAULT_MAX_PER_TAB) {
    this.maxPerTab = maxPerTab;
  }

  add(entry: NetworkEntry): void {
    const buffer = this.buffers.get(entry.tabId) ?? [];
    buffer.push(entry);
    if (buffer.length > this.maxPerTab) {
      buffer.shift();
    }
    this.buffers.set(entry.tabId, buffer);
  }

  getEntries(tabId: string): NetworkEntry[] {
    return [...(this.buffers.get(tabId) ?? [])];
  }

  getAllEntries(): NetworkEntry[] {
    const all: NetworkEntry[] = [];
    for (const buffer of this.buffers.values()) {
      all.push(...buffer);
    }
    return all.sort((a, b) => a.startTime - b.startTime);
  }

  filter(criteria: NetworkFilter): NetworkEntry[] {
    return this.getAllEntries().filter(
      (entry) => matchesFilter(entry, criteria),
    );
  }

  search(query: string): NetworkEntry[] {
    const lower = query.toLowerCase();
    return this.getAllEntries().filter(
      (entry) => entry.url.toLowerCase().includes(lower),
    );
  }

  getStats(tabId: string): NetworkStats {
    const entries = this.getEntries(tabId);
    return computeStats(entries);
  }

  clear(tabId: string): void {
    this.buffers.delete(tabId);
  }

  clearAll(): void {
    this.buffers.clear();
  }
}

function matchesFilter(
  entry: NetworkEntry,
  criteria: NetworkFilter,
): boolean {
  if (criteria.tabId !== undefined && entry.tabId !== criteria.tabId) {
    return false;
  }
  if (criteria.method !== undefined && entry.method !== criteria.method) {
    return false;
  }
  if (criteria.urlPattern !== undefined) {
    if (!entry.url.includes(criteria.urlPattern)) {
      return false;
    }
  }
  if (criteria.statusMin !== undefined && entry.status < criteria.statusMin) {
    return false;
  }
  if (criteria.statusMax !== undefined && entry.status > criteria.statusMax) {
    return false;
  }
  return true;
}

function computeStats(entries: readonly NetworkEntry[]): NetworkStats {
  if (entries.length === 0) {
    return { totalRequests: 0, avgDuration: 0, errorCount: 0, totalSize: 0 };
  }
  const totalDuration = entries.reduce((sum, e) => sum + e.duration, 0);
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
  const errorCount = entries.filter(
    (e) => e.status >= ERROR_STATUS_THRESHOLD,
  ).length;
  return {
    totalRequests: entries.length,
    avgDuration: totalDuration / entries.length,
    errorCount,
    totalSize,
  };
}
