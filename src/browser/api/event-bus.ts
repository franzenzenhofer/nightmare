import type { SecurityZone } from '../services/security-zones';

export type BrowserEvent =
  | { type: 'tab:created'; tab: { id: string; url: string; title: string; zone: SecurityZone } }
  | { type: 'tab:closed'; tabId: string }
  | { type: 'tab:navigated'; tabId: string; url: string }
  | { type: 'tab:loaded'; tabId: string; title: string }
  | { type: 'tab:loading'; tabId: string }
  | { type: 'console'; tabId: string; level: string; args: unknown[] }
  | { type: 'zone:changed'; tabId: string; zone: SecurityZone }
  | { type: 'bookmark:added'; bookmark: { id: string; title: string; url: string } }
  | { type: 'error'; tabId: string; error: string };

type GenericHandler = (event: BrowserEvent) => void;

export class EventBus {
  private readonly handlers = new Map<string, Set<GenericHandler>>();
  private readonly allHandlers = new Set<GenericHandler>();
  private readonly history: BrowserEvent[] = [];
  private readonly maxHistory: number;

  constructor(maxHistory: number = 1000) {
    this.maxHistory = maxHistory;
  }

  on<T extends BrowserEvent['type']>(
    type: T,
    handler: (event: Extract<BrowserEvent, { type: T }>) => void,
  ): () => void {
    const set = this.handlers.get(type) ?? new Set<GenericHandler>();
    const wrapped: GenericHandler = (event): void => {
      handler(event as Extract<BrowserEvent, { type: T }>);
    };
    set.add(wrapped);
    this.handlers.set(type, set);
    return (): void => {
      set.delete(wrapped);
    };
  }

  onAll(handler: GenericHandler): () => void {
    this.allHandlers.add(handler);
    return (): void => {
      this.allHandlers.delete(handler);
    };
  }

  emit(event: BrowserEvent): void {
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const set = this.handlers.get(event.type);
    if (set) {
      for (const handler of set) {
        handler(event);
      }
    }

    for (const handler of this.allHandlers) {
      handler(event);
    }
  }

  getHistory(): readonly BrowserEvent[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history.length = 0;
  }
}
