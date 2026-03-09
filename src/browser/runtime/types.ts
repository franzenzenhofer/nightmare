/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Tab } from '../services/tab';
import type { SecurityZone } from '../services/security-zones';
import type { Tab as ServiceTab } from '../services/tab';
import type { NavBarState } from '../components/nav-bar';
import type { StatusBarState } from '../components/status-bar';

/** DOM references for a tab (not stored in TabManager) */
export interface TabDomRefs {
  frame: HTMLIFrameElement;
  tabEl: HTMLDivElement;
  titleSpan: HTMLSpanElement;
  faviconEl: HTMLImageElement;
}

/** Merged tab: data from TabManager + DOM refs */
export interface FullTab extends TabDomRefs {
  readonly id: string;
  url: string;
  title: string;
  zone: SecurityZone;
  favicon: string | null;
  loading: boolean;
  pinned: boolean;
  readonly openerId: string | undefined;
}

/** Navigation state per tab */
export interface NavState {
  depth: number;
  forwardDepth: number;
  openerId: string | null;
  lastUrl: string;
  isBackForward: boolean;
}

/** Context menu item */
export interface MenuItem {
  readonly label?: string;
  readonly shortcut?: string;
  readonly disabled?: boolean;
  readonly separator?: boolean;
  readonly action?: () => void;
}

/** Serialized tab for API JSON responses */
export interface TabJson {
  readonly id: string;
  readonly url: string;
  readonly displayUrl: string;
  readonly title: string;
  readonly zone: SecurityZone;
}

/** NW.js window handle (subset of API we use) */
export interface NwWindow {
  minimize(): void;
  maximize(): void;
  unmaximize(): void;
  close(force?: boolean): void;
  showDevTools(): void;
  capturePage(
    callback: (buffer: Buffer) => void,
    options: { format: string; datatype: string },
  ): void;
  resizeTo(width: number, height: number): void;
  on(event: string, handler: (...args: any[]) => void): void;
  readonly width: number;
  readonly height: number;
  readonly isMaximized?: boolean;
}

/** NW.js clipboard */
export interface NwClipboard {
  set(text: string, type: string): void;
}

/** Dependencies injected into sub-modules */
export interface BrowserDeps {
  readonly win: NwWindow | null;
  readonly tabManager: import('../services/tab-manager').TabManager;
  readonly eventBus: import('../api/event-bus').EventBus;
  readonly securityZones: import('../services/security-zones').SecurityZones;
  readonly securityBanner: import('../components/security-banner').SecurityBannerLogic;
  readonly findBarLogic: import('../components/find-bar').FindBarLogic;
  readonly bookmarkManager: import('../services/bookmarks').BookmarkManager;
  readonly historyManager: import('../services/history').HistoryManager;
  readonly settingsManager: import('../services/settings').SettingsManager;
  readonly tabDom: Map<string, TabDomRefs>;
  readonly navState: Map<string, NavState>;
  readonly nightmareRuntime: {
    getNavBarState(tab: ServiceTab | undefined): NavBarState;
    getStatusBarState(tabCount: number, activeZone: SecurityZone | undefined): StatusBarState;
    getWindowTitle(tab: ServiceTab | undefined): string;
  };
  apiPort: number;
  readonly srcDir: string;
  readonly samplesDir: string;
  readonly pagesDir: string;
  readonly projectDir: string;
  readonly homeUrl: string;
  readonly displayUrlConfig: { apiPort: number; samplesDir: string; pagesDir: string };
  getFullTab(id: string): FullTab | null;
  toDisplayUrl(internalUrl: string): string;
  resolveUrl(input: string): string;
  localFileUrl(filePath: string): string;
  proxyUrl(webUrl: string): string;
  executeInFrame(
    frame: HTMLIFrameElement,
    code: string,
    cb?: (err: Error | null, result: unknown) => void,
  ): unknown;
  createTab(url?: string, openerId?: string): FullTab;
  closeTab(id: string): void;
  activateTab(id: string): void;
  navigateTab(tab: FullTab, newUrl: string): void;
  getActiveTab(): FullTab | null;
  updateAll(): void;
  updateBookmarkButton(): void;
  renderBookmarks(): void;
  isBookmarked(url: string): boolean;
  addBookmark(url: string, title?: string): void;
  removeBookmark(url: string): void;
  recordHistory(url: string, title: string): void;
  toggleFindBar(): void;
  closeFindBar(): void;
  showContextMenu(x: number, y: number, items: MenuItem[]): void;
  tabToJson(t: Partial<Tab> & { id: string }): TabJson;
}
