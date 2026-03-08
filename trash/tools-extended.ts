import type { McpToolRegistry, McpDependencies } from './tools';

function requireTab(
  deps: McpDependencies,
  args: Record<string, unknown>,
  fn: (tabId: string) => unknown,
): unknown {
  const tabId = args.tabId as string;
  const tab = deps.tabManager.getTab(tabId);
  if (!tab) throw new Error('Tab not found');
  return fn(tab.id);
}

export function registerExtendedTools(
  registry: McpToolRegistry,
  deps: McpDependencies,
): void {
  const tabSchema = { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] };

  registry.register({
    name: 'nightmare_activate_tab',
    description: 'Activate a tab by ID',
    inputSchema: tabSchema,
    handler: (args) => requireTab(deps, args, (tabId) => {
      deps.tabManager.activateTab(tabId);
      return { activated: true, tabId };
    }),
  });

  registry.register({
    name: 'nightmare_duplicate_tab',
    description: 'Duplicate a tab',
    inputSchema: tabSchema,
    handler: (args) => {
      const newTab = deps.tabManager.duplicateTab(args.tabId as string);
      if (!newTab) throw new Error('Tab not found');
      deps.eventBus.emit({
        type: 'tab:created',
        tab: { id: newTab.id, url: newTab.url, title: newTab.title, zone: newTab.zone },
      });
      return newTab;
    },
  });

  registry.register({
    name: 'nightmare_pin_tab',
    description: 'Toggle pin state on a tab',
    inputSchema: tabSchema,
    handler: (args) => requireTab(deps, args, (tabId) => {
      deps.tabManager.pinTab(tabId);
      const tab = deps.tabManager.getTab(tabId);
      return { pinned: tab?.pinned ?? false, tabId };
    }),
  });

  registry.register({
    name: 'nightmare_mute_tab',
    description: 'Toggle mute state on a tab',
    inputSchema: tabSchema,
    handler: (args) => requireTab(deps, args, (tabId) => {
      const tab = deps.tabManager.getTab(tabId);
      if (tab) tab.muted = !tab.muted;
      return { muted: tab?.muted ?? false, tabId };
    }),
  });

  registry.register({
    name: 'nightmare_execute_js',
    description: 'Execute JavaScript in tab context',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, code: { type: 'string' } },
      required: ['tabId', 'code'],
    },
    handler: (args) => requireTab(deps, args, () => (
      { result: null, note: 'Requires webview context' }
    )),
  });

  registry.register({
    name: 'nightmare_screenshot',
    description: 'Take screenshot of tab',
    inputSchema: tabSchema,
    handler: (args) => requireTab(deps, args, () => (
      { screenshot: '', format: 'png', note: 'Requires webview context' }
    )),
  });

  registry.register({
    name: 'nightmare_get_html',
    description: 'Get page HTML content',
    inputSchema: tabSchema,
    handler: (args) => requireTab(deps, args, () => (
      { html: '', note: 'Requires webview context' }
    )),
  });

  registry.register({
    name: 'nightmare_zoom',
    description: 'Set zoom level for a tab',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, level: { type: 'number' } },
      required: ['tabId', 'level'],
    },
    handler: (args) => requireTab(deps, args, (tabId) => (
      { zoom: args.level, tabId }
    )),
  });

  registry.register({
    name: 'nightmare_shutdown',
    description: 'Shutdown the browser',
    inputSchema: { type: 'object', properties: {} },
    handler: () => ({ shutting_down: true }),
  });

  registry.register({
    name: 'nightmare_relaunch',
    description: 'Relaunch browser without killing process',
    inputSchema: { type: 'object', properties: {} },
    handler: () => ({ relaunching: true }),
  });

  registry.register({
    name: 'nightmare_find_in_page',
    description: 'Find text in current page',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, query: { type: 'string' } },
      required: ['tabId', 'query'],
    },
    handler: (args) => requireTab(deps, args, (tabId) => (
      { query: args.query, tabId, note: 'Requires webview context' }
    )),
  });

  registry.register({
    name: 'nightmare_click',
    description: 'Click element by CSS selector',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, selector: { type: 'string' } },
      required: ['tabId', 'selector'],
    },
    handler: (args) => requireTab(deps, args, (tabId) => (
      { clicked: args.selector, tabId, note: 'Requires webview context' }
    )),
  });

  registry.register({
    name: 'nightmare_type_text',
    description: 'Type text into element by selector',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, selector: { type: 'string' }, text: { type: 'string' } },
      required: ['tabId', 'selector', 'text'],
    },
    handler: (args) => requireTab(deps, args, (tabId) => (
      { typed: args.text, selector: args.selector, tabId, note: 'Requires webview context' }
    )),
  });

  registry.register({
    name: 'nightmare_wait_for',
    description: 'Wait for selector or condition',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, selector: { type: 'string' }, timeout: { type: 'number' } },
      required: ['tabId', 'selector'],
    },
    handler: (args) => requireTab(deps, args, (tabId) => (
      { selector: args.selector, timeout: args.timeout ?? 5000, tabId, note: 'Requires webview context' }
    )),
  });

  registry.register({
    name: 'nightmare_query_dom',
    description: 'Query DOM element by selector',
    inputSchema: {
      type: 'object',
      properties: { tabId: { type: 'string' }, selector: { type: 'string' }, action: { type: 'string' } },
      required: ['tabId', 'selector'],
    },
    handler: (args) => requireTab(deps, args, (tabId) => (
      { selector: args.selector, action: args.action ?? 'text', tabId, note: 'Requires webview context' }
    )),
  });
}
