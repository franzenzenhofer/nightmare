import { describe, it, expect } from 'vitest';
import {
  generateOpenApiSpec,
  classifyTag,
  convertPathToOpenApi,
  buildPathParams,
  buildRequestBody,
  buildOperation,
} from '../services/openapi-spec';
import type { OpenApiSpec } from '../services/openapi-spec';
import { ROUTE_METADATA } from '../services/openapi-routes';

describe('generateOpenApiSpec', () => {
  let spec: OpenApiSpec;

  // Generate once for all tests in this describe
  spec = generateOpenApiSpec();

  it('returns OpenAPI version 3.1.0', () => {
    expect(spec.openapi).toBe('3.1.0');
  });

  it('has correct info section', () => {
    expect(spec.info.title).toBe('Nightmare Browser API');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.info.description).toContain('AI-first');
  });

  it('has localhost:6660 server', () => {
    expect(spec.servers).toHaveLength(1);
    expect(spec.servers[0]?.url).toBe('http://localhost:6660');
  });

  it('includes all routes as paths', () => {
    const uniquePaths = new Set(
      ROUTE_METADATA.map((r) => convertPathToOpenApi(r.path)),
    );
    const specPaths = Object.keys(spec.paths);
    for (const p of uniquePaths) {
      expect(specPaths).toContain(p);
    }
  });

  it('groups GET and DELETE on same path into one path object', () => {
    const tabPath = spec.paths['/api/tabs/{id}'];
    expect(tabPath).toBeDefined();
    expect(tabPath?.get).toBeDefined();
    expect(tabPath?.delete).toBeDefined();
  });

  it('includes tags array with expected categories', () => {
    const tagNames = spec.tags.map((t) => t.name);
    expect(tagNames).toContain('tabs');
    expect(tagNames).toContain('navigation');
    expect(tagNames).toContain('console');
    expect(tagNames).toContain('webview');
    expect(tagNames).toContain('state');
    expect(tagNames).toContain('system');
  });

  it('each tag has a description', () => {
    for (const tag of spec.tags) {
      expect(tag.description.length).toBeGreaterThan(0);
    }
  });

  it('every operation has operationId, summary, tags, and responses', () => {
    for (const pathItem of Object.values(spec.paths)) {
      for (const op of Object.values(pathItem as Record<string, Record<string, unknown>>)) {
        expect(op.operationId).toBeDefined();
        expect(op.summary).toBeDefined();
        expect(op.tags).toBeDefined();
        expect(op.responses).toBeDefined();
      }
    }
  });

  it('produces a path entry for POST /api/tabs', () => {
    const tabsPath = spec.paths['/api/tabs'];
    expect(tabsPath?.post).toBeDefined();
    const post = tabsPath?.post as Record<string, unknown>;
    expect(post.operationId).toBe('nightmare_create_tab');
  });

  it('produces a path entry for GET /api/state', () => {
    const statePath = spec.paths['/api/state'];
    expect(statePath?.get).toBeDefined();
    const get = statePath?.get as Record<string, unknown>;
    expect(get.operationId).toBe('nightmare_get_state');
  });
});

describe('classifyTag', () => {
  it('classifies shutdown as system', () => {
    expect(classifyTag('/api/shutdown', 'nightmare_shutdown')).toBe('system');
  });

  it('classifies relaunch as system', () => {
    expect(classifyTag('/api/relaunch', 'nightmare_relaunch')).toBe('system');
  });

  it('classifies execute as webview', () => {
    expect(classifyTag('/api/tabs/:id/execute', 'nightmare_execute_js')).toBe('webview');
  });

  it('classifies screenshot as webview', () => {
    expect(classifyTag('/api/tabs/:id/screenshot', 'nightmare_screenshot')).toBe('webview');
  });

  it('classifies get_html as webview', () => {
    expect(classifyTag('/api/tabs/:id/html', 'nightmare_get_html')).toBe('webview');
  });

  it('classifies click as webview', () => {
    expect(classifyTag('/api/tabs/:id/click', 'nightmare_click')).toBe('webview');
  });

  it('classifies type_text as webview', () => {
    expect(classifyTag('/api/tabs/:id/type', 'nightmare_type_text')).toBe('webview');
  });

  it('classifies wait_for as webview', () => {
    expect(classifyTag('/api/tabs/:id/wait-for', 'nightmare_wait_for')).toBe('webview');
  });

  it('classifies query_dom as webview', () => {
    expect(classifyTag('/api/tabs/:id/query', 'nightmare_query_dom')).toBe('webview');
  });

  it('classifies console as console', () => {
    expect(classifyTag('/api/tabs/:id/console', 'nightmare_get_console')).toBe('console');
  });

  it('classifies /api/state as state', () => {
    expect(classifyTag('/api/state', 'nightmare_get_state')).toBe('state');
  });

  it('classifies navigate as navigation', () => {
    expect(classifyTag('/api/tabs/:id/navigate', 'nightmare_navigate')).toBe('navigation');
  });

  it('classifies go_back as navigation', () => {
    expect(classifyTag('/api/tabs/:id/back', 'nightmare_go_back')).toBe('navigation');
  });

  it('classifies go_forward as navigation', () => {
    expect(classifyTag('/api/tabs/:id/forward', 'nightmare_go_forward')).toBe('navigation');
  });

  it('classifies reload as navigation', () => {
    expect(classifyTag('/api/tabs/:id/reload', 'nightmare_reload')).toBe('navigation');
  });

  it('classifies tab operations as tabs', () => {
    expect(classifyTag('/api/tabs', 'nightmare_create_tab')).toBe('tabs');
    expect(classifyTag('/api/tabs', 'nightmare_list_tabs')).toBe('tabs');
    expect(classifyTag('/api/tabs/:id', 'nightmare_get_tab')).toBe('tabs');
    expect(classifyTag('/api/tabs/:id', 'nightmare_close_tab')).toBe('tabs');
    expect(classifyTag('/api/tabs/:id/pin', 'nightmare_pin_tab')).toBe('tabs');
  });
});

describe('convertPathToOpenApi', () => {
  it('converts :param to {param}', () => {
    expect(convertPathToOpenApi('/api/tabs/:id')).toBe('/api/tabs/{id}');
  });

  it('handles multiple params', () => {
    expect(convertPathToOpenApi('/api/:a/:b')).toBe('/api/{a}/{b}');
  });

  it('returns path unchanged when no params', () => {
    expect(convertPathToOpenApi('/api/state')).toBe('/api/state');
  });
});

describe('buildPathParams', () => {
  it('returns empty array for path without params', () => {
    expect(buildPathParams('/api/state')).toEqual([]);
  });

  it('extracts single param', () => {
    const params = buildPathParams('/api/tabs/:id');
    expect(params).toHaveLength(1);
    expect(params[0]).toEqual({
      name: 'id', in: 'path', required: true, schema: { type: 'string' },
    });
  });

  it('extracts multiple params', () => {
    const params = buildPathParams('/api/:foo/:bar');
    expect(params).toHaveLength(2);
    expect(params[0]?.name).toBe('foo');
    expect(params[1]?.name).toBe('bar');
  });
});

describe('buildRequestBody', () => {
  it('returns undefined for GET method', () => {
    const schema = { type: 'object', properties: { x: { type: 'string' } } };
    expect(buildRequestBody(schema, 'GET')).toBeUndefined();
  });

  it('returns undefined for DELETE method', () => {
    const schema = { type: 'object', properties: { x: { type: 'string' } } };
    expect(buildRequestBody(schema, 'DELETE')).toBeUndefined();
  });

  it('returns undefined when properties is empty', () => {
    const schema = { type: 'object', properties: {} };
    expect(buildRequestBody(schema, 'POST')).toBeUndefined();
  });

  it('returns undefined when only tabId property exists', () => {
    const schema = {
      type: 'object',
      properties: { tabId: { type: 'string' } },
      required: ['tabId'],
    };
    expect(buildRequestBody(schema, 'POST')).toBeUndefined();
  });

  it('excludes tabId from body properties', () => {
    const schema = {
      type: 'object',
      properties: { tabId: { type: 'string' }, url: { type: 'string' } },
      required: ['tabId', 'url'],
    };
    const result = buildRequestBody(schema, 'POST');
    expect(result).toBeDefined();
    const content = result?.content as Record<string, Record<string, Record<string, unknown>>>;
    const bodySchema = content['application/json']?.schema;
    const props = bodySchema?.properties as Record<string, unknown>;
    expect(props.url).toBeDefined();
    expect(props.tabId).toBeUndefined();
  });

  it('filters tabId from required array', () => {
    const schema = {
      type: 'object',
      properties: { tabId: { type: 'string' }, url: { type: 'string' } },
      required: ['tabId', 'url'],
    };
    const result = buildRequestBody(schema, 'POST');
    const content = result?.content as Record<string, Record<string, Record<string, unknown>>>;
    const bodySchema = content['application/json']?.schema;
    expect(bodySchema?.required).toEqual(['url']);
  });

  it('omits required when no required fields remain after filtering', () => {
    const schema = {
      type: 'object',
      properties: { tabId: { type: 'string' }, url: { type: 'string' } },
      required: ['tabId'],
    };
    const result = buildRequestBody(schema, 'POST');
    const content = result?.content as Record<string, Record<string, Record<string, unknown>>>;
    const bodySchema = content['application/json']?.schema;
    expect(bodySchema?.required).toBeUndefined();
  });

  it('handles schema without required field', () => {
    const schema = {
      type: 'object',
      properties: { url: { type: 'string' } },
    };
    const result = buildRequestBody(schema, 'POST');
    expect(result).toBeDefined();
    const content = result?.content as Record<string, Record<string, Record<string, unknown>>>;
    const bodySchema = content['application/json']?.schema;
    expect(bodySchema?.required).toBeUndefined();
  });

  it('returns undefined when properties key is missing', () => {
    const schema = { type: 'object' };
    expect(buildRequestBody(schema, 'POST')).toBeUndefined();
  });
});

describe('buildOperation', () => {
  it('includes operationId from mcpName', () => {
    const route = {
      method: 'GET', path: '/api/state',
      mcpName: 'nightmare_get_state', description: 'Get state',
      inputSchema: { type: 'object', properties: {} },
    };
    const op = buildOperation(route);
    expect(op.operationId).toBe('nightmare_get_state');
  });

  it('includes summary from description', () => {
    const route = {
      method: 'GET', path: '/api/state',
      mcpName: 'nightmare_get_state', description: 'Full browser state',
      inputSchema: { type: 'object', properties: {} },
    };
    const op = buildOperation(route);
    expect(op.summary).toBe('Full browser state');
  });

  it('includes path parameters when path has params', () => {
    const route = {
      method: 'GET', path: '/api/tabs/:id',
      mcpName: 'nightmare_get_tab', description: 'Get tab',
      inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
    };
    const op = buildOperation(route);
    expect(op.parameters).toBeDefined();
  });

  it('omits parameters when path has no params', () => {
    const route = {
      method: 'GET', path: '/api/state',
      mcpName: 'nightmare_get_state', description: 'Get state',
      inputSchema: { type: 'object', properties: {} },
    };
    const op = buildOperation(route);
    expect(op.parameters).toBeUndefined();
  });

  it('includes requestBody for POST with body properties', () => {
    const route = {
      method: 'POST', path: '/api/tabs',
      mcpName: 'nightmare_create_tab', description: 'Create tab',
      inputSchema: { type: 'object', properties: { url: { type: 'string' } } },
    };
    const op = buildOperation(route);
    expect(op.requestBody).toBeDefined();
  });

  it('omits requestBody for GET', () => {
    const route = {
      method: 'GET', path: '/api/tabs',
      mcpName: 'nightmare_list_tabs', description: 'List tabs',
      inputSchema: { type: 'object', properties: {} },
    };
    const op = buildOperation(route);
    expect(op.requestBody).toBeUndefined();
  });
});
