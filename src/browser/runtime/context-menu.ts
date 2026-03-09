/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MenuItem, BrowserDeps } from './types';

declare const require: (module: string) => any;

function copyToClipboard(text: string): void {
  try {
    const cb = (require('nw.gui') as { Clipboard: { get(): { set(t: string, type: string): void } } })
      .Clipboard.get();
    cb.set(text, 'text');
  } catch {
    try {
      void navigator.clipboard.writeText(text);
    } catch {
      // no clipboard available
    }
  }
}

export function showContextMenu(
  x: number,
  y: number,
  items: MenuItem[],
): void {
  const existing = document.getElementById('nm-context-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.id = 'nm-context-menu';
  menu.style.cssText = `position:fixed;top:${String(y)}px;left:${String(x)}px;background:#12142a;border:1px solid #2a2d44;border-radius:6px;padding:4px 0;z-index:9999;min-width:200px;box-shadow:0 8px 24px rgba(0,0,0,0.7);font-size:13px;font-family:inherit;`;

  for (const item of items) {
    if (item.separator === true) {
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:#2a2d44;margin:4px 0;';
      menu.appendChild(sep);
      continue;
    }
    const el = document.createElement('div');
    el.style.cssText =
      'padding:7px 16px;cursor:pointer;color:#d0d0d8;display:flex;justify-content:space-between;align-items:center;';
    if (item.disabled === true) {
      el.style.opacity = '0.4';
      el.style.cursor = 'default';
    }
    const labelSpan = document.createElement('span');
    labelSpan.textContent = item.label ?? '';
    el.appendChild(labelSpan);
    if (item.shortcut) {
      const scSpan = document.createElement('span');
      scSpan.textContent = item.shortcut;
      scSpan.style.cssText =
        'font-size:11px;color:#585a64;margin-left:24px;';
      el.appendChild(scSpan);
    }
    if (item.disabled !== true) {
      el.addEventListener('mouseenter', () => {
        el.style.background = '#1e2248';
      });
      el.addEventListener('mouseleave', () => {
        el.style.background = 'none';
      });
      el.addEventListener('click', () => {
        if (item.action) item.action();
        menu.remove();
      });
    }
    menu.appendChild(el);
  }

  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = `${String(window.innerWidth - rect.width - 8)}px`;
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${String(window.innerHeight - rect.height - 8)}px`;
  }

  const removeMenu = (e: MouseEvent): void => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      document.removeEventListener('mousedown', removeMenu);
    }
  };
  setTimeout(() => {
    document.addEventListener('mousedown', removeMenu);
  }, 0);
}

export function injectContextMenu(
  tabId: string,
  frame: HTMLIFrameElement,
  deps: BrowserDeps,
): void {
  try {
    const doc = frame.contentDocument;
    if (!doc) return;
    doc.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      const currentTab = deps.tabManager.getTab(tabId);
      if (!currentTab) return;
      const currentDom = deps.tabDom.get(tabId);

      const target = e.target as HTMLElement;
      const linkElRaw = target.closest('a[href]');
      const linkEl: HTMLAnchorElement | null = linkElRaw
        ? (linkElRaw as unknown as HTMLAnchorElement)
        : null;
      const imgElRaw = target.closest('img[src]');
      const imgEl: HTMLImageElement | null = imgElRaw
        ? (imgElRaw as unknown as HTMLImageElement)
        : null;

      let selectedText = '';
      try {
        selectedText =
          frame.contentWindow?.getSelection()?.toString() ?? '';
      } catch {
        // cross-origin
      }

      const frameRect = frame.getBoundingClientRect();
      const mx = e.clientX + frameRect.left;
      const my = e.clientY + frameRect.top;

      const navSt = deps.navState.get(tabId);
      const canBack =
        navSt !== undefined &&
        (navSt.depth > 0 ||
          (navSt.openerId !== null &&
            deps.tabManager.hasTab(navSt.openerId)));
      const canFwd = navSt !== undefined && navSt.forwardDepth > 0;
      const displayUrl = deps.toDisplayUrl(currentTab.url);

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
            if (currentDom) currentDom.frame.src = currentTab.url;
          },
        },
        { separator: true },
      ];

      if (linkEl) {
        const linkHref = linkEl.href;
        menuItems.push({
          label: 'Open Link in New Tab',
          action: (): void => {
            deps.createTab(linkHref);
          },
        });
        menuItems.push({
          label: 'Copy Link Address',
          action: (): void => {
            copyToClipboard(linkHref);
          },
        });
        menuItems.push({ separator: true });
      }

      if (imgEl) {
        const imgSrc = imgEl.src;
        menuItems.push({
          label: 'Open Image in New Tab',
          action: (): void => {
            deps.createTab(imgSrc);
          },
        });
        menuItems.push({
          label: 'Copy Image Address',
          action: (): void => {
            copyToClipboard(imgSrc);
          },
        });
        menuItems.push({ separator: true });
      }

      if (selectedText) {
        const searchQuery = selectedText.substring(0, 80);
        menuItems.push({
          label: 'Copy',
          action: (): void => {
            copyToClipboard(selectedText);
          },
        });
        const truncated =
          searchQuery.length > 30
            ? `${searchQuery.substring(0, 30)}...`
            : searchQuery;
        menuItems.push({
          label: `Search Google for "${truncated}"`,
          action: (): void => {
            deps.createTab(
              `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
            );
          },
        });
        menuItems.push({ separator: true });
      }

      menuItems.push({
        label: deps.isBookmarked(currentTab.url)
          ? 'Remove Bookmark'
          : 'Bookmark This Page',
        shortcut: '\u2318D',
        action: (): void => {
          if (deps.isBookmarked(currentTab.url)) {
            deps.removeBookmark(currentTab.url);
          } else {
            deps.addBookmark(currentTab.url, currentTab.title);
          }
        },
      });
      menuItems.push({ separator: true });
      menuItems.push({
        label: 'Copy Page URL',
        action: (): void => {
          copyToClipboard(displayUrl);
        },
      });
      menuItems.push({
        label: 'View Page Source',
        action: (): void => {
          try {
            const html =
              frame.contentDocument?.documentElement.outerHTML ?? '';
            const blob = new Blob([html], { type: 'text/plain' });
            deps.createTab(URL.createObjectURL(blob));
          } catch {
            // cross-origin
          }
        },
      });
      menuItems.push({
        label: 'Find in Page',
        shortcut: '\u2318F',
        action: (): void => {
          deps.toggleFindBar();
        },
      });
      menuItems.push({ separator: true });
      menuItems.push({
        label: 'Inspect Element',
        shortcut: 'F12',
        action: (): void => {
          if (deps.win) deps.win.showDevTools();
        },
      });

      showContextMenu(mx, my, menuItems);
    });
  } catch {
    // cross-origin
  }
}
