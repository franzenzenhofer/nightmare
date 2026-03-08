import type { TabManager } from './tab-manager';

export interface SessionTabData {
  readonly url: string;
  readonly title: string;
  readonly pinned: boolean;
}

export interface SessionData {
  readonly version: number;
  readonly tabs: readonly SessionTabData[];
  readonly activeTabIndex: number;
  readonly activeTabId: string | null;
  readonly savedAt: number;
}

const SESSION_VERSION = 1;

export class SessionManager {
  toJSON(tabManager: TabManager): SessionData {
    const allTabs = tabManager.getAllTabs();
    const activeTab = tabManager.getActiveTab();
    const activeIndex = activeTab
      ? allTabs.findIndex((t) => t.id === activeTab.id)
      : -1;

    return {
      version: SESSION_VERSION,
      tabs: allTabs.map(serializeTab),
      activeTabIndex: activeIndex >= 0 ? activeIndex : 0,
      activeTabId: activeTab?.id ?? null,
      savedAt: Date.now(),
    };
  }

  fromJSON(data: SessionData, tabManager: TabManager): void {
    if (data.tabs.length === 0) {
      tabManager.createTab();
      return;
    }

    const createdTabs = data.tabs.map((tabData) => {
      const tab = tabManager.createTab(tabData.url);
      tabManager.updateTabFromWebview(tab.id, {
        title: tabData.title,
      });
      if (tabData.pinned) {
        tabManager.pinTab(tab.id);
      }
      return tab;
    });

    const safeIndex = clampIndex(data.activeTabIndex, createdTabs.length);
    const targetTab = createdTabs[safeIndex];
    if (targetTab) {
      tabManager.activateTab(targetTab.id);
    }
  }
}

function serializeTab(tab: {
  readonly url: string;
  readonly title: string;
  readonly pinned: boolean;
}): SessionTabData {
  return {
    url: tab.url,
    title: tab.title,
    pinned: tab.pinned,
  };
}

function clampIndex(index: number, length: number): number {
  if (length === 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return 0;
  return index;
}
