import { describe, it, expect } from 'vitest';
import { getNavBarState } from '../components/nav-bar';
import type { Tab } from '../services/tab';
import type { NavBarState } from '../components/nav-bar';

function makeTab(overrides: Partial<Tab>): Tab {
  return {
    id: 'tab-1',
    url: 'https://example.com',
    title: 'Test',
    favicon: null,
    loading: false,
    canGoBack: false,
    canGoForward: false,
    zone: 'WEB' as const,
    webviewId: 'webview-tab-1',
    muted: false,
    pinned: false,
    createdAt: 1000,
    ...overrides,
  };
}

describe('getNavBarState', () => {
  it('returns default state for undefined tab', () => {
    const state = getNavBarState(undefined);
    expect(state).toEqual({
      canGoBack: false,
      canGoForward: false,
      isLoading: false,
      zoneDot: 'green',
      url: '',
    } satisfies NavBarState);
  });

  it('derives canGoBack from tab', () => {
    const state = getNavBarState(makeTab({ canGoBack: true }));
    expect(state.canGoBack).toBe(true);
  });

  it('derives canGoForward from tab', () => {
    const state = getNavBarState(makeTab({ canGoForward: true }));
    expect(state.canGoForward).toBe(true);
  });

  it('derives isLoading from tab', () => {
    const state = getNavBarState(makeTab({ loading: true }));
    expect(state.isLoading).toBe(true);
  });

  it('maps LOCAL zone to green dot', () => {
    const state = getNavBarState(makeTab({ zone: 'LOCAL' }));
    expect(state.zoneDot).toBe('green');
  });

  it('maps LOCALHOST zone to blue dot', () => {
    const state = getNavBarState(makeTab({ zone: 'LOCALHOST' }));
    expect(state.zoneDot).toBe('blue');
  });

  it('maps WEB zone to red dot', () => {
    const state = getNavBarState(makeTab({ zone: 'WEB' }));
    expect(state.zoneDot).toBe('red');
  });

  it('derives url from tab', () => {
    const state = getNavBarState(makeTab({ url: 'https://test.dev' }));
    expect(state.url).toBe('https://test.dev');
  });

  it('returns all fields for a fully populated tab', () => {
    const tab = makeTab({
      canGoBack: true,
      canGoForward: true,
      loading: true,
      zone: 'LOCALHOST',
      url: 'http://localhost:3000',
    });
    const state = getNavBarState(tab);
    expect(state).toEqual({
      canGoBack: true,
      canGoForward: true,
      isLoading: true,
      zoneDot: 'blue',
      url: 'http://localhost:3000',
    } satisfies NavBarState);
  });
});
