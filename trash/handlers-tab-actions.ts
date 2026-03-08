import type { Router } from './router';
import type { TabManager } from '../services/tab-manager';
import type { EventBus } from './event-bus';
import { param } from './handlers';

interface TabActionDeps {
  readonly tabManager: TabManager;
  readonly eventBus: EventBus;
}

function getBody(body: unknown): Record<string, unknown> {
  return (body !== null && body !== undefined ? body : {}) as Record<string, unknown>;
}

function getNumberParam(obj: Record<string, unknown>, key: string): number {
  const val = obj[key];
  return typeof val === 'number' ? val : 0;
}

function getStringParam(obj: Record<string, unknown>, key: string): string {
  const val = obj[key];
  return typeof val === 'string' ? val : '';
}

export function registerTabActionRoutes(router: Router, deps: TabActionDeps): void {
  const { tabManager, eventBus } = deps;

  router.post('/api/tabs/:id/activate', (params) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    tabManager.activateTab(tab.id);
    return { status: 200, body: { activated: true, tabId: tab.id } };
  });

  router.post('/api/tabs/:id/duplicate', (params) => {
    const id = param(params, 'id');
    const newTab = tabManager.duplicateTab(id);
    if (!newTab) return { status: 404, body: { error: 'Tab not found' } };
    eventBus.emit({
      type: 'tab:created',
      tab: { id: newTab.id, url: newTab.url, title: newTab.title, zone: newTab.zone },
    });
    return { status: 201, body: newTab };
  });

  router.post('/api/tabs/:id/pin', (params) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    tabManager.pinTab(tab.id);
    return { status: 200, body: { pinned: tab.pinned, tabId: tab.id } };
  });

  router.post('/api/tabs/:id/mute', (params) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    tab.muted = !tab.muted;
    return { status: 200, body: { muted: tab.muted, tabId: tab.id } };
  });

  router.post('/api/tabs/:id/zoom', (params, body) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    const reqBody = getBody(body);
    const level = getNumberParam(reqBody, 'level');
    return { status: 200, body: { zoom: level, tabId: tab.id } };
  });

  router.post('/api/tabs/:id/find', (params, body) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    const reqBody = getBody(body);
    const query = getStringParam(reqBody, 'query');
    return { status: 200, body: { query, tabId: tab.id, note: 'Requires webview context' } };
  });
}
