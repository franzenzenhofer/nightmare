import { describe, it, expect, beforeEach } from 'vitest';
import { TabManager } from '../services/tab-manager';

let tm: TabManager;
beforeEach(() => {
  tm = new TabManager();
});

describe('TabManager', () => {
  describe('createTab', () => {
    it('creates a tab with correct defaults', () => {
      const tab = tm.createTab('file:///app/index.html');
      expect(tab.title).toBe('New Tab');
      expect(tab.loading).toBe(true);
      expect(tab.zone).toBe('LOCAL');
      expect(tab.pinned).toBe(false);
    });

    it('defaults url to nightmare://newtab', () => {
      const tab = tm.createTab();
      expect(tab.url).toBe('nightmare://newtab');
    });

    it('activates the newly created tab', () => {
      const tab = tm.createTab('file:///a.html');
      expect(tm.getActiveTab()?.id).toBe(tab.id);
    });

    it('increments tab count', () => {
      tm.createTab();
      tm.createTab();
      expect(tm.getTabCount()).toBe(2);
    });
  });

  describe('closeTab', () => {
    it('removes the tab', () => {
      const tab = tm.createTab('file:///a.html');
      const tab2 = tm.createTab('file:///b.html');
      tm.closeTab(tab.id);
      expect(tm.getTabCount()).toBe(1);
      expect(tm.getAllTabs()[0]?.id).toBe(tab2.id);
    });

    it('always has at least one tab after close', () => {
      const tab = tm.createTab();
      tm.closeTab(tab.id);
      expect(tm.getTabCount()).toBe(1);
    });

    it('cannot close pinned tabs', () => {
      const tab = tm.createTab();
      tm.pinTab(tab.id);
      tm.closeTab(tab.id);
      expect(tm.getTabCount()).toBe(1);
      expect(tm.getActiveTab()?.id).toBe(tab.id);
    });

    it('activates adjacent tab when active tab is closed', () => {
      const tab1 = tm.createTab('file:///a.html');
      const tab2 = tm.createTab('file:///b.html');
      tm.activateTab(tab2.id);
      tm.closeTab(tab2.id);
      expect(tm.getActiveTab()?.id).toBe(tab1.id);
    });

    it('does nothing for non-existent tab id', () => {
      tm.createTab();
      const count = tm.getTabCount();
      tm.closeTab('nonexistent-id');
      expect(tm.getTabCount()).toBe(count);
    });
  });

  describe('activateTab', () => {
    it('switches active tab', () => {
      const tab1 = tm.createTab('file:///a.html');
      const tab2 = tm.createTab('file:///b.html');
      tm.activateTab(tab1.id);
      expect(tm.getActiveTab()?.id).toBe(tab1.id);
    });

    it('ignores non-existent tab id', () => {
      const tab = tm.createTab();
      tm.activateTab('nonexistent');
      expect(tm.getActiveTab()?.id).toBe(tab.id);
    });
  });

  describe('duplicateTab', () => {
    it('duplicates a tab with same url', () => {
      const tab = tm.createTab('http://localhost:3000');
      const dupe = tm.duplicateTab(tab.id);
      expect(dupe).not.toBeNull();
      expect(dupe?.url).toBe('http://localhost:3000');
      expect(dupe?.id).not.toBe(tab.id);
      expect(tm.getTabCount()).toBe(2);
    });

    it('returns null for non-existent tab', () => {
      expect(tm.duplicateTab('nonexistent')).toBeNull();
    });
  });

  describe('pinTab', () => {
    it('toggles pinned state', () => {
      const tab = tm.createTab();
      expect(tab.pinned).toBe(false);
      tm.pinTab(tab.id);
      expect(tm.getActiveTab()?.pinned).toBe(true);
      tm.pinTab(tab.id);
      expect(tm.getActiveTab()?.pinned).toBe(false);
    });

    it('ignores non-existent tab', () => {
      tm.createTab();
      tm.pinTab('nonexistent');
      expect(tm.getActiveTab()?.pinned).toBe(false);
    });
  });

  describe('updateTabFromWebview', () => {
    it('updates tab properties', () => {
      const tab = tm.createTab('file:///a.html');
      tm.updateTabFromWebview(tab.id, { title: 'My App', loading: false });
      const updated = tm.getActiveTab();
      expect(updated?.title).toBe('My App');
      expect(updated?.loading).toBe(false);
    });

    it('reclassifies zone when URL changes', () => {
      const tab = tm.createTab('file:///local.html');
      expect(tab.zone).toBe('LOCAL');
      tm.updateTabFromWebview(tab.id, { url: 'https://google.com' });
      expect(tm.getAllTabs()[0]?.zone).toBe('WEB');
    });

    it('ignores non-existent tab', () => {
      tm.createTab();
      tm.updateTabFromWebview('nonexistent', { title: 'Nope' });
      expect(tm.getActiveTab()?.title).toBe('New Tab');
    });
  });

  describe('getActiveTab', () => {
    it('returns null when no tabs exist initially', () => {
      const fresh = new TabManager();
      expect(fresh.getActiveTab()).toBeNull();
    });

    it('returns the active tab', () => {
      const tab = tm.createTab();
      expect(tm.getActiveTab()?.id).toBe(tab.id);
    });
  });

  describe('getAllTabs', () => {
    it('returns all tabs in order', () => {
      const t1 = tm.createTab('file:///a.html');
      const t2 = tm.createTab('file:///b.html');
      const all = tm.getAllTabs();
      expect(all).toHaveLength(2);
      expect(all[0]?.id).toBe(t1.id);
      expect(all[1]?.id).toBe(t2.id);
    });

    it('returns empty array when no tabs', () => {
      expect(new TabManager().getAllTabs()).toHaveLength(0);
    });
  });

  describe('getTab', () => {
    it('returns a specific tab by id', () => {
      const tab = tm.createTab('http://localhost:3000');
      expect(tm.getTab(tab.id)?.url).toBe('http://localhost:3000');
    });

    it('returns null for non-existent id', () => {
      expect(tm.getTab('nonexistent')).toBeNull();
    });
  });

  describe('hasTab', () => {
    it('returns true for existing tab', () => {
      const tab = tm.createTab('file:///a.html');
      expect(tm.hasTab(tab.id)).toBe(true);
    });

    it('returns false for non-existent tab', () => {
      expect(tm.hasTab('nonexistent')).toBe(false);
    });
  });

  describe('createTab with openerId', () => {
    it('passes openerId through to the tab', () => {
      const parent = tm.createTab('file:///a.html');
      const child = tm.createTab('file:///b.html', parent.id);
      expect(child.openerId).toBe(parent.id);
    });

    it('sets openerId to undefined when not provided', () => {
      const tab = tm.createTab('file:///a.html');
      expect(tab.openerId).toBeUndefined();
    });
  });
});
