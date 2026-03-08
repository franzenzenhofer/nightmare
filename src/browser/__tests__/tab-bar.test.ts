import { describe, it, expect } from 'vitest';
import { getDisplayOrder, reorder, getCloseTarget } from '../components/tab-bar';
import type { Tab } from '../services/tab';

function makeTab(overrides: Partial<Tab> & { id: string; createdAt: number }): Tab {
  return {
    url: 'https://example.com',
    title: 'Test',
    favicon: null,
    loading: false,
    canGoBack: false,
    canGoForward: false,
    zone: 'WEB' as const,
    webviewId: `webview-${overrides.id}`,
    muted: false,
    pinned: false,
    ...overrides,
  };
}

describe('getDisplayOrder', () => {
  it('sorts tabs by createdAt ascending', () => {
    const tabs = [
      makeTab({ id: 'b', createdAt: 200 }),
      makeTab({ id: 'a', createdAt: 100 }),
    ];
    const result = getDisplayOrder(tabs);
    expect(result.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('puts pinned tabs before unpinned', () => {
    const tabs = [
      makeTab({ id: 'unpinned', createdAt: 100, pinned: false }),
      makeTab({ id: 'pinned', createdAt: 200, pinned: true }),
    ];
    const result = getDisplayOrder(tabs);
    expect(result.map((t) => t.id)).toEqual(['pinned', 'unpinned']);
  });

  it('sorts pinned tabs among themselves by createdAt', () => {
    const tabs = [
      makeTab({ id: 'p2', createdAt: 300, pinned: true }),
      makeTab({ id: 'p1', createdAt: 100, pinned: true }),
      makeTab({ id: 'u1', createdAt: 200, pinned: false }),
    ];
    const result = getDisplayOrder(tabs);
    expect(result.map((t) => t.id)).toEqual(['p1', 'p2', 'u1']);
  });

  it('returns empty array for empty input', () => {
    expect(getDisplayOrder([])).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const tabs = [
      makeTab({ id: 'b', createdAt: 200 }),
      makeTab({ id: 'a', createdAt: 100 }),
    ];
    const original = [...tabs];
    getDisplayOrder(tabs);
    expect(tabs.map((t) => t.id)).toEqual(original.map((t) => t.id));
  });
});

describe('reorder', () => {
  it('moves a tab to a new position', () => {
    const tabs = [
      makeTab({ id: 'a', createdAt: 100 }),
      makeTab({ id: 'b', createdAt: 200 }),
      makeTab({ id: 'c', createdAt: 300 }),
    ];
    const result = reorder(tabs, 'a', 2);
    expect(result.map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('returns original order if tab not found', () => {
    const tabs = [makeTab({ id: 'a', createdAt: 100 })];
    const result = reorder(tabs, 'nonexistent', 0);
    expect(result.map((t) => t.id)).toEqual(['a']);
  });

  it('clamps newIndex to valid range', () => {
    const tabs = [
      makeTab({ id: 'a', createdAt: 100 }),
      makeTab({ id: 'b', createdAt: 200 }),
    ];
    const result = reorder(tabs, 'a', 99);
    expect(result.map((t) => t.id)).toEqual(['b', 'a']);
  });
});

describe('getCloseTarget', () => {
  it('returns next tab when closing active', () => {
    const tabs = [
      makeTab({ id: 'a', createdAt: 100 }),
      makeTab({ id: 'b', createdAt: 200 }),
      makeTab({ id: 'c', createdAt: 300 }),
    ];
    const target = getCloseTarget(tabs, 'b', 'b');
    expect(target).toBe('c');
  });

  it('returns previous tab when closing last in list', () => {
    const tabs = [
      makeTab({ id: 'a', createdAt: 100 }),
      makeTab({ id: 'b', createdAt: 200 }),
    ];
    const target = getCloseTarget(tabs, 'b', 'b');
    expect(target).toBe('a');
  });

  it('returns null when closing the only tab', () => {
    const tabs = [makeTab({ id: 'a', createdAt: 100 })];
    const target = getCloseTarget(tabs, 'a', 'a');
    expect(target).toBeNull();
  });

  it('returns activeId when closing a non-active tab', () => {
    const tabs = [
      makeTab({ id: 'a', createdAt: 100 }),
      makeTab({ id: 'b', createdAt: 200 }),
    ];
    const target = getCloseTarget(tabs, 'b', 'a');
    expect(target).toBe('a');
  });

  it('returns null if closingId not found', () => {
    const tabs = [makeTab({ id: 'a', createdAt: 100 })];
    const target = getCloseTarget(tabs, 'nonexistent', 'a');
    expect(target).toBeNull();
  });
});
