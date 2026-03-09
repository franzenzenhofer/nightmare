import type { Tab } from './tab';
import { createTab } from './tab';
import { SecurityZones } from './security-zones';

export class TabManager {
  private readonly tabs: Map<string, Tab> = new Map();
  private activeTabId: string | null = null;
  private readonly securityZones = new SecurityZones();

  createTab(url?: string, openerId?: string, displayUrl?: string): Tab {
    const tab = createTab(url, openerId, displayUrl);
    this.tabs.set(tab.id, tab);
    this.activeTabId = tab.id;
    return tab;
  }

  hasTab(id: string): boolean {
    return this.tabs.has(id);
  }

  closeTab(id: string): void {
    const tab = this.tabs.get(id);
    if (!tab) return;
    if (tab.pinned) return;

    this.tabs.delete(id);

    if (this.activeTabId === id) {
      const remaining = [...this.tabs.keys()];
      this.activeTabId = remaining.length > 0 ? remaining[remaining.length - 1] ?? null : null;
      if (this.activeTabId === null) {
        this.createTab();
      }
    }
  }

  activateTab(id: string): void {
    if (this.tabs.has(id)) {
      this.activeTabId = id;
    }
  }

  duplicateTab(id: string): Tab | null {
    const source = this.tabs.get(id);
    if (!source) return null;
    return this.createTab(source.url);
  }

  pinTab(id: string): void {
    const tab = this.tabs.get(id);
    if (tab) {
      tab.pinned = !tab.pinned;
    }
  }

  updateTabFromWebview(
    id: string,
    updates: Partial<Tab>,
    displayUrl?: string,
  ): void {
    const tab = this.tabs.get(id);
    if (!tab) return;
    Object.assign(tab, updates);
    if (updates.url !== undefined) {
      tab.zone = this.securityZones.classify(displayUrl ?? updates.url);
    }
  }

  getActiveTab(): Tab | null {
    if (this.activeTabId === null) return null;
    return this.tabs.get(this.activeTabId) ?? null;
  }

  getTab(id: string): Tab | null {
    return this.tabs.get(id) ?? null;
  }

  getAllTabs(): Tab[] {
    return [...this.tabs.values()];
  }

  getTabCount(): number {
    return this.tabs.size;
  }
}
