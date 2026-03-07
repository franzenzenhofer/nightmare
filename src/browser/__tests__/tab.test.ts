import { describe, it, expect } from 'vitest';
import { createTab } from '../services/tab';
import type { Tab } from '../services/tab';

describe('createTab', () => {
  it('creates a tab with a unique id', () => {
    const tab = createTab('file:///app/index.html');
    expect(tab.id).toBeDefined();
    expect(tab.id.length).toBeGreaterThan(0);
  });

  it('sets the url from argument', () => {
    const tab = createTab('http://localhost:3000');
    expect(tab.url).toBe('http://localhost:3000');
  });

  it('defaults to nightmare://newtab when no url given', () => {
    const tab = createTab();
    expect(tab.url).toBe('nightmare://newtab');
  });

  it('sets title to "New Tab"', () => {
    const tab = createTab('file:///app.html');
    expect(tab.title).toBe('New Tab');
  });

  it('sets favicon to null', () => {
    const tab = createTab('file:///app.html');
    expect(tab.favicon).toBeNull();
  });

  it('sets loading to true', () => {
    const tab = createTab('file:///app.html');
    expect(tab.loading).toBe(true);
  });

  it('sets canGoBack to false', () => {
    const tab = createTab();
    expect(tab.canGoBack).toBe(false);
  });

  it('sets canGoForward to false', () => {
    const tab = createTab();
    expect(tab.canGoForward).toBe(false);
  });

  it('classifies zone based on url', () => {
    expect(createTab('file:///app.html').zone).toBe('LOCAL');
    expect(createTab('http://localhost:3000').zone).toBe('LOCALHOST');
    expect(createTab('https://google.com').zone).toBe('WEB');
  });

  it('generates a webviewId from the tab id', () => {
    const tab = createTab();
    expect(tab.webviewId).toBe(`webview-${tab.id}`);
  });

  it('sets muted to false', () => {
    const tab = createTab();
    expect(tab.muted).toBe(false);
  });

  it('sets pinned to false', () => {
    const tab = createTab();
    expect(tab.pinned).toBe(false);
  });

  it('sets createdAt to a recent timestamp', () => {
    const before = Date.now();
    const tab = createTab();
    const after = Date.now();
    expect(tab.createdAt).toBeGreaterThanOrEqual(before);
    expect(tab.createdAt).toBeLessThanOrEqual(after);
  });

  it('generates unique ids for each tab', () => {
    const tab1 = createTab();
    const tab2 = createTab();
    expect(tab1.id).not.toBe(tab2.id);
  });
});
