import { describe, it, expect, beforeEach } from 'vitest';
import { getString, getNumber, resolveTabId, notFound, withTab } from '../api/route-helpers';
import type { RouteDependencies } from '../api/route-helpers';
import type { RouteParams } from '../api/route-registry';
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

function makeParams(pathParams: Record<string, string>, body: Record<string, unknown>): RouteParams {
  return { pathParams, body };
}

describe('getString', () => {
  it('returns string value when key exists', () => {
    expect(getString({ name: 'hello' }, 'name')).toBe('hello');
  });

  it('returns empty string when key is missing', () => {
    expect(getString({}, 'name')).toBe('');
  });

  it('returns empty string when value is not a string', () => {
    expect(getString({ count: 42 }, 'count')).toBe('');
    expect(getString({ flag: true }, 'flag')).toBe('');
    expect(getString({ obj: null }, 'obj')).toBe('');
  });
});

describe('getNumber', () => {
  it('returns number value when key exists', () => {
    expect(getNumber({ level: 1.5 }, 'level')).toBe(1.5);
  });

  it('returns 0 when key is missing', () => {
    expect(getNumber({}, 'level')).toBe(0);
  });

  it('returns 0 when value is not a number', () => {
    expect(getNumber({ level: 'high' }, 'level')).toBe(0);
    expect(getNumber({ level: null }, 'level')).toBe(0);
  });
});

describe('resolveTabId', () => {
  it('returns path param id when present', () => {
    const p = makeParams({ id: 'tab-1' }, {});
    expect(resolveTabId(p)).toBe('tab-1');
  });

  it('falls back to body tabId when path param missing', () => {
    const p = makeParams({}, { tabId: 'tab-2' });
    expect(resolveTabId(p)).toBe('tab-2');
  });

  it('returns empty string when neither present', () => {
    const p = makeParams({}, {});
    expect(resolveTabId(p)).toBe('');
  });

  it('prefers path param over body', () => {
    const p = makeParams({ id: 'path-id' }, { tabId: 'body-id' });
    expect(resolveTabId(p)).toBe('path-id');
  });
});

describe('notFound', () => {
  it('returns 404 with error message', () => {
    const result = notFound();
    expect(result.status).toBe(404);
    expect(result.body).toEqual({ error: 'Tab not found' });
  });
});

describe('withTab', () => {
  let deps: RouteDependencies;

  beforeEach(() => {
    deps = makeDeps();
  });

  it('calls fn with tab id when tab exists', () => {
    const tab = deps.tabManager.createTab('https://example.com');
    const p = makeParams({ id: tab.id }, {});
    const result = withTab(deps, p, (id) => ({ status: 200, body: { tabId: id } }));
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ tabId: tab.id });
  });

  it('returns 404 when tab not found', () => {
    const p = makeParams({ id: 'nonexistent' }, {});
    const result = withTab(deps, p, () => ({ status: 200, body: {} }));
    expect(result.status).toBe(404);
  });
});
