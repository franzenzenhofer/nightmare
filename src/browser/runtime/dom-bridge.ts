/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TabDomRefs, FullTab, BrowserDeps, MenuItem } from './types';
import type { Tab } from '../services/tab';
import { showContextMenu } from './context-menu';
import { attachFrameListeners } from './frame-listeners';

declare const require: (module: string) => any;

const ZONE_DOT_HEX: Record<string, string> = {
  green: '#4ade80',
  blue: '#60a5fa',
  red: '#ff3333',
};

export function getFullTab(
  id: string,
  tabManager: import('../services/tab-manager').TabManager,
  tabDom: Map<string, TabDomRefs>,
): FullTab | null {
  const data = tabManager.getTab(id);
  if (!data) return null;
  const dom = tabDom.get(id);
  if (!dom) return null;
  return {
    id: data.id,
    url: data.url,
    title: data.title,
    zone: data.zone,
    favicon: data.favicon,
    loading: data.loading,
    pinned: data.pinned,
    openerId: data.openerId,
    frame: dom.frame,
    tabEl: dom.tabEl,
    titleSpan: dom.titleSpan,
    faviconEl: dom.faviconEl,
  };
}

export function createTabDom(
  id: string,
  url: string,
  deps: BrowserDeps,
): TabDomRefs {
  const frame = document.createElement('iframe');
  frame.id = `frame-${id}`;
  frame.setAttribute('nwfaketop', '');
  frame.src = url;
  document.getElementById('nm-content-area')?.appendChild(frame);

  const tabEl = document.createElement('div');
  tabEl.className = 'nm-tab nm-tab-loading';
  tabEl.dataset['tabId'] = id;

  const spinner = document.createElement('span');
  spinner.className = 'nm-tab-spinner';
  spinner.textContent = '\u25CB';
  tabEl.appendChild(spinner);

  const faviconEl = document.createElement('img');
  faviconEl.className = 'nm-tab-favicon';
  faviconEl.style.display = 'none';
  faviconEl.width = 16;
  faviconEl.height = 16;
  tabEl.appendChild(faviconEl);

  const titleSpan = document.createElement('span');
  titleSpan.className = 'nm-tab-title';
  titleSpan.textContent = 'Loading...';
  tabEl.appendChild(titleSpan);

  const closeBtn = document.createElement('span');
  closeBtn.className = 'nm-tab-close';
  closeBtn.textContent = '\u00D7';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deps.closeTab(id);
  });
  tabEl.appendChild(closeBtn);

  tabEl.addEventListener('click', () => {
    deps.activateTab(id);
  });

  const tabBar = document.getElementById('nm-tab-bar');
  const newTabBtn = document.getElementById('nm-new-tab');
  tabBar?.insertBefore(tabEl, newTabBtn);

  const refs: TabDomRefs = { frame, tabEl, titleSpan, faviconEl };
  deps.tabDom.set(id, refs);

  const fullTab = deps.getFullTab(id);
  if (fullTab) attachFrameListeners(id, frame, deps);

  return refs;
}

export function closeTabDom(id: string, tabDom: Map<string, TabDomRefs>): void {
  const dom = tabDom.get(id);
  if (dom) {
    dom.frame.remove();
    dom.tabEl.remove();
  }
  tabDom.delete(id);
}

export function activateTabDom(
  id: string,
  tabDom: Map<string, TabDomRefs>,
): void {
  tabDom.forEach((dom) => {
    dom.frame.classList.remove('active');
    dom.tabEl.classList.remove('active');
  });
  const dom = tabDom.get(id);
  if (dom) {
    dom.frame.classList.add('active');
    dom.tabEl.classList.add('active');
  }
}

export function navigateTabDom(
  tab: FullTab,
  newUrl: string,
  deps: BrowserDeps,
): void {
  const oldZone = tab.zone;
  const displayNewUrl = deps.toDisplayUrl(newUrl);
  const newZone = deps.securityZones.classify(displayNewUrl);

  deps.tabManager.updateTabFromWebview(tab.id, { url: newUrl }, displayNewUrl);

  const dom = deps.tabDom.get(tab.id);
  if (!dom) return;

  if (oldZone !== newZone) {
    const wasActive = dom.frame.classList.contains('active');
    const parent = dom.frame.parentNode;
    const oldId = dom.frame.id;
    dom.frame.remove();

    const newFrame = document.createElement('iframe');
    newFrame.id = oldId;
    newFrame.setAttribute('nwfaketop', '');
    newFrame.src = newUrl;
    if (wasActive) newFrame.classList.add('active');
    parent?.appendChild(newFrame);
    dom.frame = newFrame;

    const zoneNavState = deps.navState.get(tab.id);
    if (zoneNavState) {
      zoneNavState.depth = 0;
      zoneNavState.forwardDepth = 0;
    }

    const fullTab = deps.getFullTab(tab.id);
    if (fullTab) attachFrameListeners(tab.id, newFrame, deps);
  } else {
    dom.frame.src = newUrl;
  }

  deps.eventBus.emit({ type: 'tab:navigated', tabId: tab.id, url: newUrl });
  deps.updateAll();
}

export function updateNavBar(deps: BrowserDeps): void {
  const tab = deps.getActiveTab();
  if (!tab) return;

  const navBarTab: Tab = {
    id: tab.id,
    url: tab.url,
    title: tab.title,
    zone: tab.zone,
    canGoBack: false,
    canGoForward: false,
    loading: false,
    favicon: null,
    webviewId: '',
    openerId: undefined,
    muted: false,
    pinned: false,
    createdAt: 0,
  };
  const state = deps.nightmareRuntime.getNavBarState(navBarTab);
  const urlInput = document.getElementById(
    'nm-url-input',
  ) as HTMLInputElement | null;
  if (urlInput) urlInput.value = deps.toDisplayUrl(tab.url);

  const dotEl = document.getElementById('nm-zone-dot');
  if (dotEl) {
    const zoneColor = ZONE_DOT_HEX[state.zoneDot] ?? '#585a64';
    dotEl.style.background = zoneColor;
    dotEl.style.boxShadow = `0 0 6px ${zoneColor}`;
    if (tab.url.startsWith('https://')) {
      dotEl.textContent = '\uD83D\uDD12';
      dotEl.title = 'Secure Connection (HTTPS)';
    } else {
      dotEl.textContent = '';
      dotEl.title = tab.zone;
    }
  }

  if (tab.favicon) {
    tab.faviconEl.src = tab.favicon;
    tab.faviconEl.style.display = 'inline';
  } else {
    tab.faviconEl.style.display = 'none';
  }
}

export function updateNavButtons(deps: BrowserDeps): void {
  const tab = deps.getActiveTab();
  const backBtn = document.getElementById(
    'nm-btn-back',
  ) as HTMLButtonElement | null;
  const fwdBtn = document.getElementById(
    'nm-btn-forward',
  ) as HTMLButtonElement | null;
  if (!backBtn || !fwdBtn) return;
  if (!tab) {
    backBtn.disabled = true;
    fwdBtn.disabled = true;
    return;
  }
  const navSt = deps.navState.get(tab.id);
  if (!navSt) {
    backBtn.disabled = true;
    fwdBtn.disabled = true;
    return;
  }
  backBtn.disabled = !(
    navSt.depth > 0 ||
    (navSt.openerId !== null && deps.tabManager.hasTab(navSt.openerId))
  );
  fwdBtn.disabled = !(navSt.forwardDepth > 0);
}

export function updateBanner(deps: BrowserDeps): void {
  const tab = deps.getActiveTab();
  const banner = document.getElementById('nm-security-banner');
  if (!banner) return;
  if (!tab) {
    banner.style.display = 'none';
    return;
  }
  const config = deps.securityBanner.getBannerState(tab.id, tab.zone);
  if (!config) {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = 'flex';
  banner.className = `visible zone-${tab.zone.toLowerCase()}`;
  while (banner.firstChild) banner.removeChild(banner.firstChild);

  const iconSpan = document.createElement('span');
  iconSpan.className = 'nm-banner-icon';
  iconSpan.textContent = config.icon;
  banner.appendChild(iconSpan);

  const msgSpan = document.createElement('span');
  msgSpan.className = 'nm-banner-text';
  msgSpan.textContent = config.message;
  banner.appendChild(msgSpan);

  if (config.dismissable) {
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'nm-banner-dismiss';
    dismissBtn.textContent = '\u2715';
    dismissBtn.addEventListener('click', () => {
      deps.securityBanner.dismiss(tab.id);
      banner.style.display = 'none';
    });
    banner.appendChild(dismissBtn);
  } else {
    const permSpan = document.createElement('span');
    permSpan.className = 'nm-banner-permanent';
    permSpan.textContent = 'CANNOT BE DISMISSED';
    banner.appendChild(permSpan);
  }
}

export function updateStatusBar(deps: BrowserDeps): void {
  const tab = deps.getActiveTab();
  const state = deps.nightmareRuntime.getStatusBarState(
    deps.tabManager.getTabCount(),
    tab ? tab.zone : undefined,
  );
  const zoneEl = document.getElementById('nm-status-zone');
  const nodeEl = document.getElementById('nm-status-node');
  const tabsEl = document.getElementById('nm-status-tabs');
  const portEl = document.getElementById('nm-status-port');
  if (zoneEl) {
    zoneEl.textContent = state.zoneLabel
      ? `Zone: ${state.zoneLabel}`
      : 'Ready';
  }
  if (nodeEl) nodeEl.textContent = `Node ${process.version}`;
  if (tabsEl) {
    tabsEl.textContent = `${String(state.tabCount)} tab${state.tabCount !== 1 ? 's' : ''}`;
  }
  if (portEl) portEl.textContent = `API :${String(deps.apiPort)}`;
}

export function updateWindowTitle(deps: BrowserDeps): void {
  const tab = deps.getActiveTab();
  const title = deps.nightmareRuntime.getWindowTitle(
    (tab as Tab | null) ?? undefined,
  );
  const titleEl = document.getElementById('nm-window-title');
  if (titleEl) titleEl.textContent = title;
  document.title = title;
}

export function updateBookmarkButton(deps: BrowserDeps): void {
  const tab = deps.getActiveTab();
  const btn = document.getElementById('nm-btn-bookmark');
  if (!tab || !btn) return;
  if (deps.isBookmarked(tab.url)) {
    btn.textContent = '\u2605';
    btn.title = 'Remove bookmark';
    btn.style.color = '#fbbf24';
  } else {
    btn.textContent = '\u2606';
    btn.title = 'Bookmark this page';
    btn.style.color = '';
  }
}

interface DefaultBookmark {
  readonly title: string;
  readonly url: string;
}

const DEFAULT_BOOKMARKS: readonly DefaultBookmark[] = [
  { title: 'Home', url: 'nightmare://home' },
  { title: 'Dreamwalker', url: 'nightmare://dreamwalker' },
  { title: 'Port Hunter', url: 'nightmare://zombie-hunter' },
  { title: 'Shadow Notes', url: 'nightmare://shadow-notes' },
  { title: 'HN Archiver', url: 'nightmare://hn-shadow' },
  { title: 'File Browser', url: 'nightmare://file-browser' },
];

export function renderBookmarks(deps: BrowserDeps): void {
  const bar = document.getElementById('nm-bookmarks-bar');
  if (!bar) return;
  while (bar.firstChild) bar.removeChild(bar.firstChild);

  const barBookmarks = [
    ...DEFAULT_BOOKMARKS,
    ...deps.bookmarkManager.getBarBookmarks().slice(-10),
  ];

  for (const bm of barBookmarks) {
    const el = document.createElement('span');
    el.className = 'nm-bookmark';
    el.textContent = bm.title;
    el.title = bm.url;
    el.addEventListener('click', () => {
      const tab = deps.getActiveTab();
      if (tab) deps.navigateTab(tab, deps.resolveUrl(bm.url));
    });
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, [
        {
          label: 'Open in New Tab',
          action: (): void => {
            deps.createTab(bm.url);
          },
        },
        {
          label: 'Remove',
          action: (): void => {
            deps.removeBookmark(bm.url);
          },
        },
      ]);
    });
    bar.appendChild(el);
  }
}

export function toggleFindBar(deps: BrowserDeps): void {
  if (deps.findBarLogic.getState().isOpen) {
    closeFindBar(deps);
    return;
  }
  deps.findBarLogic.open();
  const bar = document.createElement('div');
  bar.id = 'nm-find-bar';
  bar.style.cssText =
    'position:fixed;top:80px;right:20px;background:#1a1a2e;border:1px solid #333;border-radius:6px;padding:8px 12px;z-index:9999;display:flex;gap:8px;align-items:center;box-shadow:0 4px 16px rgba(0,0,0,0.6);';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Find in page...';
  input.style.cssText =
    'width:200px;height:28px;background:#08090f;border:1px solid #333;border-radius:4px;padding:0 8px;color:#f0eeeb;font-family:inherit;font-size:13px;outline:none;';
  bar.appendChild(input);

  const countSpan = document.createElement('span');
  countSpan.style.cssText =
    'font-size:11px;color:#585a64;min-width:40px;';
  bar.appendChild(countSpan);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '\u2715';
  closeBtn.style.cssText =
    'background:none;border:none;color:#585a64;cursor:pointer;font-size:14px;padding:2px 6px;';
  closeBtn.addEventListener('click', () => {
    closeFindBar(deps);
  });
  bar.appendChild(closeBtn);

  document.body.appendChild(bar);
  input.focus();

  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  input.addEventListener('input', () => {
    if (searchTimer !== null) clearTimeout(searchTimer);
    const q = input.value;
    deps.findBarLogic.setQuery(q);
    searchTimer = setTimeout(() => {
      doFind(q, countSpan, deps);
    }, 150);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFindBar(deps);
    if (e.key === 'Enter') {
      deps.findBarLogic.nextMatch();
      doFind(input.value, countSpan, deps);
    }
  });
}

function doFind(
  query: string,
  countEl: HTMLElement,
  deps: BrowserDeps,
): void {
  clearFindHighlights(deps);
  if (!query) {
    deps.findBarLogic.setMatches(0);
    countEl.textContent = '';
    return;
  }
  const tab = deps.getActiveTab();
  if (!tab) return;
  try {
    const frameWin = tab.frame.contentWindow;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const found = (frameWin as any).find(
      query,
      false,
      false,
      true,
      false,
      false,
      false,
    );
    if (found) {
      deps.findBarLogic.setMatches(1);
      countEl.textContent = 'Found';
      countEl.style.color = '#4ade80';
    } else {
      deps.findBarLogic.setMatches(0);
      countEl.textContent = 'No match';
      countEl.style.color = '#ff4444';
    }
  } catch {
    deps.findBarLogic.setMatches(0);
    countEl.textContent = 'Error';
    countEl.style.color = '#ff4444';
  }
}

export function closeFindBar(deps: BrowserDeps): void {
  const bar = document.getElementById('nm-find-bar');
  if (bar) bar.remove();
  deps.findBarLogic.close();
  clearFindHighlights(deps);
}

function clearFindHighlights(deps: BrowserDeps): void {
  const tab = deps.getActiveTab();
  if (!tab) return;
  try {
    tab.frame.contentWindow?.getSelection()?.removeAllRanges();
  } catch {
    // cross-origin
  }
}

export function setupContentAreaContextMenu(deps: BrowserDeps): void {
  const contentArea = document.getElementById('nm-content-area');
  if (!contentArea) return;

  contentArea.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const tab = deps.getActiveTab();
    if (!tab) return;

    const navSt = deps.navState.get(tab.id);
    const canBack =
      navSt !== undefined &&
      (navSt.depth > 0 ||
        (navSt.openerId !== null &&
          deps.tabManager.hasTab(navSt.openerId)));
    const canFwd = navSt !== undefined && navSt.forwardDepth > 0;
    const displayUrl = deps.toDisplayUrl(tab.url);

    const copyToClipboard = (text: string): void => {
      try {
        const cb = (
          require('nw.gui') as {
            Clipboard: {
              get(): { set(t: string, type: string): void };
            };
          }
        ).Clipboard.get();
        cb.set(text, 'text');
      } catch {
        try {
          void navigator.clipboard.writeText(text);
        } catch {
          // no clipboard
        }
      }
    };

    const menuItems: MenuItem[] = [
      {
        label: 'Back',
        shortcut: '\u2318\u2190',
        disabled: !canBack,
        action: (): void => {
          document.getElementById('nm-btn-back')?.click();
        },
      },
      {
        label: 'Forward',
        shortcut: '\u2318\u2192',
        disabled: !canFwd,
        action: (): void => {
          document.getElementById('nm-btn-forward')?.click();
        },
      },
      {
        label: 'Reload',
        shortcut: '\u2318R',
        action: (): void => {
          tab.frame.src = tab.url;
        },
      },
      { separator: true },
      {
        label: deps.isBookmarked(tab.url)
          ? 'Remove Bookmark'
          : 'Bookmark This Page',
        shortcut: '\u2318D',
        action: (): void => {
          if (deps.isBookmarked(tab.url)) deps.removeBookmark(tab.url);
          else deps.addBookmark(tab.url, tab.title);
        },
      },
      { separator: true },
      {
        label: 'Copy URL',
        action: (): void => {
          copyToClipboard(displayUrl);
        },
      },
      {
        label: 'Copy Page Title',
        action: (): void => {
          copyToClipboard(tab.title);
        },
      },
      { separator: true },
      {
        label: 'View Page Source',
        action: (): void => {
          try {
            const html =
              tab.frame.contentDocument?.documentElement.outerHTML ?? '';
            const blob = new Blob([html], { type: 'text/plain' });
            deps.createTab(URL.createObjectURL(blob));
          } catch {
            // cross-origin
          }
        },
      },
      {
        label: 'Find in Page',
        shortcut: '\u2318F',
        action: (): void => {
          deps.toggleFindBar();
        },
      },
      { separator: true },
      {
        label: 'Open in New Tab',
        action: (): void => {
          deps.createTab(tab.url);
        },
      },
      {
        label: 'Inspect Element',
        shortcut: 'F12',
        action: (): void => {
          if (deps.win) deps.win.showDevTools();
        },
      },
    ];

    showContextMenu(e.clientX, e.clientY, menuItems);
  });
}

export function setupTabBarContextMenu(deps: BrowserDeps): void {
  const tabBar = document.getElementById('nm-tab-bar');
  if (!tabBar) return;

  tabBar.addEventListener('contextmenu', (e) => {
    const rawEl = (e.target as HTMLElement).closest('.nm-tab');
    if (!rawEl) return;
    e.preventDefault();
    const tabElHtml = rawEl as unknown as HTMLElement;
    const tabId = tabElHtml.dataset['tabId'];
    if (!tabId) return;
    const tab = deps.getFullTab(tabId);
    if (!tab) return;

    showContextMenu(e.clientX, e.clientY, [
      {
        label: 'Duplicate Tab',
        action: (): void => {
          deps.createTab(tab.url);
        },
      },
      {
        label: tab.tabEl.classList.contains('nm-tab-pinned')
          ? 'Unpin Tab'
          : 'Pin Tab',
        action: (): void => {
          tab.tabEl.classList.toggle('nm-tab-pinned');
        },
      },
      { separator: true },
      {
        label: 'Reload Tab',
        action: (): void => {
          tab.frame.src = tab.url;
        },
      },
      {
        label: 'Copy Tab URL',
        action: (): void => {
          try {
            const cb = (
              require('nw.gui') as {
                Clipboard: {
                  get(): { set(t: string, type: string): void };
                };
              }
            ).Clipboard.get();
            cb.set(deps.toDisplayUrl(tab.url), 'text');
          } catch {
            // no clipboard
          }
        },
      },
      { separator: true },
      {
        label: 'Close Tab',
        action: (): void => {
          deps.closeTab(tabId);
        },
      },
      {
        label: 'Close Other Tabs',
        action: (): void => {
          const allIds = deps.tabManager
            .getAllTabs()
            .map((t) => t.id);
          for (const tid of allIds) {
            if (tid !== tabId) deps.closeTab(tid);
          }
        },
      },
      {
        label: 'Close Tabs to the Right',
        action: (): void => {
          const allIds = deps.tabManager
            .getAllTabs()
            .map((t) => t.id);
          const startIdx = allIds.indexOf(tabId);
          for (let i = allIds.length - 1; i > startIdx; i--) {
            const closeId = allIds[i];
            if (closeId !== undefined) deps.closeTab(closeId);
          }
        },
      },
    ]);
  });
}
