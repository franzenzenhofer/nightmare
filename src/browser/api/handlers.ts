import { Router } from './router';
import type { TabManager } from '../services/tab-manager';
import type { ConsoleCapture } from './console-capture';
import type { EventBus } from './event-bus';

interface ApiDependencies {
  readonly tabManager: TabManager;
  readonly consoleCapture: ConsoleCapture;
  readonly eventBus: EventBus;
}

export function createApiRouter(deps: ApiDependencies): Router {
  const router = new Router();
  const { tabManager, consoleCapture, eventBus } = deps;

  router.post('/api/tabs', (_params, body) => {
    const reqBody = (body ?? {}) as Record<string, unknown>;
    const url = typeof reqBody.url === 'string' ? reqBody.url : undefined;
    const tab = tabManager.createTab(url);
    eventBus.emit({ type: 'tab:created', tab: { id: tab.id, url: tab.url, title: tab.title, zone: tab.zone } });
    return { status: 201, body: tab };
  });

  router.get('/api/tabs', () => {
    return { status: 200, body: tabManager.getAllTabs() };
  });

  router.get('/api/tabs/:id', (params) => {
    const tab = tabManager.getTab(params.id ?? '');
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    return { status: 200, body: tab };
  });

  router.delete('/api/tabs/:id', (params) => {
    tabManager.closeTab(params.id ?? '');
    eventBus.emit({ type: 'tab:closed', tabId: params.id ?? '' });
    return { status: 204, body: null };
  });

  router.post('/api/tabs/:id/navigate', (params, body) => {
    const tab = tabManager.getTab(params.id ?? '');
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    const reqBody = (body ?? {}) as Record<string, unknown>;
    const url = typeof reqBody.url === 'string' ? reqBody.url : '';
    tabManager.updateTabFromWebview(tab.id, { url });
    eventBus.emit({ type: 'tab:navigated', tabId: tab.id, url });
    return { status: 200, body: tabManager.getTab(tab.id) };
  });

  router.post('/api/tabs/:id/reload', (params) => {
    const tab = tabManager.getTab(params.id ?? '');
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    return { status: 200, body: { reloading: true } };
  });

  router.post('/api/tabs/:id/back', (params) => {
    const tab = tabManager.getTab(params.id ?? '');
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    return { status: 200, body: { navigating: 'back' } };
  });

  router.post('/api/tabs/:id/forward', (params) => {
    const tab = tabManager.getTab(params.id ?? '');
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    return { status: 200, body: { navigating: 'forward' } };
  });

  router.get('/api/tabs/:id/console', (params) => {
    const entries = consoleCapture.getEntries(params.id ?? '');
    return { status: 200, body: entries };
  });

  router.get('/api/state', () => {
    const tabs = tabManager.getAllTabs();
    const activeTab = tabManager.getActiveTab();
    return {
      status: 200,
      body: {
        tabs,
        activeTabId: activeTab?.id ?? null,
        tabCount: tabManager.getTabCount(),
      },
    };
  });

  return router;
}
