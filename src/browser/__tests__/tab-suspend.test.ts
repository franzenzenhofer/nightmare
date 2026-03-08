import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabSuspendManager } from '../services/tab-suspend';
import { TabManager } from '../services/tab-manager';

let tabManager: TabManager;
let suspendManager: TabSuspendManager;

beforeEach(() => {
  vi.restoreAllMocks();
  tabManager = new TabManager();
  suspendManager = new TabSuspendManager(tabManager);
});

describe('TabSuspendManager', () => {
  describe('touchTab', () => {
    it('records last-active timestamp for a tab', () => {
      const tab = tabManager.createTab('file:///a.html');
      const before = Date.now();
      suspendManager.touchTab(tab.id);
      const ts = suspendManager.getLastActive(tab.id);
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(Date.now());
    });

    it('updates timestamp on repeated touch', () => {
      const tab = tabManager.createTab('file:///a.html');
      suspendManager.touchTab(tab.id);
      const first = suspendManager.getLastActive(tab.id);
      vi.spyOn(Date, 'now').mockReturnValue(first + 5000);
      suspendManager.touchTab(tab.id);
      expect(suspendManager.getLastActive(tab.id)).toBe(first + 5000);
    });

    it('returns 0 for unknown tab', () => {
      expect(suspendManager.getLastActive('unknown')).toBe(0);
    });
  });

  describe('suspendTab', () => {
    it('marks a tab as suspended and remembers url+title', () => {
      const tab = tabManager.createTab('https://example.com');
      tabManager.updateTabFromWebview(tab.id, { title: 'Example', loading: false });
      suspendManager.touchTab(tab.id);

      const result = suspendManager.suspendTab(tab.id);
      expect(result).toBe(true);
      expect(suspendManager.isSuspended(tab.id)).toBe(true);
    });

    it('stores correct suspended tab data', () => {
      const tab = tabManager.createTab('https://example.com');
      tabManager.updateTabFromWebview(tab.id, { title: 'Example', loading: false });
      suspendManager.touchTab(tab.id);
      suspendManager.suspendTab(tab.id);

      const suspended = suspendManager.getSuspendedTab(tab.id);
      expect(suspended).not.toBeNull();
      expect(suspended?.url).toBe('https://example.com');
      expect(suspended?.title).toBe('Example');
      expect(suspended?.tabId).toBe(tab.id);
      expect(suspended?.suspendedAt).toBeGreaterThan(0);
    });

    it('returns false for non-existent tab', () => {
      expect(suspendManager.suspendTab('nonexistent')).toBe(false);
    });

    it('returns false if tab is already suspended', () => {
      const tab = tabManager.createTab('https://example.com');
      suspendManager.touchTab(tab.id);
      suspendManager.suspendTab(tab.id);
      expect(suspendManager.suspendTab(tab.id)).toBe(false);
    });
  });

  describe('unsuspendTab', () => {
    it('marks a suspended tab as active again', () => {
      const tab = tabManager.createTab('https://example.com');
      suspendManager.touchTab(tab.id);
      suspendManager.suspendTab(tab.id);
      expect(suspendManager.isSuspended(tab.id)).toBe(true);

      const result = suspendManager.unsuspendTab(tab.id);
      expect(result).toBe(true);
      expect(suspendManager.isSuspended(tab.id)).toBe(false);
    });

    it('updates last-active timestamp on unsuspend', () => {
      const tab = tabManager.createTab('https://example.com');
      suspendManager.touchTab(tab.id);
      suspendManager.suspendTab(tab.id);

      const before = Date.now();
      suspendManager.unsuspendTab(tab.id);
      expect(suspendManager.getLastActive(tab.id)).toBeGreaterThanOrEqual(before);
    });

    it('returns false for non-suspended tab', () => {
      const tab = tabManager.createTab('https://example.com');
      suspendManager.touchTab(tab.id);
      expect(suspendManager.unsuspendTab(tab.id)).toBe(false);
    });

    it('returns false for unknown tab', () => {
      expect(suspendManager.unsuspendTab('unknown')).toBe(false);
    });
  });

  describe('isSuspended', () => {
    it('returns false for active tab', () => {
      const tab = tabManager.createTab('file:///a.html');
      suspendManager.touchTab(tab.id);
      expect(suspendManager.isSuspended(tab.id)).toBe(false);
    });

    it('returns true for suspended tab', () => {
      const tab = tabManager.createTab('file:///a.html');
      suspendManager.touchTab(tab.id);
      suspendManager.suspendTab(tab.id);
      expect(suspendManager.isSuspended(tab.id)).toBe(true);
    });

    it('returns false for unknown tab', () => {
      expect(suspendManager.isSuspended('unknown')).toBe(false);
    });
  });

  describe('getAllSuspended', () => {
    it('returns empty array when nothing is suspended', () => {
      expect(suspendManager.getAllSuspended()).toEqual([]);
    });

    it('returns all suspended tabs', () => {
      const t1 = tabManager.createTab('https://a.com');
      const t2 = tabManager.createTab('https://b.com');
      tabManager.createTab('https://c.com');
      suspendManager.touchTab(t1.id);
      suspendManager.touchTab(t2.id);
      suspendManager.suspendTab(t1.id);
      suspendManager.suspendTab(t2.id);

      const suspended = suspendManager.getAllSuspended();
      expect(suspended).toHaveLength(2);
      const ids = suspended.map((s) => s.tabId);
      expect(ids).toContain(t1.id);
      expect(ids).toContain(t2.id);
    });
  });

  describe('suggestForSuspension', () => {
    it('suggests tabs idle longer than threshold', () => {
      const tab = tabManager.createTab('https://example.com');
      const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000;
      suspendManager.touchTab(tab.id);
      vi.spyOn(Date, 'now').mockReturnValue(thirtyOneMinutesAgo + 31 * 60 * 1000);

      suspendManager['lastActive'].set(tab.id, thirtyOneMinutesAgo);
      const suggestions = suspendManager.suggestForSuspension();
      expect(suggestions).toContain(tab.id);
    });

    it('does not suggest recently active tabs', () => {
      const tab = tabManager.createTab('https://example.com');
      suspendManager.touchTab(tab.id);
      const suggestions = suspendManager.suggestForSuspension();
      expect(suggestions).not.toContain(tab.id);
    });

    it('never suggests pinned tabs', () => {
      const tab = tabManager.createTab('https://example.com');
      tabManager.pinTab(tab.id);
      const longAgo = Date.now() - 60 * 60 * 1000;
      suspendManager['lastActive'].set(tab.id, longAgo);
      const suggestions = suspendManager.suggestForSuspension();
      expect(suggestions).not.toContain(tab.id);
    });

    it('never suggests already-suspended tabs', () => {
      const tab = tabManager.createTab('https://example.com');
      suspendManager.touchTab(tab.id);
      suspendManager.suspendTab(tab.id);
      suspendManager['lastActive'].set(tab.id, Date.now() - 60 * 60 * 1000);
      const suggestions = suspendManager.suggestForSuspension();
      expect(suggestions).not.toContain(tab.id);
    });

    it('respects custom threshold', () => {
      const tab = tabManager.createTab('https://example.com');
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      suspendManager['lastActive'].set(tab.id, fiveMinutesAgo);
      const suggestions = suspendManager.suggestForSuspension(4 * 60 * 1000);
      expect(suggestions).toContain(tab.id);
    });
  });

  describe('discardTab', () => {
    it('removes a tab from suspended state', () => {
      const tab = tabManager.createTab('https://example.com');
      suspendManager.touchTab(tab.id);
      suspendManager.suspendTab(tab.id);

      const result = suspendManager.discardTab(tab.id);
      expect(result).toBe(true);
      expect(suspendManager.isSuspended(tab.id)).toBe(false);
      expect(suspendManager.getSuspendedTab(tab.id)).toBeNull();
    });

    it('removes last-active tracking for discarded tab', () => {
      const tab = tabManager.createTab('https://example.com');
      suspendManager.touchTab(tab.id);
      suspendManager.discardTab(tab.id);
      expect(suspendManager.getLastActive(tab.id)).toBe(0);
    });

    it('works on non-suspended active tab too', () => {
      const tab = tabManager.createTab('https://example.com');
      suspendManager.touchTab(tab.id);
      const result = suspendManager.discardTab(tab.id);
      expect(result).toBe(true);
      expect(suspendManager.getLastActive(tab.id)).toBe(0);
    });

    it('returns false for unknown tab', () => {
      expect(suspendManager.discardTab('unknown')).toBe(false);
    });
  });

  describe('memoryPressure', () => {
    it('defaults to normal', () => {
      expect(suspendManager.getMemoryPressure()).toBe('normal');
    });

    it('can be set to each valid level', () => {
      suspendManager.setMemoryPressure('low');
      expect(suspendManager.getMemoryPressure()).toBe('low');

      suspendManager.setMemoryPressure('high');
      expect(suspendManager.getMemoryPressure()).toBe('high');

      suspendManager.setMemoryPressure('critical');
      expect(suspendManager.getMemoryPressure()).toBe('critical');

      suspendManager.setMemoryPressure('normal');
      expect(suspendManager.getMemoryPressure()).toBe('normal');
    });
  });

  describe('getTabsByLastActive', () => {
    it('returns tabs ordered oldest-first', () => {
      const t1 = tabManager.createTab('https://a.com');
      const t2 = tabManager.createTab('https://b.com');
      const t3 = tabManager.createTab('https://c.com');

      const now = Date.now();
      suspendManager['lastActive'].set(t1.id, now - 3000);
      suspendManager['lastActive'].set(t2.id, now - 1000);
      suspendManager['lastActive'].set(t3.id, now - 2000);

      const ordered = suspendManager.getTabsByLastActive();
      expect(ordered[0]?.id).toBe(t1.id);
      expect(ordered[1]?.id).toBe(t3.id);
      expect(ordered[2]?.id).toBe(t2.id);
    });

    it('returns empty array when no tabs tracked', () => {
      expect(suspendManager.getTabsByLastActive()).toEqual([]);
    });

    it('excludes tabs that no longer exist in tab manager', () => {
      const t1 = tabManager.createTab('https://a.com');
      const t2 = tabManager.createTab('https://b.com');
      suspendManager.touchTab(t1.id);
      suspendManager.touchTab(t2.id);
      tabManager.closeTab(t1.id);

      const ordered = suspendManager.getTabsByLastActive();
      expect(ordered).toHaveLength(1);
      expect(ordered[0]?.id).toBe(t2.id);
    });
  });

  describe('getSuspendedTab', () => {
    it('returns null for non-suspended tab', () => {
      const tab = tabManager.createTab('https://example.com');
      expect(suspendManager.getSuspendedTab(tab.id)).toBeNull();
    });

    it('returns suspended tab data', () => {
      const tab = tabManager.createTab('https://example.com');
      tabManager.updateTabFromWebview(tab.id, { title: 'Test Page' });
      suspendManager.touchTab(tab.id);
      suspendManager.suspendTab(tab.id);

      const data = suspendManager.getSuspendedTab(tab.id);
      expect(data).not.toBeNull();
      expect(data?.tabId).toBe(tab.id);
      expect(data?.url).toBe('https://example.com');
      expect(data?.title).toBe('Test Page');
    });
  });
});
