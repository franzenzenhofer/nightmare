import type { Tab } from './tab';
import type { TabManager } from './tab-manager';

export type MemoryPressure = 'low' | 'normal' | 'high' | 'critical';

export interface SuspendedTab {
  readonly tabId: string;
  readonly url: string;
  readonly title: string;
  readonly suspendedAt: number;
}

const DEFAULT_IDLE_THRESHOLD_MS = 30 * 60 * 1000;

export class TabSuspendManager {
  private readonly lastActive: Map<string, number> = new Map();
  private readonly suspended: Map<string, SuspendedTab> = new Map();
  private readonly tabManager: TabManager;
  private memoryPressure: MemoryPressure = 'normal';

  constructor(tabManager: TabManager) {
    this.tabManager = tabManager;
  }

  touchTab(tabId: string): void {
    this.lastActive.set(tabId, Date.now());
  }

  getLastActive(tabId: string): number {
    return this.lastActive.get(tabId) ?? 0;
  }

  suspendTab(tabId: string): boolean {
    if (this.suspended.has(tabId)) return false;
    const tab = this.tabManager.getTab(tabId);
    if (!tab) return false;
    this.suspended.set(tabId, buildSuspendedTab(tab));
    return true;
  }

  unsuspendTab(tabId: string): boolean {
    if (!this.suspended.has(tabId)) return false;
    this.suspended.delete(tabId);
    this.lastActive.set(tabId, Date.now());
    return true;
  }

  isSuspended(tabId: string): boolean {
    return this.suspended.has(tabId);
  }

  getSuspendedTab(tabId: string): SuspendedTab | null {
    return this.suspended.get(tabId) ?? null;
  }

  getAllSuspended(): readonly SuspendedTab[] {
    return [...this.suspended.values()];
  }

  suggestForSuspension(thresholdMs: number = DEFAULT_IDLE_THRESHOLD_MS): readonly string[] {
    const now = Date.now();
    const suggestions: string[] = [];
    for (const [tabId, timestamp] of this.lastActive) {
      if (this.shouldSuggest(tabId, timestamp, now, thresholdMs)) {
        suggestions.push(tabId);
      }
    }
    return suggestions;
  }

  discardTab(tabId: string): boolean {
    const hadActive = this.lastActive.has(tabId);
    const hadSuspended = this.suspended.has(tabId);
    if (!hadActive && !hadSuspended) return false;
    this.lastActive.delete(tabId);
    this.suspended.delete(tabId);
    return true;
  }

  getMemoryPressure(): MemoryPressure {
    return this.memoryPressure;
  }

  setMemoryPressure(level: MemoryPressure): void {
    this.memoryPressure = level;
  }

  getTabsByLastActive(): readonly Tab[] {
    const entries = [...this.lastActive.entries()]
      .filter(([tabId]) => this.tabManager.getTab(tabId) !== null)
      .sort((a, b) => a[1] - b[1]);
    return entries
      .map(([tabId]) => this.tabManager.getTab(tabId))
      .filter((tab): tab is Tab => tab !== null);
  }

  private shouldSuggest(
    tabId: string,
    timestamp: number,
    now: number,
    thresholdMs: number,
  ): boolean {
    if (this.suspended.has(tabId)) return false;
    const tab = this.tabManager.getTab(tabId);
    if (!tab) return false;
    if (tab.pinned) return false;
    return now - timestamp > thresholdMs;
  }
}

function buildSuspendedTab(tab: Tab): SuspendedTab {
  return {
    tabId: tab.id,
    url: tab.url,
    title: tab.title,
    suspendedAt: Date.now(),
  };
}
