export type TabLoadState = 'pending' | 'loading' | 'loaded';

export interface LazyTabInfo {
  readonly tabId: string;
  readonly state: TabLoadState;
  readonly queuePosition: number;
}

const DEFAULT_PRELOAD_COUNT = 1;

export class LazyTabService {
  private readonly states: Map<string, TabLoadState> = new Map();
  private readonly queue: string[] = [];
  private readonly preloadCount: number;

  constructor(preloadCount: number = DEFAULT_PRELOAD_COUNT) {
    this.preloadCount = preloadCount;
  }

  trackTab(tabId: string): void {
    if (this.states.has(tabId)) {
      throw new Error(`Tab "${tabId}" is already tracked`);
    }
    this.states.set(tabId, 'pending');
    this.queue.push(tabId);
  }

  activateTab(tabId: string): void {
    if (!this.states.has(tabId)) {
      throw new Error(`Tab "${tabId}" is not tracked`);
    }
    this.states.set(tabId, 'loaded');
    this.removeFromQueue(tabId);
  }

  triggerLoad(tabId: string): void {
    if (!this.states.has(tabId)) {
      throw new Error(`Tab "${tabId}" is not tracked`);
    }
    const current = this.states.get(tabId);
    if (current === 'loaded' || current === 'loading') return;
    this.states.set(tabId, 'loading');
    this.removeFromQueue(tabId);
  }

  getState(tabId: string): TabLoadState | undefined {
    return this.states.get(tabId);
  }

  isLoaded(tabId: string): boolean {
    return this.states.get(tabId) === 'loaded';
  }

  getPendingTabs(): readonly string[] {
    return [...this.queue];
  }

  getLoadedTabs(): readonly string[] {
    const result: string[] = [];
    for (const [tabId, state] of this.states) {
      if (state === 'loaded') result.push(tabId);
    }
    return result;
  }

  getLoadOrder(): readonly string[] {
    return [...this.queue];
  }

  clearTab(tabId: string): void {
    this.states.delete(tabId);
    this.removeFromQueue(tabId);
  }

  getInfo(tabId: string): LazyTabInfo | null {
    const state = this.states.get(tabId);
    if (state === undefined) return null;
    const queueIndex = this.queue.indexOf(tabId);
    return { tabId, state, queuePosition: queueIndex };
  }

  preload(): readonly string[] {
    const pending = [...this.queue];
    const toLoad = pending.slice(0, this.preloadCount);
    for (const tabId of toLoad) {
      this.states.set(tabId, 'loading');
      this.removeFromQueue(tabId);
    }
    return toLoad;
  }

  private removeFromQueue(tabId: string): void {
    const index = this.queue.indexOf(tabId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }
}
