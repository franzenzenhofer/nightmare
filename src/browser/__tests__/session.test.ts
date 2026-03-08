import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from '../services/session';
import { TabManager } from '../services/tab-manager';

let tabManager: TabManager;
let sessionManager: SessionManager;

beforeEach(() => {
  tabManager = new TabManager();
  sessionManager = new SessionManager();
});

describe('SessionManager', () => {
  describe('toJSON', () => {
    it('serializes an empty tab manager to a valid session', () => {
      const json = sessionManager.toJSON(tabManager);
      expect(json.version).toBe(1);
      expect(json.tabs).toHaveLength(0);
      expect(json.activeTabId).toBeNull();
      expect(typeof json.savedAt).toBe('number');
    });

    it('serializes tabs with url, title, and pinned state', () => {
      const tab = tabManager.createTab('https://example.com');
      tabManager.updateTabFromWebview(tab.id, {
        title: 'Example',
        loading: false,
      });

      const json = sessionManager.toJSON(tabManager);
      expect(json.tabs).toHaveLength(1);
      expect(json.tabs[0]?.url).toBe('https://example.com');
      expect(json.tabs[0]?.title).toBe('Example');
      expect(json.tabs[0]?.pinned).toBe(false);
    });

    it('records which tab is active', () => {
      const tab1 = tabManager.createTab('file:///a.html');
      tabManager.createTab('file:///b.html');
      tabManager.activateTab(tab1.id);

      const json = sessionManager.toJSON(tabManager);
      expect(json.activeTabIndex).toBe(0);
    });

    it('serializes pinned tabs correctly', () => {
      const tab = tabManager.createTab('file:///a.html');
      tabManager.pinTab(tab.id);

      const json = sessionManager.toJSON(tabManager);
      expect(json.tabs[0]?.pinned).toBe(true);
    });

    it('serializes multiple tabs in order', () => {
      tabManager.createTab('file:///first.html');
      tabManager.createTab('http://localhost:3000');
      tabManager.createTab('https://web.dev');

      const json = sessionManager.toJSON(tabManager);
      expect(json.tabs).toHaveLength(3);
      expect(json.tabs[0]?.url).toBe('file:///first.html');
      expect(json.tabs[1]?.url).toBe('http://localhost:3000');
      expect(json.tabs[2]?.url).toBe('https://web.dev');
    });

    it('does not include transient state like loading or canGoBack', () => {
      tabManager.createTab('https://example.com');
      const json = sessionManager.toJSON(tabManager);
      const tabData = json.tabs[0];
      expect(tabData).toBeDefined();
      expect('loading' in (tabData ?? {})).toBe(false);
      expect('canGoBack' in (tabData ?? {})).toBe(false);
      expect('canGoForward' in (tabData ?? {})).toBe(false);
    });
  });

  describe('fromJSON', () => {
    it('restores tabs into a new tab manager', () => {
      tabManager.createTab('file:///a.html');
      tabManager.createTab('https://example.com');
      const json = sessionManager.toJSON(tabManager);

      const restored = new TabManager();
      sessionManager.fromJSON(json, restored);

      expect(restored.getTabCount()).toBe(2);
      const allTabs = restored.getAllTabs();
      expect(allTabs[0]?.url).toBe('file:///a.html');
      expect(allTabs[1]?.url).toBe('https://example.com');
    });

    it('restores tab titles', () => {
      const tab = tabManager.createTab('https://example.com');
      tabManager.updateTabFromWebview(tab.id, { title: 'My Page' });
      const json = sessionManager.toJSON(tabManager);

      const restored = new TabManager();
      sessionManager.fromJSON(json, restored);

      expect(restored.getAllTabs()[0]?.title).toBe('My Page');
    });

    it('restores active tab by index', () => {
      tabManager.createTab('file:///a.html');
      const tab2 = tabManager.createTab('file:///b.html');
      tabManager.activateTab(tab2.id);

      const json = sessionManager.toJSON(tabManager);
      const restored = new TabManager();
      sessionManager.fromJSON(json, restored);

      expect(restored.getActiveTab()?.url).toBe('file:///b.html');
    });

    it('restores pinned state', () => {
      const tab = tabManager.createTab('file:///a.html');
      tabManager.pinTab(tab.id);
      const json = sessionManager.toJSON(tabManager);

      const restored = new TabManager();
      sessionManager.fromJSON(json, restored);

      expect(restored.getAllTabs()[0]?.pinned).toBe(true);
    });

    it('creates a default tab when session has no tabs', () => {
      const json = sessionManager.toJSON(tabManager);
      expect(json.tabs).toHaveLength(0);

      const restored = new TabManager();
      sessionManager.fromJSON(json, restored);

      expect(restored.getTabCount()).toBe(1);
      expect(restored.getActiveTab()?.url).toBe('nightmare://newtab');
    });

    it('activates first tab when activeTabIndex is out of bounds', () => {
      tabManager.createTab('file:///a.html');
      const json = sessionManager.toJSON(tabManager);
      json.activeTabIndex = 99;

      const restored = new TabManager();
      sessionManager.fromJSON(json, restored);

      expect(restored.getActiveTab()?.url).toBe('file:///a.html');
    });
  });

  describe('roundtrip', () => {
    it('preserves session data through serialize/deserialize cycle', () => {
      tabManager.createTab('file:///local.html');
      const pinned = tabManager.createTab('http://localhost:8080');
      tabManager.pinTab(pinned.id);
      tabManager.createTab('https://google.com');
      tabManager.updateTabFromWebview(pinned.id, {
        title: 'Dev Server',
      });

      const json = sessionManager.toJSON(tabManager);
      const jsonString = JSON.stringify(json);
      const parsed = JSON.parse(jsonString) as ReturnType<
        SessionManager['toJSON']
      >;

      const restored = new TabManager();
      sessionManager.fromJSON(parsed, restored);

      expect(restored.getTabCount()).toBe(3);
      const tabs = restored.getAllTabs();
      expect(tabs[0]?.url).toBe('file:///local.html');
      expect(tabs[1]?.url).toBe('http://localhost:8080');
      expect(tabs[1]?.title).toBe('Dev Server');
      expect(tabs[1]?.pinned).toBe(true);
      expect(tabs[2]?.url).toBe('https://google.com');
    });

    it('handles JSON.stringify/parse without data loss', () => {
      tabManager.createTab('https://example.com');
      const json = sessionManager.toJSON(tabManager);
      const raw = JSON.stringify(json);
      const parsed = JSON.parse(raw) as typeof json;

      expect(parsed.version).toBe(json.version);
      expect(parsed.tabs).toEqual(json.tabs);
      expect(parsed.savedAt).toBe(json.savedAt);
      expect(parsed.activeTabIndex).toBe(json.activeTabIndex);
    });
  });

  describe('edge cases', () => {
    it('handles session with only nightmare://newtab tabs', () => {
      tabManager.createTab();
      const json = sessionManager.toJSON(tabManager);

      const restored = new TabManager();
      sessionManager.fromJSON(json, restored);

      expect(restored.getTabCount()).toBe(1);
      expect(restored.getAllTabs()[0]?.url).toBe('nightmare://newtab');
    });

    it('assigns fresh ids to restored tabs', () => {
      const original = tabManager.createTab('file:///a.html');
      const json = sessionManager.toJSON(tabManager);

      const restored = new TabManager();
      sessionManager.fromJSON(json, restored);

      expect(restored.getAllTabs()[0]?.id).not.toBe(original.id);
    });

    it('reclassifies security zones on restore', () => {
      tabManager.createTab('file:///local.html');
      tabManager.createTab('https://web.dev');
      const json = sessionManager.toJSON(tabManager);

      const restored = new TabManager();
      sessionManager.fromJSON(json, restored);

      expect(restored.getAllTabs()[0]?.zone).toBe('LOCAL');
      expect(restored.getAllTabs()[1]?.zone).toBe('WEB');
    });
  });
});
