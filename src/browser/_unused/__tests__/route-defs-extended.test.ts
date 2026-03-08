import { describe, it, expect, beforeEach } from 'vitest';
import { RouteRegistry } from '../api/route-registry';
import { registerAllRoutes } from '../api/route-definitions';
import type { RouteDependencies } from '../api/route-helpers';
import { TabManager } from '../services/tab-manager';
import { ConsoleCapture } from '../api/console-capture';
import { EventBus } from '../api/event-bus';

function makeDeps(): RouteDependencies {
  return {
    tabManager: new TabManager(),
    consoleCapture: new ConsoleCapture(),
    eventBus: new EventBus(),
  };
}

function callRoute(
  registry: RouteRegistry,
  mcpName: string,
  pathParams: Record<string, string>,
  body: Record<string, unknown>,
): { status: number; body: unknown } {
  const def = registry.findByMcpName(mcpName);
  if (!def) throw new Error(`Route not found: ${mcpName}`);
  return def.handler({ pathParams, body });
}

describe('Tab Action Routes', () => {
  let registry: RouteRegistry;
  let deps: RouteDependencies;

  beforeEach(() => {
    registry = new RouteRegistry();
    deps = makeDeps();
    registerAllRoutes(registry, deps);
  });

  it('registers nightmare_activate_tab', () => {
    expect(registry.findByMcpName('nightmare_activate_tab')).toBeDefined();
  });

  it('activates a tab', () => {
    const tab = deps.tabManager.createTab();
    deps.tabManager.createTab();
    const result = callRoute(registry, 'nightmare_activate_tab', { id: tab.id }, {});
    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>).activated).toBe(true);
  });

  it('returns 404 for activate on nonexistent tab', () => {
    const result = callRoute(registry, 'nightmare_activate_tab', { id: 'nope' }, {});
    expect(result.status).toBe(404);
  });

  it('duplicates a tab', () => {
    const tab = deps.tabManager.createTab('https://example.com');
    const result = callRoute(registry, 'nightmare_duplicate_tab', { id: tab.id }, {});
    expect(result.status).toBe(201);
    expect(deps.tabManager.getTabCount()).toBe(2);
  });

  it('returns 404 for duplicate on nonexistent tab', () => {
    const result = callRoute(registry, 'nightmare_duplicate_tab', { id: 'nope' }, {});
    expect(result.status).toBe(404);
  });

  it('pins a tab', () => {
    const tab = deps.tabManager.createTab();
    const result = callRoute(registry, 'nightmare_pin_tab', { id: tab.id }, {});
    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>).pinned).toBe(true);
  });

  it('toggles mute on a tab', () => {
    const tab = deps.tabManager.createTab();
    const r1 = callRoute(registry, 'nightmare_mute_tab', { id: tab.id }, {});
    expect((r1.body as Record<string, unknown>).muted).toBe(true);
    const r2 = callRoute(registry, 'nightmare_mute_tab', { id: tab.id }, {});
    expect((r2.body as Record<string, unknown>).muted).toBe(false);
  });

  it('sets zoom level', () => {
    const tab = deps.tabManager.createTab();
    const result = callRoute(registry, 'nightmare_zoom', { id: tab.id }, { level: 1.5 });
    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>).zoom).toBe(1.5);
  });

  it('finds text in page', () => {
    const tab = deps.tabManager.createTab();
    const result = callRoute(registry, 'nightmare_find_in_page', { id: tab.id }, { query: 'hello' });
    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>).query).toBe('hello');
  });
});

describe('Webview Routes', () => {
  let registry: RouteRegistry;
  let deps: RouteDependencies;

  beforeEach(() => {
    registry = new RouteRegistry();
    deps = makeDeps();
    registerAllRoutes(registry, deps);
  });

  it('registers nightmare_execute_js', () => {
    expect(registry.findByMcpName('nightmare_execute_js')).toBeDefined();
  });

  it('executes JS (placeholder)', () => {
    const tab = deps.tabManager.createTab();
    const result = callRoute(registry, 'nightmare_execute_js', { id: tab.id }, { code: 'return 1' });
    expect(result.status).toBe(200);
  });

  it('returns 404 for execute on nonexistent tab', () => {
    const result = callRoute(registry, 'nightmare_execute_js', { id: 'nope' }, { code: '' });
    expect(result.status).toBe(404);
  });

  it('takes screenshot (placeholder)', () => {
    const tab = deps.tabManager.createTab();
    const result = callRoute(registry, 'nightmare_screenshot', { id: tab.id }, {});
    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>).format).toBe('png');
  });

  it('gets HTML (placeholder)', () => {
    const tab = deps.tabManager.createTab();
    const result = callRoute(registry, 'nightmare_get_html', { id: tab.id }, {});
    expect(result.status).toBe(200);
  });

  it('clicks element by selector', () => {
    const tab = deps.tabManager.createTab();
    const result = callRoute(registry, 'nightmare_click', { id: tab.id }, { selector: '#btn' });
    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>).clicked).toBe('#btn');
  });

  it('types text into element', () => {
    const tab = deps.tabManager.createTab();
    const result = callRoute(registry, 'nightmare_type_text', { id: tab.id }, { selector: '#input', text: 'hello' });
    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>).typed).toBe('hello');
  });

  it('waits for selector', () => {
    const tab = deps.tabManager.createTab();
    const result = callRoute(registry, 'nightmare_wait_for', { id: tab.id }, { selector: '.loaded', timeout: 5000 });
    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>).timeout).toBe(5000);
  });

  it('queries DOM', () => {
    const tab = deps.tabManager.createTab();
    const result = callRoute(registry, 'nightmare_query_dom', { id: tab.id }, { selector: 'div.main', action: 'text' });
    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>).selector).toBe('div.main');
    expect((result.body as Record<string, unknown>).action).toBe('text');
  });
});

describe('System Routes', () => {
  let registry: RouteRegistry;
  let deps: RouteDependencies;

  beforeEach(() => {
    registry = new RouteRegistry();
    deps = makeDeps();
    registerAllRoutes(registry, deps);
  });

  it('registers nightmare_shutdown', () => {
    expect(registry.findByMcpName('nightmare_shutdown')).toBeDefined();
  });

  it('shuts down', () => {
    const result = callRoute(registry, 'nightmare_shutdown', {}, {});
    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>).shutting_down).toBe(true);
  });

  it('relaunches', () => {
    const result = callRoute(registry, 'nightmare_relaunch', {}, {});
    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>).relaunching).toBe(true);
  });
});

describe('Route Registration Completeness', () => {
  it('registers all expected MCP tools', () => {
    const registry = new RouteRegistry();
    const deps = makeDeps();
    registerAllRoutes(registry, deps);
    const defs = registry.getDefinitions();
    const mcpNames = defs.map((d) => d.mcpName);

    const expected = [
      'nightmare_create_tab', 'nightmare_list_tabs', 'nightmare_get_tab',
      'nightmare_close_tab', 'nightmare_navigate', 'nightmare_reload',
      'nightmare_go_back', 'nightmare_go_forward', 'nightmare_get_console',
      'nightmare_get_state', 'nightmare_activate_tab', 'nightmare_duplicate_tab',
      'nightmare_pin_tab', 'nightmare_mute_tab', 'nightmare_zoom',
      'nightmare_find_in_page', 'nightmare_execute_js', 'nightmare_screenshot',
      'nightmare_get_html', 'nightmare_click', 'nightmare_type_text',
      'nightmare_wait_for', 'nightmare_query_dom', 'nightmare_shutdown',
      'nightmare_relaunch',
    ];

    for (const name of expected) {
      expect(mcpNames).toContain(name);
    }
    expect(defs.length).toBe(expected.length);
  });
});
