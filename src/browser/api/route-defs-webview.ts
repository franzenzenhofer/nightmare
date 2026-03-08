import type { RouteRegistry } from './route-registry';
import { getString, getNumber, withTab } from './route-helpers';
import type { RouteDependencies } from './route-helpers';

export function registerWebviewRoutes(r: RouteRegistry, d: RouteDependencies): void {
  r.register({
    method: 'POST', path: '/api/tabs/:id/execute',
    mcpName: 'nightmare_execute_js',
    description: 'Execute JavaScript in tab context',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, code: { type: 'string' } },
      required: ['tabId', 'code'],
    },
    handler: (p) => withTab(d, p, () => (
      { status: 200, body: { result: null, note: 'Requires webview context' } }
    )),
  });

  r.register({
    method: 'GET', path: '/api/tabs/:id/screenshot',
    mcpName: 'nightmare_screenshot',
    description: 'Take screenshot of tab',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => withTab(d, p, () => (
      { status: 200, body: { screenshot: '', format: 'png', note: 'Requires webview context' } }
    )),
  });

  r.register({
    method: 'GET', path: '/api/tabs/:id/html',
    mcpName: 'nightmare_get_html',
    description: 'Get page HTML content',
    inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    handler: (p) => withTab(d, p, () => (
      { status: 200, body: { html: '', note: 'Requires webview context' } }
    )),
  });

  r.register({
    method: 'POST', path: '/api/tabs/:id/click',
    mcpName: 'nightmare_click',
    description: 'Click element by CSS selector',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, selector: { type: 'string' } },
      required: ['tabId', 'selector'],
    },
    handler: (p) => withTab(d, p, (id) => {
      const selector = getString(p.body, 'selector');
      return { status: 200, body: { clicked: selector, tabId: id, note: 'Requires webview context' } };
    }),
  });

  r.register({
    method: 'POST', path: '/api/tabs/:id/type',
    mcpName: 'nightmare_type_text',
    description: 'Type text into element by selector',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, selector: { type: 'string' }, text: { type: 'string' } },
      required: ['tabId', 'selector', 'text'],
    },
    handler: (p) => withTab(d, p, (id) => {
      const selector = getString(p.body, 'selector');
      const text = getString(p.body, 'text');
      return { status: 200, body: { typed: text, selector, tabId: id, note: 'Requires webview context' } };
    }),
  });

  r.register({
    method: 'POST', path: '/api/tabs/:id/wait-for',
    mcpName: 'nightmare_wait_for',
    description: 'Wait for selector or condition',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, selector: { type: 'string' }, timeout: { type: 'number' } },
      required: ['tabId', 'selector'],
    },
    handler: (p) => withTab(d, p, (id) => {
      const selector = getString(p.body, 'selector');
      const timeout = getNumber(p.body, 'timeout');
      return { status: 200, body: { selector, timeout, tabId: id, note: 'Requires webview context' } };
    }),
  });

  r.register({
    method: 'GET', path: '/api/tabs/:id/query',
    mcpName: 'nightmare_query_dom',
    description: 'Query DOM element by selector',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, selector: { type: 'string' }, action: { type: 'string' } },
      required: ['tabId', 'selector'],
    },
    handler: (p) => withTab(d, p, (id) => {
      const selector = getString(p.body, 'selector');
      const action = getString(p.body, 'action');
      return { status: 200, body: { selector, action, tabId: id, note: 'Requires webview context' } };
    }),
  });
}
