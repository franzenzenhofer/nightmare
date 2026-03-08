export type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

export interface ConsoleLogEntry {
  readonly tabId: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: number;
}

export interface StreamFilter {
  readonly tabId?: string | undefined;
  readonly level?: LogLevel | undefined;
  readonly pattern?: string | undefined;
}

export type LogCallback = (entry: ConsoleLogEntry) => void;

interface Subscriber {
  readonly id: string;
  readonly callback: LogCallback;
  readonly filter: StreamFilter | undefined;
  paused: boolean;
}

let nextId = 0;

function generateId(): string {
  nextId += 1;
  return `sub_${String(nextId)}`;
}

function matchesFilter(
  entry: ConsoleLogEntry,
  filter: StreamFilter | undefined,
): boolean {
  if (filter === undefined) {
    return true;
  }
  if (filter.tabId !== undefined && entry.tabId !== filter.tabId) {
    return false;
  }
  if (filter.level !== undefined && entry.level !== filter.level) {
    return false;
  }
  if (filter.pattern !== undefined) {
    const lower = entry.message.toLowerCase();
    if (!lower.includes(filter.pattern.toLowerCase())) {
      return false;
    }
  }
  return true;
}

export class ConsoleStream {
  private readonly subscribers = new Map<string, Subscriber>();
  private broadcastCount = 0;

  subscribe(callback: LogCallback, filter?: StreamFilter): string {
    const id = generateId();
    this.subscribers.set(id, {
      id,
      callback,
      filter,
      paused: false,
    });
    return id;
  }

  unsubscribe(id: string): boolean {
    return this.subscribers.delete(id);
  }

  broadcast(entry: ConsoleLogEntry): void {
    this.broadcastCount += 1;
    for (const sub of this.subscribers.values()) {
      if (sub.paused) {
        continue;
      }
      if (!matchesFilter(entry, sub.filter)) {
        continue;
      }
      try {
        sub.callback(entry);
      } catch {
        // Isolate subscriber errors
      }
    }
  }

  pause(id: string): boolean {
    const sub = this.subscribers.get(id);
    if (sub === undefined) {
      return false;
    }
    sub.paused = true;
    return true;
  }

  resume(id: string): boolean {
    const sub = this.subscribers.get(id);
    if (sub === undefined) {
      return false;
    }
    sub.paused = false;
    return true;
  }

  subscriberCount(): number {
    return this.subscribers.size;
  }

  totalBroadcast(): number {
    return this.broadcastCount;
  }
}
