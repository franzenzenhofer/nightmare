import type { RouteRegistry, RouteParams } from './route-registry';
import type { RouteResponse } from './router';
import type { RouteDependencies } from './route-definitions';

function getString(obj: Record<string, unknown>, key: string): string {
  const val = obj[key];
  return typeof val === 'string' ? val : '';
}

function getNumber(obj: Record<string, unknown>, key: string): number {
  const val = obj[key];
  return typeof val === 'number' ? val : 0;
}

function resolveTabId(p: RouteParams): string {
  return p.pathParams.id ?? getString(p.body, 'tabId');
}

function notFound(): RouteResponse {
  return { status: 404, body: { error: 'Tab not found' } };
}

function withTab(
  d: RouteDependencies, p: RouteParams, fn: (id: string) => RouteResponse,
): RouteResponse {
  const id = resolveTabId(p);
  const tab = d.tabManager.getTab(id);
  if (!tab) return notFound();
  return fn(tab.id);
}

export function registerTabActionRoutes(r: RouteRegistry, d: RouteDependencies): void {
  r.register({
    method: 'POST', path: '/api/tabs/:id/activate',
    mcpName: 'nightmare_activate_tab',
    description: 'Activate a tab by ID',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => withTab(d, p, (id) => {
      d.tabManager.activateTab(id);
      return { status: 200, body: { activated: true, tabId: id } };
    }),
  });

  r.register({
    method: 'POST', path: '/api/tabs/:id/duplicate',
    mcpName: 'nightmare_duplicate_tab',
    description: 'Duplicate a tab',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => {
      const id = resolveTabId(p);
      const newTab = d.tabManager.duplicateTab(id);
      if (!newTab) return notFound();
      d.eventBus.emit({
        type: 'tab:created',
        tab: { id: newTab.id, url: newTab.url, title: newTab.title, zone: newTab.zone },
      });
      return { status: 201, body: newTab };
    },
  });

  r.register({
    method: 'POST', path: '/api/tabs/:id/pin',
    mcpName: 'nightmare_pin_tab',
    description: 'Toggle pin state on a tab',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => withTab(d, p, (id) => {
      d.tabManager.pinTab(id);
      const tab = d.tabManager.getTab(id);
      return { status: 200, body: { pinned: tab?.pinned ?? false, tabId: id } };
    }),
  });

  r.register({
    method: 'POST', path: '/api/tabs/:id/mute',
    mcpName: 'nightmare_mute_tab',
    description: 'Toggle mute state on a tab',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => withTab(d, p, (id) => {
      const tab = d.tabManager.getTab(id);
      if (tab) tab.muted = !tab.muted;
      return { status: 200, body: { muted: tab?.muted ?? false, tabId: id } };
    }),
  });

  r.register({
    method: 'POST', path: '/api/tabs/:id/zoom',
    mcpName: 'nightmare_zoom',
    description: 'Set zoom level for a tab',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, level: { type: 'number' } },
      required: ['tabId', 'level'],
    },
    handler: (p) => withTab(d, p, (id) => {
      const level = getNumber(p.body, 'level');
      return { status: 200, body: { zoom: level, tabId: id } };
    }),
  });

  r.register({
    method: 'POST', path: '/api/tabs/:id/find',
    mcpName: 'nightmare_find_in_page',
    description: 'Find text in current page',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, query: { type: 'string' } },
      required: ['tabId', 'query'],
    },
    handler: (p) => withTab(d, p, (id) => {
      const query = getString(p.body, 'query');
      return { status: 200, body: { query, tabId: id, note: 'Requires webview context' } };
    }),
  });
}
