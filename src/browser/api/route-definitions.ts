import type { RouteRegistry } from './route-registry';
import { getString, resolveTabId, withTab } from './route-helpers';
import { registerTabActionRoutes } from './route-defs-tab-actions';
import { registerWebviewRoutes } from './route-defs-webview';
import { registerSystemRoutes } from './route-defs-system';

export type { RouteDependencies } from './route-helpers';
import type { RouteDependencies } from './route-helpers';

export function registerAllRoutes(
  registry: RouteRegistry, deps: RouteDependencies,
): void {
  registerCoreRoutes(registry, deps);
  registerTabActionRoutes(registry, deps);
  registerWebviewRoutes(registry, deps);
  registerSystemRoutes(registry);
}

function registerCoreRoutes(r: RouteRegistry, d: RouteDependencies): void {
  r.register({
    method: 'POST', path: '/api/tabs', mcpName: 'nightmare_create_tab',
    description: 'Open a new tab with optional URL',
    inputSchema: { type: 'object', properties: { url: { type: 'string' } } },
    handler: (p) => {
      const url = getString(p.body, 'url') || undefined;
      const tab = d.tabManager.createTab(url);
      d.eventBus.emit({
        type: 'tab:created',
        tab: { id: tab.id, url: tab.url, title: tab.title, zone: tab.zone },
      });
      return { status: 201, body: tab };
    },
  });
  r.register({
    method: 'GET', path: '/api/tabs', mcpName: 'nightmare_list_tabs',
    description: 'List all open tabs with state',
    inputSchema: { type: 'object', properties: {} },
    handler: () => ({ status: 200, body: d.tabManager.getAllTabs() }),
  });
  r.register({
    method: 'GET', path: '/api/tabs/:id', mcpName: 'nightmare_get_tab',
    description: 'Get full tab state by ID',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => withTab(d, p, (id) => ({ status: 200, body: d.tabManager.getTab(id) })),
  });
  r.register({
    method: 'DELETE', path: '/api/tabs/:id', mcpName: 'nightmare_close_tab',
    description: 'Close a tab by ID',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => {
      const id = resolveTabId(p);
      d.tabManager.closeTab(id);
      d.eventBus.emit({ type: 'tab:closed', tabId: id });
      return { status: 204, body: null };
    },
  });
  r.register({
    method: 'POST', path: '/api/tabs/:id/navigate', mcpName: 'nightmare_navigate',
    description: 'Navigate a tab to a URL',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, url: { type: 'string' } },
      required: ['tabId', 'url'],
    },
    handler: (p) => withTab(d, p, (id) => {
      const url = getString(p.body, 'url');
      d.tabManager.updateTabFromWebview(id, { url });
      d.eventBus.emit({ type: 'tab:navigated', tabId: id, url });
      return { status: 200, body: d.tabManager.getTab(id) };
    }),
  });
  r.register({
    method: 'POST', path: '/api/tabs/:id/reload', mcpName: 'nightmare_reload',
    description: 'Reload a tab',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => withTab(d, p, () => ({ status: 200, body: { reloading: true } })),
  });
  r.register({
    method: 'POST', path: '/api/tabs/:id/back', mcpName: 'nightmare_go_back',
    description: 'Navigate back in tab history',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => withTab(d, p, () => ({ status: 200, body: { navigating: 'back' } })),
  });
  r.register({
    method: 'POST', path: '/api/tabs/:id/forward', mcpName: 'nightmare_go_forward',
    description: 'Navigate forward in tab history',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => withTab(d, p, () => ({ status: 200, body: { navigating: 'forward' } })),
  });
  r.register({
    method: 'GET', path: '/api/tabs/:id/console', mcpName: 'nightmare_get_console',
    description: 'Read console log buffer for a tab',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => ({ status: 200, body: d.consoleCapture.getEntries(resolveTabId(p)) }),
  });
  r.register({
    method: 'GET', path: '/api/state', mcpName: 'nightmare_get_state',
    description: 'Full browser state snapshot',
    inputSchema: { type: 'object', properties: {} },
    handler: () => {
      const tabs = d.tabManager.getAllTabs();
      const activeTab = d.tabManager.getActiveTab();
      return {
        status: 200,
        body: { tabs, activeTabId: activeTab?.id ?? null, tabCount: d.tabManager.getTabCount() },
      };
    },
  });
}
