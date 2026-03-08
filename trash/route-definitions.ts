import type { RouteRegistry, RouteParams } from './route-registry';
import type { RouteResponse } from './router';
import type { TabManager } from '../services/tab-manager';
import type { ConsoleCapture } from './console-capture';
import type { EventBus } from './event-bus';

export interface RouteDependencies {
  readonly tabManager: TabManager;
  readonly consoleCapture: ConsoleCapture;
  readonly eventBus: EventBus;
}

function getString(obj: Record<string, unknown>, key: string): string {
  const val = obj[key];
  return typeof val === 'string' ? val : '';
}

function tabNotFound(): RouteResponse {
  return { status: 404, body: { error: 'Tab not found' } };
}

function requireTab(
  deps: RouteDependencies,
  p: RouteParams,
  fn: (tabId: string) => RouteResponse,
): RouteResponse {
  const tabId = p.pathParams.id ?? getString(p.body, 'tabId');
  const tab = deps.tabManager.getTab(tabId);
  if (!tab) return tabNotFound();
  return fn(tab.id);
}

export function registerAllRoutes(
  registry: RouteRegistry,
  deps: RouteDependencies,
): void {
  registry.register({
    method: 'POST', path: '/api/tabs', mcpName: 'nightmare_create_tab',
    description: 'Open a new tab with optional URL',
    inputSchema: { type: 'object', properties: { url: { type: 'string' } } },
    handler: (p) => {
      const url = getString(p.body, 'url') || undefined;
      const tab = deps.tabManager.createTab(url);
      deps.eventBus.emit({
        type: 'tab:created',
        tab: { id: tab.id, url: tab.url, title: tab.title, zone: tab.zone },
      });
      return { status: 201, body: tab };
    },
  });

  registry.register({
    method: 'GET', path: '/api/tabs', mcpName: 'nightmare_list_tabs',
    description: 'List all open tabs with state',
    inputSchema: { type: 'object', properties: {} },
    handler: () => ({ status: 200, body: deps.tabManager.getAllTabs() }),
  });

  registry.register({
    method: 'GET', path: '/api/tabs/:id', mcpName: 'nightmare_get_tab',
    description: 'Get full tab state by ID',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => requireTab(deps, p, (tabId) => (
      { status: 200, body: deps.tabManager.getTab(tabId) }
    )),
  });

  registry.register({
    method: 'DELETE', path: '/api/tabs/:id', mcpName: 'nightmare_close_tab',
    description: 'Close a tab by ID',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => {
      const id = p.pathParams.id ?? getString(p.body, 'tabId');
      deps.tabManager.closeTab(id);
      deps.eventBus.emit({ type: 'tab:closed', tabId: id });
      return { status: 204, body: null };
    },
  });

  registry.register({
    method: 'POST', path: '/api/tabs/:id/navigate', mcpName: 'nightmare_navigate',
    description: 'Navigate a tab to a URL',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, url: { type: 'string' } },
      required: ['tabId', 'url'],
    },
    handler: (p) => requireTab(deps, p, (tabId) => {
      const url = getString(p.body, 'url');
      deps.tabManager.updateTabFromWebview(tabId, { url });
      deps.eventBus.emit({ type: 'tab:navigated', tabId, url });
      return { status: 200, body: deps.tabManager.getTab(tabId) };
    }),
  });

  registry.register({
    method: 'POST', path: '/api/tabs/:id/reload', mcpName: 'nightmare_reload',
    description: 'Reload a tab',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => requireTab(deps, p, () => (
      { status: 200, body: { reloading: true } }
    )),
  });

  registry.register({
    method: 'POST', path: '/api/tabs/:id/back', mcpName: 'nightmare_go_back',
    description: 'Navigate back in tab history',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => requireTab(deps, p, () => (
      { status: 200, body: { navigating: 'back' } }
    )),
  });

  registry.register({
    method: 'POST', path: '/api/tabs/:id/forward', mcpName: 'nightmare_go_forward',
    description: 'Navigate forward in tab history',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => requireTab(deps, p, () => (
      { status: 200, body: { navigating: 'forward' } }
    )),
  });

  registry.register({
    method: 'GET', path: '/api/tabs/:id/console', mcpName: 'nightmare_get_console',
    description: 'Read console log buffer for a tab',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => {
      const tabId = p.pathParams.id ?? getString(p.body, 'tabId');
      return { status: 200, body: deps.consoleCapture.getEntries(tabId) };
    },
  });

  registry.register({
    method: 'GET', path: '/api/state', mcpName: 'nightmare_get_state',
    description: 'Full browser state snapshot',
    inputSchema: { type: 'object', properties: {} },
    handler: () => {
      const tabs = deps.tabManager.getAllTabs();
      const activeTab = deps.tabManager.getActiveTab();
      return {
        status: 200,
        body: {
          tabs,
          activeTabId: activeTab?.id ?? null,
          tabCount: deps.tabManager.getTabCount(),
        },
      };
    },
  });
}
