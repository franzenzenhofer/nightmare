import { describe, it, expect, beforeEach } from 'vitest';
import { BrowserOrchestrator } from '../browser-orchestrator';

let browser: BrowserOrchestrator;

beforeEach(() => {
  browser = new BrowserOrchestrator({ apiPort: 0 });
});

describe('BrowserOrchestrator', () => {
  it('initializes with default state', () => {
    const state = browser.getState();
    expect(state.tabCount).toBe(0);
    expect(state.tabs).toHaveLength(0);
    expect(state.activeTabId).toBeNull();
  });

  it('creates a tab and updates state', () => {
    const tab = browser.createTab('https://example.com');
    expect(tab.url).toBe('https://example.com');
    const state = browser.getState();
    expect(state.tabCount).toBe(1);
    expect(state.activeTabId).toBe(tab.id);
  });

  it('closes a tab', () => {
    const t1 = browser.createTab('https://a.com');
    browser.createTab('https://b.com');
    browser.closeTab(t1.id);
    expect(browser.getState().tabCount).toBe(1);
  });

  it('navigates a tab', () => {
    const tab = browser.createTab('https://old.com');
    browser.navigate(tab.id, 'https://new.com');
    expect(browser.getTab(tab.id)?.url).toBe('https://new.com');
  });

  it('returns full state snapshot', () => {
    browser.createTab('https://x.com');
    const state = browser.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabCount).toBe(1);
    expect(state.activeTabId).toBeDefined();
  });

  it('exposes tab manager', () => {
    expect(browser.tabManager).toBeDefined();
  });

  it('exposes event bus', () => {
    expect(browser.eventBus).toBeDefined();
  });

  it('exposes console capture', () => {
    expect(browser.consoleCapture).toBeDefined();
  });

  it('handles keyboard shortcut via handleShortcut', () => {
    const shortcuts = browser.getShortcuts();
    let called = false;
    shortcuts.register('Ctrl+T', 'new-tab', () => { called = true; });
    const matched = browser.handleShortcut('T', { ctrl: true });
    expect(matched).toBe(true);
    expect(called).toBe(true);
  });

  it('returns false for unmatched shortcut', () => {
    const matched = browser.handleShortcut('z', {});
    expect(matched).toBe(false);
  });

  it('provides downloads manager', () => {
    expect(browser.downloads).toBeDefined();
  });

  it('provides settings manager access', () => {
    expect(browser.settings).toBeDefined();
  });

  it('returns configured API port', () => {
    const b = new BrowserOrchestrator({ apiPort: 7777 });
    expect(b.getApiPort()).toBe(7777);
  });
});
