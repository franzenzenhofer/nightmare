import { TabManager } from './services/tab-manager';
import { EventBus } from './api/event-bus';
import { ConsoleCapture } from './api/console-capture';
import { KeyboardShortcuts } from './services/keyboard-shortcuts';
import { DownloadsManager } from './services/downloads';
import { SettingsManager } from './services/settings';
import type { Tab } from './services/tab';

interface OrchestratorConfig {
  readonly apiPort: number;
  readonly storageDir?: string;
}

interface BrowserState {
  readonly tabs: readonly Tab[];
  readonly activeTabId: string | null;
  readonly tabCount: number;
}

export class BrowserOrchestrator {
  readonly tabManager: TabManager;
  readonly eventBus: EventBus;
  readonly consoleCapture: ConsoleCapture;
  readonly downloads: DownloadsManager;
  readonly settings: SettingsManager;
  private readonly shortcuts: KeyboardShortcuts;
  private readonly apiPort: number;

  constructor(config: OrchestratorConfig) {
    this.apiPort = config.apiPort;
    this.tabManager = new TabManager();
    this.eventBus = new EventBus();
    this.consoleCapture = new ConsoleCapture();
    this.shortcuts = new KeyboardShortcuts();
    this.downloads = new DownloadsManager();
    const storageDir = config.storageDir ?? '/tmp/nightmare-test';
    this.settings = new SettingsManager(storageDir);
  }

  createTab(url?: string): Tab {
    const tab = this.tabManager.createTab(url);
    this.eventBus.emit({
      type: 'tab:created',
      tab: { id: tab.id, url: tab.url, title: tab.title, zone: tab.zone },
    });
    return tab;
  }

  closeTab(id: string): void {
    this.tabManager.closeTab(id);
    this.eventBus.emit({ type: 'tab:closed', tabId: id });
  }

  navigate(tabId: string, url: string): void {
    this.tabManager.updateTabFromWebview(tabId, { url });
    this.eventBus.emit({ type: 'tab:navigated', tabId, url });
  }

  getTab(id: string): Tab | null {
    return this.tabManager.getTab(id);
  }

  getState(): BrowserState {
    const tabs = this.tabManager.getAllTabs();
    const activeTab = this.tabManager.getActiveTab();
    return {
      tabs,
      activeTabId: activeTab?.id ?? null,
      tabCount: this.tabManager.getTabCount(),
    };
  }

  matchShortcut(key: string, modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean }): string | null {
    return this.shortcuts.match(key, modifiers);
  }

  getApiPort(): number {
    return this.apiPort;
  }
}
