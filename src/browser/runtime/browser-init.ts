/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FullTab, TabDomRefs, NavState, BrowserDeps, NwWindow } from './types';
import { TabManager } from '../services/tab-manager';
import { EventBus } from '../api/event-bus';
import { SecurityZones } from '../services/security-zones';
import { SecurityBannerLogic } from '../components/security-banner';
import { FindBarLogic } from '../components/find-bar';
import { BookmarkManager } from '../services/bookmarks';
import { HistoryManager } from '../services/history';
import { SettingsManager } from '../services/settings';
import { KeyboardShortcuts } from '../services/keyboard-shortcuts';
import { getNavBarState } from '../components/nav-bar';
import { getStatusBarState } from '../components/status-bar';
import { getWindowTitle } from '../components/titlebar';
import * as urlHelpers from './url-helpers';
import * as domBridge from './dom-bridge';
import { showContextMenu } from './context-menu';
import { createApiServer } from './api-server';

declare const nw: { Window: { get(): NwWindow } };
declare const require: (module: string) => any;
declare const process: {
  readonly env: Record<string, string | undefined>;
  readonly argv: string[];
  readonly version: string;
  readonly platform: string;
  readonly arch: string;
  readonly pid: number;
  uptime(): number;
  cwd(): string;
};

function getNwWindow(): NwWindow | null {
  try {
    return nw.Window.get();
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const gui = require('nw.gui');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      return gui.Window.get();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Nightmare] Could not get window handle:', (e as Error).message);
      return null;
    }
  }
}

function resolveSrcDir(): string {
  const path = require('path') as {
    resolve(...p: string[]): string;
    join(...p: string[]): string;
    dirname(p: string): string;
  };
  const fs = require('fs') as { existsSync(p: string): boolean };

  let srcDir: string = process.cwd();
  if (!srcDir.endsWith('/src') && !srcDir.endsWith('\\src')) {
    for (const a of process.argv) {
      if (a === 'src/' || a === 'src') {
        srcDir = path.resolve(a);
      }
    }
  }
  if (!fs.existsSync(path.join(srcDir, 'browser', 'index.html'))) {
    srcDir = path.resolve('src');
  }
  return srcDir;
}

// Nightmare Browser's core feature: execute arbitrary JS in any tab via API.
// This intentionally uses eval() in the frame's content window context because
// eval returns the last expression value, which is essential for the AI agent
// control API (POST /api/tabs/:id/execute).
function executeInFrame(
  frame: HTMLIFrameElement,
  code: string,
  cb?: (err: Error | null, result: unknown) => void,
): unknown {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const result = (frame.contentWindow as any).eval(code);
    if (cb) cb(null, result);
     
    return result;
  } catch (e) {
    if (cb) cb(e as Error, undefined);
    return undefined;
  }
}

export function initBrowser(): void {
  const path = require('path') as {
    join(...parts: string[]): string;
    resolve(...parts: string[]): string;
    dirname(p: string): string;
  };
  const fs = require('fs') as {
    existsSync(p: string): boolean;
    mkdirSync(p: string, opts: { recursive: boolean }): void;
  };
  const os = require('os') as { homedir(): string };

  // ---- Window handle ----
  const win = getNwWindow();
  // eslint-disable-next-line no-console
  console.log('[Nightmare] Modules loaded, win:', Boolean(win));

  // ---- State ----
  const tabManager = new TabManager();
  const eventBus = new EventBus();
  const tabDom = new Map<string, TabDomRefs>();
  const securityZones = new SecurityZones();
  const securityBanner = new SecurityBannerLogic();
  const findBarLogic = new FindBarLogic();
  let apiPort = parseInt(process.env['NIGHTMARE_API_PORT'] ?? '6660', 10);
  const navState = new Map<string, NavState>();

  // ---- Data dir ----
  const dataDir = path.join(os.homedir(), '.nightmare-browser');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // ---- Services ----
  const bookmarkManager = new BookmarkManager(dataDir);
  const historyManager = new HistoryManager(dataDir, 5000);
  const settingsManager = new SettingsManager(dataDir);

  // ---- Paths ----
  const srcDir = resolveSrcDir();
  const projectDir = path.dirname(srcDir);
  const samplesDir = path.join(projectDir, 'samples');
  const pagesDir = path.join(srcDir, 'pages');
  const HOME_URL = 'nightmare://home';

  // eslint-disable-next-line no-console
  console.log('[Nightmare] srcDir:', srcDir);
  // eslint-disable-next-line no-console
  console.log('[Nightmare] samplesDir:', samplesDir);
  // eslint-disable-next-line no-console
  console.log('[Nightmare] pagesDir:', pagesDir);

  const displayUrlConfig = { apiPort, samplesDir, pagesDir };

  // ---- Helper functions ----
  function localFileUrl(filePath: string): string {
    return urlHelpers.localFileUrl(filePath, apiPort);
  }

  function proxyUrl(webUrl: string): string {
    return urlHelpers.proxyUrl(webUrl, apiPort);
  }

  function toDisplayUrl(internalUrl: string): string {
    return urlHelpers.toDisplayUrl(internalUrl, displayUrlConfig);
  }

  function resolveUrl(input?: string): string {
    return urlHelpers.resolveUrl(input, {
      apiPort,
      samplesDir,
      pagesDir,
      homeUrl: HOME_URL,
    });
  }

  function tabToJson(
    t: Partial<import('../services/tab').Tab> & { id: string },
  ): import('./types').TabJson {
    return urlHelpers.tabToJson(t, toDisplayUrl);
  }

  function getFullTab(id: string): FullTab | null {
    return domBridge.getFullTab(id, tabManager, tabDom);
  }

  function getActiveTab(): FullTab | null {
    const active = tabManager.getActiveTab();
    if (!active) return null;
    return getFullTab(active.id);
  }

  function isBookmarked(url: string): boolean {
    const display = toDisplayUrl(url);
    const all = bookmarkManager.getAll();
    return all.some((b) => b.url === url || b.url === display);
  }

  function addBookmark(url: string, title?: string): void {
    if (isBookmarked(url)) return;
    const display = toDisplayUrl(url);
    bookmarkManager.add(title ?? display, display);
    domBridge.updateBookmarkButton(deps);
    domBridge.renderBookmarks(deps);
  }

  function removeBookmark(url: string): void {
    const display = toDisplayUrl(url);
    const all = bookmarkManager.getAll();
    const match = all.find(
      (b) => b.url === url || b.url === display,
    );
    if (match) bookmarkManager.remove(match.id);
    domBridge.updateBookmarkButton(deps);
    domBridge.renderBookmarks(deps);
  }

  function recordHistory(url: string, title: string): void {
    const display = toDisplayUrl(url);
    if (!url || url === 'about:blank') return;
    historyManager.addVisit(display, title || display);
  }

  function updateAll(): void {
    domBridge.updateNavBar(deps);
    domBridge.updateNavButtons(deps);
    domBridge.updateBookmarkButton(deps);
    domBridge.updateBanner(deps);
    domBridge.updateStatusBar(deps);
    domBridge.updateWindowTitle(deps);
  }

  function createTab(url?: string, openerId?: string): FullTab {
    const resolved = resolveUrl(url ?? HOME_URL);
    const tab = tabManager.createTab(resolved, openerId);
    const id = tab.id;

    navState.set(id, {
      depth: 0,
      forwardDepth: 0,
      openerId: openerId ?? null,
      lastUrl: resolved,
      isBackForward: false,
    });

    domBridge.createTabDom(id, resolved, deps);
    activateTab(id);
    eventBus.emit({ type: 'tab:created', tab: tabToJson(tab) });
    return getFullTab(id) as FullTab;
  }

  function closeTab(id: string): void {
    if (!tabManager.hasTab(id)) return;
    const tab = tabManager.getTab(id);
    if (tab?.pinned) return;

    const wasActive =
      tabManager.getActiveTab()?.id === id;
    const isLastTab = tabManager.getTabCount() === 1;

    if (isLastTab) {
      createTab();
    }

    domBridge.closeTabDom(id, tabDom);
    navState.delete(id);
    securityBanner.reset(id);
    tabManager.closeTab(id);

    if (wasActive && !isLastTab) {
      const newActive = tabManager.getActiveTab();
      if (newActive) activateTab(newActive.id);
    }

    eventBus.emit({ type: 'tab:closed', tabId: id });
    updateAll();
  }

  function activateTab(id: string): void {
    if (!tabManager.hasTab(id)) return;
    tabManager.activateTab(id);
    domBridge.activateTabDom(id, tabDom);
    updateAll();
  }

  function navigateTab(tab: FullTab, newUrl: string): void {
    domBridge.navigateTabDom(tab, newUrl, deps);
  }

  function toggleFindBar(): void {
    domBridge.toggleFindBar(deps);
  }

  function closeFindBar(): void {
    domBridge.closeFindBar(deps);
  }

  // ---- Build the deps object ----
  const deps: BrowserDeps = {
    win,
    tabManager,
    eventBus,
    securityZones,
    securityBanner,
    findBarLogic,
    bookmarkManager,
    historyManager,
    settingsManager,
    tabDom,
    navState,
    nightmareRuntime: { getNavBarState, getStatusBarState, getWindowTitle },
    apiPort,
    srcDir,
    samplesDir,
    pagesDir,
    projectDir,
    homeUrl: HOME_URL,
    displayUrlConfig,
    getFullTab,
    toDisplayUrl,
    resolveUrl,
    localFileUrl,
    proxyUrl,
    executeInFrame,
    createTab,
    closeTab,
    activateTab,
    navigateTab,
    getActiveTab,
    updateAll,
    updateBookmarkButton: () => { domBridge.updateBookmarkButton(deps); },
    renderBookmarks: () => { domBridge.renderBookmarks(deps); },
    isBookmarked,
    addBookmark,
    removeBookmark,
    recordHistory,
    toggleFindBar,
    closeFindBar,
    showContextMenu,
    tabToJson,
  };

  // ---- Create HTTP server ----
  const { server } = createApiServer(deps);

  let isBrowserInitDone = false;
  function safeFinishInit(): void {
    if (isBrowserInitDone) return;
    isBrowserInitDone = true;
    finishInit();
  }

  function finishInit(): void {
    domBridge.renderBookmarks(deps);
    let startUrl: string | null = null;
    for (const a of process.argv) {
      if (a.startsWith('--url=')) {
        startUrl = a.replace('--url=', '');
      }
    }
    createTab(startUrl ?? HOME_URL);

    // Setup context menus
    domBridge.setupContentAreaContextMenu(deps);
    domBridge.setupTabBarContextMenu(deps);

    // Setup keyboard shortcuts
    setupKeyboardShortcuts(deps);

    // Setup nav button listeners
    setupNavButtons(deps);

    // Setup window controls
    setupWindowControls(deps);

    // Setup message listener for internal pages
    window.addEventListener('message', (e: MessageEvent) => {
      const data = e.data as Record<string, unknown> | null;
      if (data?.['type'] === 'nightmare-navigate' && data['url']) {
        const tab = getActiveTab();
        if (tab) navigateTab(tab, resolveUrl(data['url'] as string));
      }
    });

    // Clock update
    setInterval(() => {
      const clockEl = document.getElementById('nm-status-clock');
      if (clockEl) clockEl.textContent = new Date().toLocaleTimeString();
    }, 1000);

    // eslint-disable-next-line no-console
    console.log(`[Nightmare] Browser initialized on port ${String(apiPort)}`);
  }

  // ---- Server startup with EADDRINUSE fallback ----
  server.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[Nightmare] Server error:', err.message);
    if (err.code === 'EADDRINUSE' && apiPort !== 0) {
      // eslint-disable-next-line no-console
      console.warn(`[Nightmare] Port ${String(apiPort)} in use, trying dynamic port...`);
      apiPort = 0;
      (deps as { apiPort: number }).apiPort = 0;
      server.listen(0, '127.0.0.1', () => {
        apiPort = server.address().port;
        (deps as { apiPort: number }).apiPort = apiPort;
        displayUrlConfig.apiPort = apiPort;
        // eslint-disable-next-line no-console
        console.log(`[Nightmare] Server on http://127.0.0.1:${String(apiPort)} (fallback)`);
        safeFinishInit();
      });
    } else {
      safeFinishInit();
    }
  });

  server.listen(apiPort, '127.0.0.1', () => {
    apiPort = server.address().port;
    (deps as { apiPort: number }).apiPort = apiPort;
    displayUrlConfig.apiPort = apiPort;
    // eslint-disable-next-line no-console
    console.log(`[Nightmare] Server on http://127.0.0.1:${String(apiPort)}`);
    safeFinishInit();
  });

  // ---- Graceful shutdown ----
  if (win) {
    win.on('close', () => {
      try {
        server.close();
      } catch {
        // already closed
      }
      win.close(true);
    });
  }
}

function setupKeyboardShortcuts(deps: BrowserDeps): void {
  const shortcuts = new KeyboardShortcuts();
  shortcuts.register('ctrl+t', 'New Tab', () => {
    deps.createTab();
  });
  shortcuts.register('ctrl+w', 'Close Tab', () => {
    const a = deps.tabManager.getActiveTab();
    if (a) deps.closeTab(a.id);
  });
  shortcuts.register('ctrl+l', 'Focus URL Bar', () => {
    const u = document.getElementById('nm-url-input') as HTMLInputElement | null;
    if (u) {
      u.focus();
      u.select();
    }
  });
  shortcuts.register('ctrl+r', 'Reload Tab', () => {
    const t = deps.getActiveTab();
    if (t) t.frame.src = t.url;
  });
  shortcuts.register('ctrl+d', 'Bookmark Page', () => {
    document.getElementById('nm-btn-bookmark')?.click();
  });
  shortcuts.register('ctrl+f', 'Find in Page', () => {
    deps.toggleFindBar();
  });
  shortcuts.register('ctrl+h', 'History', () => {
    deps.createTab('nightmare://history');
  });
  shortcuts.register('ctrl+shift+B', 'Bookmarks Page', () => {
    deps.createTab('nightmare://bookmarks');
  });
  shortcuts.register('ctrl+,', 'Settings', () => {
    deps.createTab('nightmare://settings');
  });
  shortcuts.register('F5', 'Reload (F5)', () => {
    const t = deps.getActiveTab();
    if (t) t.frame.src = t.url;
  });
  shortcuts.register('F12', 'DevTools', () => {
    if (deps.win) deps.win.showDevTools();
  });
  shortcuts.register('Escape', 'Dismiss Overlays', () => {
    deps.closeFindBar();
    const cm = document.getElementById('nm-context-menu');
    if (cm) cm.remove();
  });

  for (let idx = 1; idx <= 9; idx++) {
    const i = idx;
    shortcuts.register(`ctrl+${String(i)}`, `Switch to Tab ${String(i)}`, () => {
      const allTabs = deps.tabManager.getAllTabs();
      const target = allTabs[i - 1];
      if (target) deps.activateTab(target.id);
    });
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    const handled = shortcuts.handleKeyEvent({
      key: e.key,
      ctrl: e.ctrlKey || e.metaKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: false,
    });
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}

function setupNavButtons(deps: BrowserDeps): void {
  document.getElementById('nm-btn-back')?.addEventListener('click', () => {
    const tab = deps.getActiveTab();
    if (!tab) return;
    const state = deps.navState.get(tab.id);
    if (!state) return;
    if (state.depth > 0) {
      state.isBackForward = true;
      state.depth--;
      state.forwardDepth++;
      try {
        tab.frame.contentWindow?.history.back();
      } catch {
        // cross-origin
      }
      domBridge.updateNavButtons(deps);
    } else if (
      state.openerId !== null &&
      deps.tabManager.hasTab(state.openerId)
    ) {
      const oid = state.openerId;
      deps.closeTab(tab.id);
      deps.activateTab(oid);
    }
  });

  document.getElementById('nm-btn-forward')?.addEventListener('click', () => {
    const tab = deps.getActiveTab();
    if (!tab) return;
    const state = deps.navState.get(tab.id);
    if (!state || state.forwardDepth <= 0) return;
    state.isBackForward = true;
    state.depth++;
    state.forwardDepth--;
    try {
      tab.frame.contentWindow?.history.forward();
    } catch {
      // cross-origin
    }
    domBridge.updateNavButtons(deps);
  });

  document.getElementById('nm-btn-reload')?.addEventListener('click', () => {
    const tab = deps.getActiveTab();
    if (tab) tab.frame.src = tab.url;
  });

  document.getElementById('nm-btn-home')?.addEventListener('click', () => {
    const tab = deps.getActiveTab();
    if (tab) deps.navigateTab(tab, deps.resolveUrl(deps.homeUrl));
  });

  const urlInput = document.getElementById('nm-url-input') as HTMLInputElement | null;
  urlInput?.addEventListener('keydown', function (this: HTMLInputElement, e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const tab = deps.getActiveTab();
      if (tab) deps.navigateTab(tab, deps.resolveUrl(this.value));
      this.blur();
    }
  });
  urlInput?.addEventListener('focus', function (this: HTMLInputElement) {
    this.select();
  });

  document.getElementById('nm-new-tab')?.addEventListener('click', () => {
    deps.createTab();
  });

  document.getElementById('nm-btn-bookmark')?.addEventListener('click', () => {
    const tab = deps.getActiveTab();
    if (!tab) return;
    if (deps.isBookmarked(tab.url)) {
      deps.removeBookmark(tab.url);
    } else {
      deps.addBookmark(tab.url, tab.title);
    }
  });
}

function setupWindowControls(deps: BrowserDeps): void {
  document.getElementById('nm-btn-minimize')?.addEventListener('click', () => {
    if (deps.win) deps.win.minimize();
  });
  document.getElementById('nm-btn-maximize')?.addEventListener('click', () => {
    if (!deps.win) return;
    try {
      if (deps.win.isMaximized === true) {
        deps.win.unmaximize();
      } else {
        deps.win.maximize();
      }
    } catch {
      deps.win.maximize();
    }
  });
  document.getElementById('nm-btn-close')?.addEventListener('click', () => {
    if (deps.win) deps.win.close();
  });
  document.getElementById('nm-btn-devtools')?.addEventListener('click', () => {
    if (deps.win) deps.win.showDevTools();
  });
}
