import type { Router } from './router';
import type { TabManager } from '../services/tab-manager';
import { param } from './handlers';

interface WebviewDeps {
  readonly tabManager: TabManager;
}

function getBody(body: unknown): Record<string, unknown> {
  return (body !== null && body !== undefined ? body : {}) as Record<string, unknown>;
}

function getStringParam(obj: Record<string, unknown>, key: string): string {
  const val = obj[key];
  return typeof val === 'string' ? val : '';
}

function getNumberParam(obj: Record<string, unknown>, key: string): number {
  const val = obj[key];
  return typeof val === 'number' ? val : 0;
}

export function registerWebviewRoutes(router: Router, deps: WebviewDeps): void {
  const { tabManager } = deps;

  router.post('/api/tabs/:id/execute', (params, body) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    const reqBody = getBody(body);
    getStringParam(reqBody, 'code');
    return { status: 200, body: { result: null, note: 'Requires webview context' } };
  });

  router.get('/api/tabs/:id/screenshot', (params) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    return { status: 200, body: { screenshot: '', format: 'png', note: 'Requires webview context' } };
  });

  router.get('/api/tabs/:id/html', (params) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    return { status: 200, body: { html: '', note: 'Requires webview context' } };
  });

  router.post('/api/tabs/:id/click', (params, body) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    const reqBody = getBody(body);
    const selector = getStringParam(reqBody, 'selector');
    return { status: 200, body: { clicked: selector, tabId: tab.id, note: 'Requires webview context' } };
  });

  router.post('/api/tabs/:id/type', (params, body) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    const reqBody = getBody(body);
    const selector = getStringParam(reqBody, 'selector');
    const text = getStringParam(reqBody, 'text');
    return { status: 200, body: { typed: text, selector, tabId: tab.id, note: 'Requires webview context' } };
  });

  router.post('/api/tabs/:id/wait-for', (params, body) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    const reqBody = getBody(body);
    const selector = getStringParam(reqBody, 'selector');
    const timeout = getNumberParam(reqBody, 'timeout');
    return { status: 200, body: { selector, timeout, tabId: tab.id, note: 'Requires webview context' } };
  });

  router.get('/api/tabs/:id/query', (params, body) => {
    const tab = tabManager.getTab(param(params, 'id'));
    if (!tab) return { status: 404, body: { error: 'Tab not found' } };
    const reqBody = getBody(body);
    const selector = getStringParam(reqBody, 'selector');
    const action = getStringParam(reqBody, 'action');
    return { status: 200, body: { selector, action, tabId: tab.id, note: 'Requires webview context' } };
  });
}
