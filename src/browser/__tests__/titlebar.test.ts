import { describe, it, expect } from 'vitest';
import { getWindowTitle } from '../components/titlebar';
import type { Tab } from '../services/tab';

function makeTab(overrides: Partial<Tab>): Tab {
  return {
    id: 'tab-1',
    url: 'https://example.com',
    title: '',
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

describe('getWindowTitle', () => {
  it('returns "Nightmare" when no tab', () => {
    expect(getWindowTitle(undefined)).toBe('Nightmare');
  });

  it('returns "title - Nightmare" when tab has title', () => {
    const tab = makeTab({ title: 'Google' });
    expect(getWindowTitle(tab)).toBe('Google - Nightmare');
  });

  it('returns "url - Nightmare" when tab has no title', () => {
    const tab = makeTab({ title: '', url: 'https://example.com' });
    expect(getWindowTitle(tab)).toBe('https://example.com - Nightmare');
  });

  it('uses title over url when both present', () => {
    const tab = makeTab({ title: 'My Page', url: 'https://mypage.com' });
    expect(getWindowTitle(tab)).toBe('My Page - Nightmare');
  });

  it('handles tab with empty title and empty url', () => {
    const tab = makeTab({ title: '', url: '' });
    expect(getWindowTitle(tab)).toBe('Nightmare');
  });

  it('trims whitespace from title', () => {
    const tab = makeTab({ title: '  Spaced  ' });
    expect(getWindowTitle(tab)).toBe('Spaced - Nightmare');
  });

  it('falls back to url when title is only whitespace', () => {
    const tab = makeTab({ title: '   ', url: 'https://test.dev' });
    expect(getWindowTitle(tab)).toBe('https://test.dev - Nightmare');
  });
});
