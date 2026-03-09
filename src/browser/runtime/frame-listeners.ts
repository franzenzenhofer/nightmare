import type { BrowserDeps } from './types';
import { injectContextMenu } from './context-menu';

export function attachFrameListeners(
  tabId: string,
  frame: HTMLIFrameElement,
  deps: BrowserDeps,
): void {
  frame.addEventListener('load', () => {
    let newTitle = '';
    let newUrl = '';
    let newFavicon: string | null = null;
    const data = deps.tabManager.getTab(tabId);
    if (!data) return;

    try {
      const doc = frame.contentDocument;
      if (doc) {
        newTitle = doc.title || data.url;
        newUrl = frame.contentWindow?.location.href ?? '';
        const iconLink = doc.querySelector('link[rel~="icon"]');
        newFavicon = iconLink
          ? (iconLink as HTMLLinkElement).href
          : null;
      }
    } catch {
      newTitle = data.url;
      newUrl = data.url;
    }

    const effectiveUrl = newUrl || data.url;
    deps.tabManager.updateTabFromWebview(
      tabId,
      {
        title: newTitle,
        url: effectiveUrl,
        favicon: newFavicon,
        loading: false,
      },
      deps.toDisplayUrl(effectiveUrl),
    );

    const dom = deps.tabDom.get(tabId);
    if (dom) {
      dom.titleSpan.textContent =
        newTitle.length > 30
          ? `${newTitle.substring(0, 30)}...`
          : newTitle;
      dom.tabEl.classList.remove('nm-tab-loading');
    }

    const fullTab = deps.getFullTab(tabId);
    if (fullTab) injectContextMenu(tabId, frame, deps);

    const updatedData = deps.tabManager.getTab(tabId);
    if (updatedData) {
      deps.recordHistory(updatedData.url, updatedData.title);
    }

    const navSt = deps.navState.get(tabId);
    if (navSt && updatedData) {
      if (!navSt.isBackForward && updatedData.url !== navSt.lastUrl) {
        navSt.depth++;
        navSt.forwardDepth = 0;
        navSt.lastUrl = updatedData.url;
      }
      navSt.isBackForward = false;
    }

    deps.eventBus.emit({
      type: 'tab:loaded',
      tabId,
      title: updatedData?.title ?? newTitle,
    });
    deps.updateAll();
  });

  frame.addEventListener('new-window', ((e: Event) => {
    e.preventDefault();
    const nwEvent = e as Event & {
      targetUrl?: string;
      url?: string;
    };
    const targetUrl = nwEvent.targetUrl ?? nwEvent.url;
    if (targetUrl) deps.createTab(targetUrl, tabId);
  }) as EventListener);
}
