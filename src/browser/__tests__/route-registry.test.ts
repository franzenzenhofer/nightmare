import { describe, it, expect, beforeEach } from 'vitest';
import { RouteRegistry, extractPathParamNames } from '../api/route-registry';
import { registerAllRoutes } from '../api/route-definitions';
import { createRouteRegistry } from '../api/handlers';
import { TabManager } from '../services/tab-manager';
import { ConsoleCapture } from '../api/console-capture';
import { EventBus } from '../api/event-bus';

describe('RouteRegistry', () => {
  let registry: RouteRegistry;

  beforeEach(() => {
    registry = new RouteRegistry();
  });

  it('starts empty', () => {
    expect(registry.getDefinitions()).toHaveLength(0);
  });

  it('registers and retrieves a route definition', () => {
    registry.register({
      method: 'GET', path: '/api/test', mcpName: 'test_tool',
      description: 'Test tool', inputSchema: { type: 'object', properties: {} },
      handler: () => ({ status: 200, body: { ok: true } }),
    });
    expect(registry.getDefinitions()).toHaveLength(1);
  });

  it('finds by MCP name', () => {
    registry.register({
      method: 'GET', path: '/api/test', mcpName: 'test_tool',
      description: 'A test', inputSchema: { type: 'object', properties: {} },
      handler: () => ({ status: 200, body: null }),
    });
    const found = registry.findByMcpName('test_tool');
    expect(found?.mcpName).toBe('test_tool');
    expect(found?.method).toBe('GET');
  });

  it('returns undefined for unknown MCP name', () => {
    expect(registry.findByMcpName('nonexistent')).toBeUndefined();
  });

  it('finds by route method and path', () => {
    registry.register({
      method: 'POST', path: '/api/tabs', mcpName: 'create_tab',
      description: 'Create', inputSchema: { type: 'object', properties: {} },
      handler: () => ({ status: 201, body: null }),
    });
    const found = registry.findByRoute('POST', '/api/tabs');
    expect(found?.mcpName).toBe('create_tab');
  });

  it('returns undefined for unknown route', () => {
    expect(registry.findByRoute('GET', '/api/nothing')).toBeUndefined();
  });

  it('returns copies from getDefinitions', () => {
    registry.register({
      method: 'GET', path: '/api/x', mcpName: 'x',
      description: 'X', inputSchema: { type: 'object', properties: {} },
      handler: () => ({ status: 200, body: null }),
    });
    const a = registry.getDefinitions();
    const b = registry.getDefinitions();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe('extractPathParamNames', () => {
  it('extracts single param', () => {
    expect(extractPathParamNames('/api/tabs/:id')).toEqual(['id']);
  });

  it('extracts multiple params', () => {
    expect(extractPathParamNames('/api/:resource/:id')).toEqual(['resource', 'id']);
  });

  it('returns empty for no params', () => {
    expect(extractPathParamNames('/api/tabs')).toEqual([]);
  });

  it('handles root path', () => {
    expect(extractPathParamNames('/')).toEqual([]);
  });
});

describe('registerAllRoutes', () => {
  it('registers all 25 routes', () => {
    const registry = new RouteRegistry();
    const deps = {
      tabManager: new TabManager(),
      consoleCapture: new ConsoleCapture(),
      eventBus: new EventBus(),
    };
    registerAllRoutes(registry, deps);
    expect(registry.getDefinitions()).toHaveLength(25);
  });

  it('every route has required fields', () => {
    const registry = new RouteRegistry();
    const deps = {
      tabManager: new TabManager(),
      consoleCapture: new ConsoleCapture(),
      eventBus: new EventBus(),
    };
    registerAllRoutes(registry, deps);
    for (const def of registry.getDefinitions()) {
      expect(def.method).toBeDefined();
      expect(def.path).toBeDefined();
      expect(def.mcpName).toMatch(/^nightmare_/);
      expect(def.description.length).toBeGreaterThan(0);
      expect(def.inputSchema).toBeDefined();
      expect(typeof def.handler).toBe('function');
    }
  });

  it('each MCP name is unique', () => {
    const registry = new RouteRegistry();
    const deps = {
      tabManager: new TabManager(),
      consoleCapture: new ConsoleCapture(),
      eventBus: new EventBus(),
    };
    registerAllRoutes(registry, deps);
    const names = registry.getDefinitions().map((d) => d.mcpName);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('createRouteRegistry', () => {
  it('creates a populated registry from deps', () => {
    const registry = createRouteRegistry({
      tabManager: new TabManager(),
      consoleCapture: new ConsoleCapture(),
      eventBus: new EventBus(),
    });
    expect(registry.getDefinitions().length).toBeGreaterThan(0);
    expect(registry.findByMcpName('nightmare_create_tab')).toBeDefined();
  });
});
