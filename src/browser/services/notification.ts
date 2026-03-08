export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface NightmareNotification {
  readonly id: string;
  readonly type: NotificationType;
  readonly priority: NotificationPriority;
  readonly title: string;
  readonly message: string;
  readonly timestamp: number;
  readonly autoDismissMs: number;
}

export interface CreateNotificationInput {
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly priority?: NotificationPriority | undefined;
  readonly autoDismissMs?: number | undefined;
}

export interface NotificationManagerOptions {
  readonly maxActive?: number | undefined;
  readonly maxHistory?: number | undefined;
  readonly defaultAutoDismissMs?: number | undefined;
}

const DEFAULT_MAX_ACTIVE = 10;
const DEFAULT_MAX_HISTORY = 50;
const DEFAULT_AUTO_DISMISS_MS = 5000;

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  return `notif-${String(idCounter)}-${String(Date.now())}`;
}

function resolveAutoDismiss(
  priority: NotificationPriority,
  explicit: number | undefined,
  fallback: number,
): number {
  if (priority === 'critical') return 0;
  return explicit ?? fallback;
}

export class NotificationManager {
  private readonly active: NightmareNotification[] = [];
  private readonly history: NightmareNotification[] = [];
  private readonly maxActive: number;
  private readonly maxHistory: number;
  private readonly defaultAutoDismissMs: number;

  constructor(options?: NotificationManagerOptions) {
    this.maxActive = options?.maxActive ?? DEFAULT_MAX_ACTIVE;
    this.maxHistory = options?.maxHistory ?? DEFAULT_MAX_HISTORY;
    this.defaultAutoDismissMs = options?.defaultAutoDismissMs ?? DEFAULT_AUTO_DISMISS_MS;
  }

  create(input: CreateNotificationInput): NightmareNotification {
    const priority = input.priority ?? 'normal';
    const notification: NightmareNotification = {
      id: generateId(),
      type: input.type,
      priority,
      title: input.title,
      message: input.message,
      timestamp: Date.now(),
      autoDismissMs: resolveAutoDismiss(priority, input.autoDismissMs, this.defaultAutoDismissMs),
    };
    this.active.push(notification);
    this.enforceMaxActive();
    return notification;
  }

  getAll(): readonly NightmareNotification[] {
    return [...this.active];
  }

  getById(id: string): NightmareNotification | undefined {
    return this.active.find((n) => n.id === id);
  }

  dismiss(id: string): boolean {
    const index = this.active.findIndex((n) => n.id === id);
    if (index === -1) return false;
    const removed = this.active.splice(index, 1)[0];
    if (removed !== undefined) {
      this.addToHistory(removed);
    }
    return true;
  }

  clearAll(): void {
    for (const n of this.active) {
      this.addToHistory(n);
    }
    this.active.length = 0;
  }

  getHistory(): readonly NightmareNotification[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history.length = 0;
  }

  private addToHistory(notification: NightmareNotification): void {
    this.history.push(notification);
    this.enforceMaxHistory();
  }

  private enforceMaxHistory(): void {
    while (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  private enforceMaxActive(): void {
    while (this.active.length > this.maxActive) {
      const evictIndex = this.findOldestNonCritical();
      if (evictIndex === -1) break;
      const evicted = this.active.splice(evictIndex, 1)[0];
      if (evicted !== undefined) {
        this.addToHistory(evicted);
      }
    }
  }

  private findOldestNonCritical(): number {
    for (let i = 0; i < this.active.length; i++) {
      if (this.active[i]?.priority !== 'critical') return i;
    }
    return -1;
  }
}
