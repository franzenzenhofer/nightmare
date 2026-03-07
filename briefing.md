# NIGHTMARE BROWSER — Complete Architecture v2

## The Vision

Nightmare is not an app shell. **It's a full web browser** — tabs, URL bar, bookmarks, history, back/forward — built on NW.js. The twist: it has full Node.js integration, zero CORS, and unrestricted JS execution. It's Chrome without the safety rails, designed for internal tools and local development.

**Three security zones with visual feedback:**

| Zone | What | Warning | Node.js | CORS |
|------|-------|---------|---------|------|
| **Local Files** (`file://`) | HTML on disk | Green info bar (dismissable) | Full access | None |
| **Localhost** (`localhost:*`, `127.0.0.1`) | Dev servers | Blue info bar (dismissable) | Full access | None |
| **Open Web** (`https://*`) | Any website | **Red warning bar (NOT dismissable)** | Disabled | Disabled |

The open web warning is permanent and non-closable — you're using a browser with no security, and you need to always know it.

---

## 1. Architecture — It's a Browser

### The Core Insight

NW.js provides the `<webview>` tag — a Chromium-based embedded browser that runs in a separate process. Each tab in Nightmare is a `<webview>`. The shell (titlebar, tab bar, URL bar, bookmarks bar, sidebar, status bar) is normal HTML/CSS/JS with full Node.js access. The webviews render the actual web content.

```
┌─────────────────────────────────────────────────────────────┐
│ ☠ NIGHTMARE                              [_] [□] [✕]       │  ← Custom titlebar (drag region)
├─────────────────────────────────────────────────────────────┤
│ [Tab 1: My App] [Tab 2: localhost:3000] [Tab 3: google] [+]│  ← Tab bar
├─────────────────────────────────────────────────────────────┤
│ [←] [→] [⟳] [🏠]  [ https://localhost:3000/dashboard    ] │  ← Navigation bar
├─────────────────────────────────────────────────────────────┤
│ ★ My Tools  |  ★ Dashboard  |  ★ API Docs  |  + Add       │  ← Bookmarks bar (toggleable)
├─────────────────────────────────────────────────────────────┤
│ ℹ️ LOCALHOST — Node.js enabled, no CORS restrictions  [✕]  │  ← Zone info (blue, dismissable)
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    <webview> content                         │  ← Actual page (per-tab webview)
│                                                             │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ⚡ Ready │ Node v25 │ Zone: LOCAL │ 3 tabs │ 12:34         │  ← Status bar
└─────────────────────────────────────────────────────────────┘
```

For **open web** pages, the warning bar looks different and **cannot be closed:**

```
├─────────────────────────────────────────────────────────────┤
│ ⚠️ OPEN WEB — You are browsing with ALL security disabled. │  ← Red bar, NO close button
│    Passwords, cookies, and data are NOT protected.          │
├─────────────────────────────────────────────────────────────┤
```

---

## 2. Project Structure

```
nightmare-browser/
├── package.json                    # NW.js manifest + npm config
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
│
├── src/
│   ├── browser/                    # THE BROWSER SHELL
│   │   ├── index.html              # Main browser window
│   │   ├── browser.ts              # Browser controller — orchestrates everything
│   │   │
│   │   ├── components/
│   │   │   ├── titlebar.ts         # Custom window chrome (drag, min, max, close)
│   │   │   ├── tab-bar.ts          # Tab management (create, close, switch, drag-reorder)
│   │   │   ├── tab.ts              # Single tab model (url, title, icon, loading state, history)
│   │   │   ├── nav-bar.ts          # URL bar + back/forward/reload/home buttons
│   │   │   ├── url-input.ts        # Smart URL input (autocomplete, search fallback)
│   │   │   ├── bookmarks-bar.ts    # Bookmarks strip below nav bar
│   │   │   ├── security-banner.ts  # Zone warning/info banner
│   │   │   ├── sidebar.ts          # Bookmarks manager, history, downloads (slide-in panel)
│   │   │   ├── status-bar.ts       # Bottom bar (zone, node version, tab count, clock)
│   │   │   ├── context-menu.ts     # Right-click menus (page, link, image, tab)
│   │   │   ├── find-bar.ts         # Ctrl+F in-page search
│   │   │   └── devtools-button.ts  # Quick F12 / devtools toggle
│   │   │
│   │   ├── services/
│   │   │   ├── tab-manager.ts      # Tab lifecycle, state, switching
│   │   │   ├── navigation.ts       # URL resolution, history stack per tab
│   │   │   ├── bookmarks.ts        # CRUD bookmarks, folders, import/export
│   │   │   ├── history.ts          # Browsing history with search
│   │   │   ├── security-zones.ts   # Classify URLs into LOCAL / LOCALHOST / WEB
│   │   │   ├── downloads.ts        # Download manager
│   │   │   ├── settings.ts         # Persistent settings (home page, theme, etc.)
│   │   │   ├── node-bridge.ts      # Inject nightmare API into local/localhost webviews
│   │   │   └── storage.ts          # Persistent JSON storage (bookmarks, history, settings)
│   │   │
│   │   └── __tests__/
│   │       ├── tab-manager.test.ts
│   │       ├── navigation.test.ts
│   │       ├── bookmarks.test.ts
│   │       ├── history.test.ts
│   │       ├── security-zones.test.ts
│   │       ├── url-input.test.ts
│   │       ├── security-banner.test.ts
│   │       └── tab.test.ts
│   │
│   ├── styles/
│   │   ├── nightmare.css           # Full browser theme
│   │   ├── tokens.css              # Design tokens
│   │   ├── tab-bar.css             # Tab styling
│   │   ├── nav-bar.css             # Navigation bar styling
│   │   ├── security-banner.css     # Zone banner styles (red/blue/green)
│   │   └── sidebar.css             # Side panel styles
│   │
│   ├── pages/
│   │   ├── newtab.html             # New Tab page (speed dial, recent, bookmarks)
│   │   ├── settings.html           # nightmare://settings
│   │   ├── history.html            # nightmare://history
│   │   ├── bookmarks.html          # nightmare://bookmarks
│   │   └── about.html              # nightmare://about — version, credits
│   │
│   ├── assets/
│   │   ├── icons/                  # App icons (all sizes + .ico + .icns)
│   │   ├── tray/                   # System tray icons (idle/active/error)
│   │   ├── zone-icons/             # Lock icons for security zones
│   │   └── ui/                     # UI icons (back, forward, reload, star, etc.)
│   │
│   └── background.js               # Persistent background script (tray, shortcuts)
│
├── e2e/
│   ├── tabs.spec.ts                # Create, close, switch, duplicate tabs
│   ├── navigation.spec.ts          # Back, forward, reload, URL bar
│   ├── bookmarks.spec.ts           # Add, remove, organize bookmarks
│   ├── security-zones.spec.ts      # Banner behavior per zone
│   ├── node-integration.spec.ts    # require() works in local/localhost tabs
│   ├── no-cors.spec.ts             # Cross-origin requests succeed
│   └── fixtures/
│       ├── local-app/              # Test app loaded via file://
│       └── server-app/             # Test app served via localhost
│
├── scripts/
│   ├── build.ts                    # Package for distribution
│   └── dev.ts                      # Dev mode with watch
│
└── dist/
```

---

## 3. Core Data Models & Services

### Tab Model

```typescript
// src/browser/components/tab.ts
export interface Tab {
  id: string;                    // UUID
  url: string;                   // Current URL
  title: string;                 // Page title (from <title> or URL)
  favicon: string | null;        // Favicon URL or data URI
  loading: boolean;              // Is the page still loading?
  canGoBack: boolean;            // Has history to go back?
  canGoForward: boolean;         // Has history to go forward?
  zone: SecurityZone;            // LOCAL | LOCALHOST | WEB
  webviewId: string;             // DOM id of the <webview> element
  muted: boolean;                // Audio muted?
  pinned: boolean;               // Pinned tab?
  createdAt: number;             // Timestamp
}

export type SecurityZone = 'LOCAL' | 'LOCALHOST' | 'WEB';
```

### Security Zones — The Heart of the Warning System

```typescript
// src/browser/services/security-zones.ts
export class SecurityZones {

  classify(url: string): SecurityZone {
    try {
      const parsed = new URL(url);

      // file:// protocol → local files
      if (parsed.protocol === 'file:') return 'LOCAL';

      // nightmare:// internal pages → local
      if (parsed.protocol === 'nightmare:') return 'LOCAL';

      // localhost, 127.0.0.1, [::1], *.localhost
      if (this.isLocalhost(parsed.hostname)) return 'LOCALHOST';

      // Everything else → open web
      return 'WEB';
    } catch {
      // Bare paths, malformed URLs → treat as local
      return 'LOCAL';
    }
  }

  private isLocalhost(hostname: string): boolean {
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost') ||
      /^192\.168\.\d+\.\d+$/.test(hostname) ||
      /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname)
    );
  }

  getBanner(zone: SecurityZone): BannerConfig {
    switch (zone) {
      case 'LOCAL':
        return {
          type: 'info',
          color: 'green',
          icon: '🟢',
          message: 'LOCAL FILE — Full Node.js access, no restrictions.',
          dismissable: true,
        };
      case 'LOCALHOST':
        return {
          type: 'info',
          color: 'blue',
          icon: 'ℹ️',
          message: 'LOCALHOST — Node.js enabled, no CORS restrictions.',
          dismissable: true,
        };
      case 'WEB':
        return {
          type: 'warning',
          color: 'red',
          icon: '⚠️',
          message: 'OPEN WEB — You are browsing with ALL security disabled. Passwords, cookies, and data are NOT protected. Do not log into sensitive accounts.',
          dismissable: false,  // ← CANNOT BE CLOSED
        };
    }
  }

  shouldEnableNode(zone: SecurityZone): boolean {
    return zone === 'LOCAL' || zone === 'LOCALHOST';
  }
}

export interface BannerConfig {
  type: 'info' | 'warning';
  color: 'green' | 'blue' | 'red';
  icon: string;
  message: string;
  dismissable: boolean;
}
```

### Tab Manager

```typescript
// src/browser/services/tab-manager.ts
export class TabManager {
  private tabs: Map<string, Tab> = new Map();
  private activeTabId: string | null = null;
  private securityZones = new SecurityZones();

  createTab(url: string = 'nightmare://newtab'): Tab {
    const id = crypto.randomUUID();
    const zone = this.securityZones.classify(url);
    const tab: Tab = {
      id,
      url,
      title: 'New Tab',
      favicon: null,
      loading: true,
      canGoBack: false,
      canGoForward: false,
      zone,
      webviewId: `webview-${id}`,
      muted: false,
      pinned: false,
      createdAt: Date.now(),
    };
    this.tabs.set(id, tab);
    this.activateTab(id);
    return tab;
  }

  closeTab(id: string): void {
    if (this.tabs.get(id)?.pinned) return; // Can't close pinned tabs
    this.tabs.delete(id);
    // Activate adjacent tab
    if (this.activeTabId === id) {
      const remaining = [...this.tabs.keys()];
      this.activeTabId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
      if (!this.activeTabId) this.createTab(); // Always at least one tab
    }
  }

  activateTab(id: string): void {
    if (this.tabs.has(id)) this.activeTabId = id;
  }

  duplicateTab(id: string): Tab | null {
    const source = this.tabs.get(id);
    if (!source) return null;
    return this.createTab(source.url);
  }

  pinTab(id: string): void {
    const tab = this.tabs.get(id);
    if (tab) tab.pinned = !tab.pinned;
  }

  updateTabFromWebview(id: string, updates: Partial<Tab>): void {
    const tab = this.tabs.get(id);
    if (!tab) return;
    Object.assign(tab, updates);
    // Reclassify zone on URL change
    if (updates.url) {
      tab.zone = this.securityZones.classify(updates.url);
    }
  }

  getActiveTab(): Tab | null {
    return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null;
  }

  getAllTabs(): Tab[] {
    return [...this.tabs.values()];
  }

  getTabCount(): number {
    return this.tabs.size;
  }
}
```

### Bookmarks

```typescript
// src/browser/services/bookmarks.ts
export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon: string | null;
  folderId: string | null;   // null = bookmarks bar root
  createdAt: number;
  position: number;          // Sort order within folder
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId: string | null;   // null = root level
  position: number;
}

export class BookmarkManager {
  private storageFile: string;

  constructor(storageDir: string) {
    const path = require('path');
    this.storageFile = path.join(storageDir, 'bookmarks.json');
  }

  add(title: string, url: string, folderId: string | null = null): Bookmark {
    const bookmarks = this.load();
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      title,
      url,
      favicon: null,
      folderId,
      createdAt: Date.now(),
      position: bookmarks.filter(b => b.folderId === folderId).length,
    };
    bookmarks.push(bookmark);
    this.save(bookmarks);
    return bookmark;
  }

  remove(id: string): void { /* ... */ }
  move(id: string, folderId: string | null, position: number): void { /* ... */ }
  getBarBookmarks(): Bookmark[] { /* return root-level bookmarks */ }
  search(query: string): Bookmark[] { /* full-text search */ }
  exportHTML(): string { /* Netscape bookmark format for compatibility */ }
  importHTML(html: string): void { /* Parse Netscape bookmark format */ }

  private load(): Bookmark[] { /* read from JSON file */ }
  private save(bookmarks: Bookmark[]): void { /* write to JSON file */ }
}
```

### History

```typescript
// src/browser/services/history.ts
export interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: number;
  visitCount: number;
}

export class HistoryManager {
  private storageFile: string;
  private maxEntries = 10000;

  addVisit(url: string, title: string): void { /* upsert with visit count */ }
  search(query: string): HistoryEntry[] { /* search URL and title */ }
  getRecent(limit: number): HistoryEntry[] { /* most recent visits */ }
  getMostVisited(limit: number): HistoryEntry[] { /* for new tab page */ }
  clearAll(): void { /* wipe history */ }
  clearRange(from: number, to: number): void { /* clear time range */ }
}
```

---

## 4. Webview Integration — How Tabs Actually Work

Each tab gets a `<webview>` element dynamically created in the DOM:

```typescript
// src/browser/browser.ts (simplified)
export class NightmareBrowser {
  private tabManager = new TabManager();
  private securityZones = new SecurityZones();
  private bookmarks: BookmarkManager;
  private history: HistoryManager;

  private contentArea: HTMLElement;

  createWebviewForTab(tab: Tab): HTMLWebViewElement {
    const webview = document.createElement('webview') as any;
    webview.id = tab.webviewId;
    webview.src = tab.url;
    webview.classList.add('nm-webview');

    // Enable Node.js for local/localhost zones
    if (this.securityZones.shouldEnableNode(tab.zone)) {
      webview.setAttribute('allownw', '');  // NW.js Node integration
    }

    // Wire up navigation events
    webview.addEventListener('loadcommit', (e: any) => {
      if (e.isTopLevel) {
        this.tabManager.updateTabFromWebview(tab.id, {
          url: e.url,
          loading: true,
        });
        this.updateNavBar();
        this.updateSecurityBanner();
      }
    });

    webview.addEventListener('contentload', () => {
      this.tabManager.updateTabFromWebview(tab.id, { loading: false });
      this.updateTabBar();
    });

    webview.addEventListener('loadstop', () => {
      // Get title and favicon from the loaded page
      webview.executeScript(
        { code: 'document.title' },
        (results: string[]) => {
          this.tabManager.updateTabFromWebview(tab.id, {
            title: results[0] || tab.url,
            loading: false,
            canGoBack: webview.canGoBack(),
            canGoForward: webview.canGoForward(),
          });
          this.updateTabBar();
          this.updateNavBar();
          this.history.addVisit(tab.url, results[0] || tab.url);
        }
      );
    });

    // Handle new window requests (target="_blank", window.open)
    webview.addEventListener('newwindow', (e: any) => {
      e.preventDefault();
      this.openInNewTab(e.targetUrl);
    });

    this.contentArea.appendChild(webview);
    return webview;
  }

  // Navigation controls
  goBack(): void {
    const webview = this.getActiveWebview();
    if (webview?.canGoBack()) webview.back();
  }

  goForward(): void {
    const webview = this.getActiveWebview();
    if (webview?.canGoForward()) webview.forward();
  }

  reload(): void {
    this.getActiveWebview()?.reload();
  }

  navigateTo(url: string): void {
    const resolved = this.resolveUrl(url);
    const webview = this.getActiveWebview();
    if (webview) {
      webview.src = resolved;
    }
  }

  // Smart URL resolution
  private resolveUrl(input: string): string {
    // nightmare:// internal pages
    if (input.startsWith('nightmare://')) {
      return `file://${__dirname}/../pages/${input.replace('nightmare://', '')}.html`;
    }
    // Already a URL
    if (/^https?:\/\//.test(input) || input.startsWith('file://')) {
      return input;
    }
    // localhost shorthand: "3000" → "http://localhost:3000"
    if (/^\d{2,5}$/.test(input)) {
      return `http://localhost:${input}`;
    }
    // Has dots but no protocol → add https
    if (input.includes('.') && !input.includes(' ')) {
      return `https://${input}`;
    }
    // Bare path → local file
    if (input.startsWith('/') || input.startsWith('./') || input.startsWith('~')) {
      const path = require('path');
      return `file://${path.resolve(input)}`;
    }
    // Fallback: search engine
    return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
  }
}
```

---

## 5. Security Banner Component

```typescript
// src/browser/components/security-banner.ts
export class SecurityBanner {
  private container: HTMLElement;
  private dismissed: Set<string> = new Set(); // Track dismissed banners per tab

  constructor(container: HTMLElement) {
    this.container = container;
  }

  show(tabId: string, config: BannerConfig): void {
    // WEB banners can NEVER be dismissed
    if (config.dismissable && this.dismissed.has(tabId)) {
      this.container.style.display = 'none';
      return;
    }

    this.container.style.display = 'flex';
    this.container.className = `nm-security-banner nm-zone-${config.color}`;
    this.container.innerHTML = `
      <span class="nm-banner-icon">${config.icon}</span>
      <span class="nm-banner-text">${config.message}</span>
      ${config.dismissable
        ? `<button class="nm-banner-dismiss" data-tab="${tabId}">✕</button>`
        : `<span class="nm-banner-permanent">⛔ This warning cannot be dismissed</span>`
      }
    `;

    // Wire dismiss button for LOCAL/LOCALHOST only
    const dismissBtn = this.container.querySelector('.nm-banner-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.dismissed.add(tabId);
        this.container.style.display = 'none';
      });
    }
  }
}
```

### Banner CSS

```css
/* src/styles/security-banner.css */

.nm-security-banner {
  display: flex;
  align-items: center;
  gap: var(--nm-space-2);
  padding: var(--nm-space-1) var(--nm-space-4);
  font-family: var(--nm-font-mono);
  font-size: var(--nm-text-xs);
  font-weight: 600;
  letter-spacing: 0.02em;
  user-select: none;
  min-height: 28px;
}

/* Green — Local files */
.nm-zone-green {
  background: #0d2818;
  color: #4ade80;
  border-bottom: 1px solid #166534;
}

/* Blue — Localhost */
.nm-zone-blue {
  background: #0c1929;
  color: #60a5fa;
  border-bottom: 1px solid #1e3a5f;
}

/* Red — Open Web (DANGER) */
.nm-zone-red {
  background: #2a0a0a;
  color: #fca5a5;
  border-bottom: 2px solid #991b1b;
  /* Subtle pulsing glow to keep attention */
  animation: nm-danger-pulse 4s ease-in-out infinite;
}

@keyframes nm-danger-pulse {
  0%, 100% { background: #2a0a0a; }
  50% { background: #3b0f0f; }
}

.nm-banner-dismiss {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;
  padding: 2px 6px;
  border-radius: 3px;
}

.nm-banner-dismiss:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

.nm-banner-permanent {
  margin-left: auto;
  opacity: 0.5;
  font-size: var(--nm-text-xs);
  font-style: italic;
}
```

---

## 6. TDD — Tests for Every Core Service

### Security Zones (most critical to get right)

```typescript
// src/browser/__tests__/security-zones.test.ts
import { describe, it, expect } from 'vitest';
import { SecurityZones } from '../services/security-zones';

const zones = new SecurityZones();

describe('SecurityZones.classify', () => {
  // LOCAL zone
  it('file:// → LOCAL', () => {
    expect(zones.classify('file:///home/user/app/index.html')).toBe('LOCAL');
  });
  it('file:// Windows path → LOCAL', () => {
    expect(zones.classify('file:///C:/Users/app/index.html')).toBe('LOCAL');
  });
  it('nightmare:// internal → LOCAL', () => {
    expect(zones.classify('nightmare://newtab')).toBe('LOCAL');
    expect(zones.classify('nightmare://settings')).toBe('LOCAL');
  });

  // LOCALHOST zone
  it('localhost → LOCALHOST', () => {
    expect(zones.classify('http://localhost:3000')).toBe('LOCALHOST');
  });
  it('127.0.0.1 → LOCALHOST', () => {
    expect(zones.classify('http://127.0.0.1:8080/api')).toBe('LOCALHOST');
  });
  it('0.0.0.0 → LOCALHOST', () => {
    expect(zones.classify('http://0.0.0.0:5000')).toBe('LOCALHOST');
  });
  it('192.168.x.x → LOCALHOST', () => {
    expect(zones.classify('http://192.168.1.100:8080')).toBe('LOCALHOST');
  });
  it('10.x.x.x → LOCALHOST', () => {
    expect(zones.classify('http://10.0.0.5:3000')).toBe('LOCALHOST');
  });
  it('subdomain.localhost → LOCALHOST', () => {
    expect(zones.classify('http://myapp.localhost:3000')).toBe('LOCALHOST');
  });
  it('[::1] → LOCALHOST', () => {
    expect(zones.classify('http://[::1]:3000')).toBe('LOCALHOST');
  });

  // WEB zone
  it('https://google.com → WEB', () => {
    expect(zones.classify('https://google.com')).toBe('WEB');
  });
  it('http://example.com → WEB', () => {
    expect(zones.classify('http://example.com')).toBe('WEB');
  });
  it('https://192.169.0.1 (non-private IP) → WEB', () => {
    expect(zones.classify('https://192.169.0.1')).toBe('WEB');
  });

  // Edge cases
  it('malformed URL → LOCAL (safe fallback)', () => {
    expect(zones.classify('not-a-url')).toBe('LOCAL');
  });
  it('bare path → LOCAL', () => {
    expect(zones.classify('/home/user/app.html')).toBe('LOCAL');
  });
});

describe('SecurityZones.getBanner', () => {
  it('LOCAL banner is dismissable', () => {
    expect(zones.getBanner('LOCAL').dismissable).toBe(true);
  });
  it('LOCALHOST banner is dismissable', () => {
    expect(zones.getBanner('LOCALHOST').dismissable).toBe(true);
  });
  it('WEB banner is NOT dismissable', () => {
    expect(zones.getBanner('WEB').dismissable).toBe(false);
  });
  it('WEB banner has warning type', () => {
    expect(zones.getBanner('WEB').type).toBe('warning');
  });
  it('WEB banner is red', () => {
    expect(zones.getBanner('WEB').color).toBe('red');
  });
});

describe('SecurityZones.shouldEnableNode', () => {
  it('enables Node for LOCAL', () => {
    expect(zones.shouldEnableNode('LOCAL')).toBe(true);
  });
  it('enables Node for LOCALHOST', () => {
    expect(zones.shouldEnableNode('LOCALHOST')).toBe(true);
  });
  it('disables Node for WEB', () => {
    expect(zones.shouldEnableNode('WEB')).toBe(false);
  });
});
```

### Tab Manager Tests

```typescript
// src/browser/__tests__/tab-manager.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TabManager } from '../services/tab-manager';

let tm: TabManager;
beforeEach(() => { tm = new TabManager(); });

describe('TabManager', () => {
  it('creates a tab with correct defaults', () => {
    const tab = tm.createTab('file:///app/index.html');
    expect(tab.title).toBe('New Tab');
    expect(tab.loading).toBe(true);
    expect(tab.zone).toBe('LOCAL');
    expect(tab.pinned).toBe(false);
  });

  it('always has at least one tab', () => {
    const tab = tm.createTab();
    tm.closeTab(tab.id);
    expect(tm.getTabCount()).toBe(1); // auto-created new tab
  });

  it('cannot close pinned tabs', () => {
    const tab = tm.createTab();
    tm.pinTab(tab.id);
    tm.closeTab(tab.id);
    expect(tm.getTabCount()).toBe(1);
    expect(tm.getActiveTab()?.id).toBe(tab.id);
  });

  it('reclassifies zone when URL changes', () => {
    const tab = tm.createTab('file:///local.html');
    expect(tab.zone).toBe('LOCAL');
    tm.updateTabFromWebview(tab.id, { url: 'https://google.com' });
    expect(tm.getAllTabs()[0].zone).toBe('WEB');
  });

  it('activates adjacent tab when active tab is closed', () => {
    const tab1 = tm.createTab('file:///a.html');
    const tab2 = tm.createTab('file:///b.html');
    tm.activateTab(tab2.id);
    tm.closeTab(tab2.id);
    expect(tm.getActiveTab()?.id).toBe(tab1.id);
  });

  it('duplicates a tab', () => {
    const tab = tm.createTab('http://localhost:3000');
    const dupe = tm.duplicateTab(tab.id);
    expect(dupe).not.toBeNull();
    expect(dupe!.url).toBe('http://localhost:3000');
    expect(dupe!.id).not.toBe(tab.id);
    expect(tm.getTabCount()).toBe(2);
  });
});
```

### URL Resolution Tests

```typescript
// src/browser/__tests__/navigation.test.ts
import { describe, it, expect } from 'vitest';
import { resolveUrl } from '../services/navigation';

describe('URL resolution', () => {
  it('"3000" → http://localhost:3000', () => {
    expect(resolveUrl('3000')).toBe('http://localhost:3000');
  });
  it('"8080" → http://localhost:8080', () => {
    expect(resolveUrl('8080')).toBe('http://localhost:8080');
  });
  it('"google.com" → https://google.com', () => {
    expect(resolveUrl('google.com')).toBe('https://google.com');
  });
  it('"how to cook pasta" → google search', () => {
    expect(resolveUrl('how to cook pasta')).toContain('google.com/search?q=');
  });
  it('keeps https:// URLs as-is', () => {
    expect(resolveUrl('https://example.com')).toBe('https://example.com');
  });
  it('keeps file:// URLs as-is', () => {
    expect(resolveUrl('file:///app/index.html')).toBe('file:///app/index.html');
  });
  it('"nightmare://newtab" → internal page', () => {
    expect(resolveUrl('nightmare://newtab')).toContain('newtab.html');
  });
  it('"./app/index.html" → file:// with resolved path', () => {
    expect(resolveUrl('./app/index.html')).toMatch(/^file:\/\//);
  });
});
```

### Bookmarks Tests

```typescript
// src/browser/__tests__/bookmarks.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { BookmarkManager } from '../services/bookmarks';

let bm: BookmarkManager;
beforeEach(() => { bm = new BookmarkManager('/tmp/test-nightmare'); });

describe('BookmarkManager', () => {
  it('adds a bookmark', () => {
    const b = bm.add('Google', 'https://google.com');
    expect(b.title).toBe('Google');
    expect(b.url).toBe('https://google.com');
    expect(b.folderId).toBeNull();
  });

  it('returns bar bookmarks (root level)', () => {
    bm.add('A', 'https://a.com');
    bm.add('B', 'https://b.com');
    expect(bm.getBarBookmarks()).toHaveLength(2);
  });

  it('searches bookmarks by title', () => {
    bm.add('Nightmare Docs', 'file:///docs');
    bm.add('Google', 'https://google.com');
    expect(bm.search('night')).toHaveLength(1);
    expect(bm.search('night')[0].title).toBe('Nightmare Docs');
  });

  it('removes a bookmark', () => {
    const b = bm.add('Temp', 'https://temp.com');
    bm.remove(b.id);
    expect(bm.getBarBookmarks()).toHaveLength(0);
  });
});
```

---

## 7. Browser Features Checklist

### Navigation
- [x] URL bar with smart resolution (port → localhost, domain → https, text → search)
- [x] Back / Forward / Reload / Home buttons
- [x] Keyboard shortcuts: Alt+Left (back), Alt+Right (forward), F5 (reload), Ctrl+L (focus URL bar)
- [x] URL autocomplete from history + bookmarks
- [x] Loading spinner in tab + URL bar

### Tabs
- [x] Create / close / switch / duplicate / pin tabs
- [x] Drag to reorder tabs
- [x] Middle-click link → open in new tab
- [x] Ctrl+T (new tab), Ctrl+W (close tab), Ctrl+Tab (next tab), Ctrl+Shift+Tab (prev tab)
- [x] Tab context menu: Duplicate, Pin, Mute, Close, Close Others, Close Tabs to Right
- [x] Tab shows favicon, title, loading spinner, close button
- [x] Pinned tabs show only favicon (compact)

### Bookmarks
- [x] Bookmarks bar below navigation
- [x] Star icon in URL bar to quick-add current page
- [x] Bookmark manager (sidebar panel or nightmare://bookmarks)
- [x] Folders
- [x] Import/export (Netscape HTML format — compatible with Chrome/Firefox)
- [x] Ctrl+D (bookmark current page)

### History
- [x] Full browsing history with timestamps
- [x] Search history
- [x] Clear history (all or time range)
- [x] nightmare://history page

### Security Zones
- [x] Auto-classify every URL into LOCAL / LOCALHOST / WEB
- [x] **Green info bar** for local files (dismissable per tab)
- [x] **Blue info bar** for localhost (dismissable per tab)
- [x] **Red warning bar** for open web (**NOT dismissable, ever**)
- [x] Zone indicator in status bar
- [x] Node.js only enabled for LOCAL + LOCALHOST zones

### Developer Features
- [x] F12 → DevTools for active tab
- [x] Ctrl+Shift+I → DevTools
- [x] View source (Ctrl+U)
- [x] Ctrl+F → Find in page
- [x] Console access to `nightmare` API in local/localhost tabs

### Other Browser Features
- [x] Downloads manager
- [x] Ctrl+P → Print
- [x] Ctrl+Plus/Minus → Zoom
- [x] Fullscreen (F11)
- [x] Context menu (right-click): Back, Forward, Reload, View Source, Inspect, Save As
- [x] Link context menu: Open in New Tab, Copy Link, Bookmark Link
- [x] Image context menu: Save Image, Copy Image, Open in New Tab
- [x] System tray with minimize-to-tray

### Internal Pages
- [x] `nightmare://newtab` — Speed dial with most visited + recent bookmarks
- [x] `nightmare://settings` — Home page, theme, default search engine, downloads path
- [x] `nightmare://history` — Searchable history
- [x] `nightmare://bookmarks` — Bookmark manager
- [x] `nightmare://about` — Version info, credits, Node.js version

---

## 8. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+1-9` | Switch to tab N |
| `Ctrl+L` / `F6` | Focus URL bar |
| `Ctrl+D` | Bookmark current page |
| `Ctrl+B` | Toggle bookmarks bar |
| `Ctrl+H` | Open history |
| `Ctrl+J` | Open downloads |
| `Ctrl+F` | Find in page |
| `Ctrl+P` | Print |
| `Ctrl+U` | View source |
| `Ctrl++` / `Ctrl+-` | Zoom in/out |
| `Ctrl+0` | Reset zoom |
| `F5` / `Ctrl+R` | Reload |
| `Ctrl+Shift+R` | Hard reload |
| `F11` | Fullscreen |
| `F12` / `Ctrl+Shift+I` | DevTools |
| `Alt+Left` | Back |
| `Alt+Right` | Forward |
| `Alt+Home` | Home page |
| `Ctrl+Shift+Del` | Clear browsing data |

---

## 9. Theme & Icon Design

### Design Direction: "Corrupted Terminal"

Not horror-movie Halloween. Think: a classified government terminal that's been jailbroken. Military-grade UI that someone hacked open. Clean, precise, with a sense of danger just below the surface.

### Design Tokens (updated for full browser)

```css
:root {
  /* ═══ Backgrounds ═══ */
  --nm-bg-primary:      #08080d;
  --nm-bg-secondary:    #0f1118;
  --nm-bg-tertiary:     #161822;
  --nm-bg-hover:        #1c1f2e;
  --nm-bg-active:       #242838;
  --nm-bg-input:        #0c0e16;

  /* ═══ Tab Bar ═══ */
  --nm-tab-bg:          #0c0e16;
  --nm-tab-active-bg:   #161822;
  --nm-tab-hover-bg:    #12141e;
  --nm-tab-border:      #1e2030;

  /* ═══ Accent ═══ */
  --nm-accent:          #e63946;
  --nm-accent-dim:      #8b1a22;
  --nm-accent-glow:     rgba(230, 57, 70, 0.12);

  /* ═══ Zone Colors ═══ */
  --nm-zone-local-bg:   #0d2818;
  --nm-zone-local-fg:   #4ade80;
  --nm-zone-local-border: #166534;

  --nm-zone-localhost-bg: #0c1929;
  --nm-zone-localhost-fg: #60a5fa;
  --nm-zone-localhost-border: #1e3a5f;

  --nm-zone-web-bg:     #2a0a0a;
  --nm-zone-web-fg:     #fca5a5;
  --nm-zone-web-border: #991b1b;

  /* ═══ Text ═══ */
  --nm-text-primary:    #e8e6e3;
  --nm-text-secondary:  #8b8d93;
  --nm-text-muted:      #52545c;
  --nm-text-url:        #e8e6e3;
  --nm-text-url-host:   #ffffff;      /* hostname gets extra emphasis */
  --nm-text-url-path:   #8b8d93;      /* path is dimmer */

  /* ═══ Typography ═══ */
  --nm-font-ui:         'Geist', system-ui, sans-serif;
  --nm-font-mono:       'JetBrains Mono', 'Cascadia Code', monospace;
  --nm-font-url:        'Geist Mono', 'JetBrains Mono', monospace;

  /* ═══ Dimensions ═══ */
  --nm-titlebar-h:      32px;
  --nm-tabbar-h:        36px;
  --nm-navbar-h:        40px;
  --nm-bookmarkbar-h:   28px;
  --nm-banner-h:        28px;
  --nm-statusbar-h:     22px;
}
```

### Tab Bar Styling

```css
.nm-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  height: var(--nm-tabbar-h);
  padding: 0 12px;
  background: var(--nm-tab-bg);
  color: var(--nm-text-secondary);
  font-size: 12px;
  border-right: 1px solid var(--nm-tab-border);
  cursor: pointer;
  max-width: 240px;
  min-width: 60px;
  transition: background 100ms;
  position: relative;
}

.nm-tab.active {
  background: var(--nm-tab-active-bg);
  color: var(--nm-text-primary);
}

/* Active tab has a red top accent line */
.nm-tab.active::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--nm-accent);
}

.nm-tab:hover:not(.active) {
  background: var(--nm-tab-hover-bg);
}

.nm-tab-favicon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.nm-tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.nm-tab-close {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 100ms;
}

.nm-tab:hover .nm-tab-close { opacity: 0.5; }
.nm-tab-close:hover { opacity: 1 !important; background: rgba(255,255,255,0.1); }

/* Pinned tabs — icon only */
.nm-tab.pinned {
  min-width: 36px;
  max-width: 36px;
  padding: 0;
  justify-content: center;
}
.nm-tab.pinned .nm-tab-title,
.nm-tab.pinned .nm-tab-close { display: none; }
```

### URL Bar Styling

```css
.nm-url-bar {
  flex: 1;
  height: 28px;
  background: var(--nm-bg-input);
  border: 1px solid var(--nm-tab-border);
  border-radius: 14px;
  padding: 0 12px;
  font-family: var(--nm-font-url);
  font-size: 13px;
  color: var(--nm-text-url);
  outline: none;
  transition: border-color 150ms, box-shadow 150ms;
}

.nm-url-bar:focus {
  border-color: var(--nm-accent);
  box-shadow: 0 0 0 1px var(--nm-accent-dim);
}

/* Zone indicator dot in URL bar */
.nm-url-zone-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
.nm-url-zone-dot.LOCAL { background: var(--nm-zone-local-fg); }
.nm-url-zone-dot.LOCALHOST { background: var(--nm-zone-localhost-fg); }
.nm-url-zone-dot.WEB { background: var(--nm-zone-web-fg); }
```

### Icon Concept: The Glitched "N"

**Final recommendation: N monogram with a horizontal glitch displacement and a red glow bleed.**

At different sizes:
- **16x16 (tray):** Just the red N, no glow — must be crisp
- **32x32 (taskbar):** N with subtle glitch slice
- **64x64 (dock):** N with glitch + slight glow
- **128+ (splash, about):** Full effect — glitch, glow, CRT scanlines

Tray icon states:
- **Idle:** Dim red N (muted, `--nm-accent-dim`)
- **Active tab loading:** Bright red N (full `--nm-accent`)
- **Error/crash:** Orange N (warning state)

---

## 10. New Tab Page

`nightmare://newtab` — the page you see when opening a new tab.

```
┌─────────────────────────────────────────────┐
│                                             │
│              ☠ NIGHTMARE                    │
│           ─────────────────                 │
│                                             │
│   ┌──────────────────────────────────────┐  │
│   │  🔍  Search or enter URL...          │  │  ← Large search/URL bar
│   └──────────────────────────────────────┘  │
│                                             │
│   MOST VISITED                              │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│   │ 3000 │ │ Dash │ │ API  │ │ Docs │     │  ← Speed dial tiles
│   └──────┘ └──────┘ └──────┘ └──────┘     │
│                                             │
│   RECENTLY BOOKMARKED                       │
│   ★ My Dashboard  ★ API Docs  ★ Config     │
│                                             │
│   ──────────────────────────────────────    │
│   Type a port number to open localhost.     │  ← Hint text
│   Type a path to open a local file.         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 11. Build Order (updated for Browser)

1. **Security Zones service + tests** — this is the foundation, TDD first
2. **Tab model + TabManager + tests** — tab lifecycle without any DOM
3. **URL resolution + tests** — the smart URL bar logic
4. **Bookmarks service + tests** — CRUD, storage, import/export
5. **History service + tests** — visit tracking, search
6. **Browser shell HTML** — titlebar, tab bar, nav bar, bookmarks bar, status bar, content area
7. **Webview integration** — create/destroy webviews per tab, wire events
8. **Security banner** — zone detection → banner display, non-dismissable WEB warning
9. **Tab bar UI** — create, close, switch, drag-reorder, pinned, favicon, loading spinner
10. **Navigation bar UI** — back/forward/reload/home buttons, URL input, zone dot
11. **Bookmarks bar UI** — display, click, drag-reorder, star button in URL bar
12. **Context menus** — page, link, image, tab right-click menus
13. **Find bar** — Ctrl+F in-page search
14. **Internal pages** — newtab, settings, history, bookmarks, about
15. **Keyboard shortcuts** — full mapping
16. **Downloads manager** — intercept downloads, show progress
17. **System tray** — minimize to tray, tray menu
18. **Settings** — home page, search engine, downloads path, theme options
19. **E2E tests** — Playwright tests for the full browser
20. **Icon + branding** — SVG source, export all sizes, splash screen
21. **Build + package** — nw-builder for Win/Mac/Linux distribution