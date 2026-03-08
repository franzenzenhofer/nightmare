import { describe, it, expect, beforeEach } from 'vitest';
import { LazyTabService } from '../services/lazy-tabs';
import type { TabLoadState, LazyTabInfo } from '../services/lazy-tabs';

const DEFAULT_PRELOAD = 1;

describe('LazyTabService', () => {
  let service: LazyTabService;

  beforeEach(() => {
    service = new LazyTabService();
  });

  describe('trackTab', () => {
    it('adds a tab in pending state', () => {
      service.trackTab('tab-1');
      expect(service.getState('tab-1')).toBe('pending');
    });

    it('assigns queue position based on insertion order', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.trackTab('tab-3');
      const info = service.getInfo('tab-1');
      expect(info?.queuePosition).toBe(0);
      expect(service.getInfo('tab-2')?.queuePosition).toBe(1);
      expect(service.getInfo('tab-3')?.queuePosition).toBe(2);
    });

    it('throws when tracking the same tab id twice', () => {
      service.trackTab('tab-1');
      expect(() => service.trackTab('tab-1')).toThrow('already tracked');
    });
  });

  describe('activateTab', () => {
    it('transitions a pending tab to loaded', () => {
      service.trackTab('tab-1');
      service.activateTab('tab-1');
      expect(service.getState('tab-1')).toBe('loaded');
    });

    it('keeps a loaded tab as loaded when activated again', () => {
      service.trackTab('tab-1');
      service.activateTab('tab-1');
      service.activateTab('tab-1');
      expect(service.getState('tab-1')).toBe('loaded');
    });

    it('transitions a loading tab to loaded', () => {
      service.trackTab('tab-1');
      service.triggerLoad('tab-1');
      service.activateTab('tab-1');
      expect(service.getState('tab-1')).toBe('loaded');
    });

    it('throws when activating an untracked tab', () => {
      expect(() => service.activateTab('unknown')).toThrow('not tracked');
    });
  });

  describe('getState', () => {
    it('returns undefined for an untracked tab', () => {
      expect(service.getState('unknown')).toBeUndefined();
    });

    it('returns pending for a newly tracked tab', () => {
      service.trackTab('tab-1');
      expect(service.getState('tab-1')).toBe('pending');
    });

    it('returns loading for a tab being loaded', () => {
      service.trackTab('tab-1');
      service.triggerLoad('tab-1');
      expect(service.getState('tab-1')).toBe('loading');
    });

    it('returns loaded for an activated tab', () => {
      service.trackTab('tab-1');
      service.activateTab('tab-1');
      expect(service.getState('tab-1')).toBe('loaded');
    });
  });

  describe('isLoaded', () => {
    it('returns false for an untracked tab', () => {
      expect(service.isLoaded('unknown')).toBe(false);
    });

    it('returns false for a pending tab', () => {
      service.trackTab('tab-1');
      expect(service.isLoaded('tab-1')).toBe(false);
    });

    it('returns false for a loading tab', () => {
      service.trackTab('tab-1');
      service.triggerLoad('tab-1');
      expect(service.isLoaded('tab-1')).toBe(false);
    });

    it('returns true for a loaded tab', () => {
      service.trackTab('tab-1');
      service.activateTab('tab-1');
      expect(service.isLoaded('tab-1')).toBe(true);
    });
  });

  describe('getPendingTabs', () => {
    it('returns empty array when no tabs are tracked', () => {
      expect(service.getPendingTabs()).toEqual([]);
    });

    it('returns all pending tabs', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.trackTab('tab-3');
      expect(service.getPendingTabs()).toEqual(['tab-1', 'tab-2', 'tab-3']);
    });

    it('excludes loaded tabs', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.activateTab('tab-1');
      expect(service.getPendingTabs()).toEqual(['tab-2']);
    });

    it('excludes loading tabs', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.triggerLoad('tab-1');
      expect(service.getPendingTabs()).toEqual(['tab-2']);
    });
  });

  describe('getLoadedTabs', () => {
    it('returns empty array when no tabs are loaded', () => {
      service.trackTab('tab-1');
      expect(service.getLoadedTabs()).toEqual([]);
    });

    it('returns only loaded tabs', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.trackTab('tab-3');
      service.activateTab('tab-1');
      service.activateTab('tab-3');
      expect(service.getLoadedTabs()).toEqual(['tab-1', 'tab-3']);
    });
  });

  describe('triggerLoad', () => {
    it('transitions a pending tab to loading', () => {
      service.trackTab('tab-1');
      service.triggerLoad('tab-1');
      expect(service.getState('tab-1')).toBe('loading');
    });

    it('throws when triggering load for an untracked tab', () => {
      expect(() => service.triggerLoad('unknown')).toThrow('not tracked');
    });

    it('is a no-op for an already loaded tab', () => {
      service.trackTab('tab-1');
      service.activateTab('tab-1');
      service.triggerLoad('tab-1');
      expect(service.getState('tab-1')).toBe('loaded');
    });

    it('is a no-op for a tab already in loading state', () => {
      service.trackTab('tab-1');
      service.triggerLoad('tab-1');
      service.triggerLoad('tab-1');
      expect(service.getState('tab-1')).toBe('loading');
    });
  });

  describe('getLoadOrder', () => {
    it('returns empty array when no tabs are pending', () => {
      expect(service.getLoadOrder()).toEqual([]);
    });

    it('returns pending tabs in FIFO order', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.trackTab('tab-3');
      expect(service.getLoadOrder()).toEqual(['tab-1', 'tab-2', 'tab-3']);
    });

    it('excludes loaded tabs from the queue', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.trackTab('tab-3');
      service.activateTab('tab-2');
      expect(service.getLoadOrder()).toEqual(['tab-1', 'tab-3']);
    });

    it('excludes loading tabs from the queue', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.triggerLoad('tab-1');
      expect(service.getLoadOrder()).toEqual(['tab-2']);
    });
  });

  describe('clearTab', () => {
    it('removes a tab from tracking', () => {
      service.trackTab('tab-1');
      service.clearTab('tab-1');
      expect(service.getState('tab-1')).toBeUndefined();
    });

    it('removes a loaded tab from tracking', () => {
      service.trackTab('tab-1');
      service.activateTab('tab-1');
      service.clearTab('tab-1');
      expect(service.getLoadedTabs()).toEqual([]);
    });

    it('removes the tab from the load order queue', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.clearTab('tab-1');
      expect(service.getLoadOrder()).toEqual(['tab-2']);
    });

    it('is a no-op for an untracked tab', () => {
      expect(() => service.clearTab('unknown')).not.toThrow();
    });

    it('allows re-tracking a cleared tab', () => {
      service.trackTab('tab-1');
      service.clearTab('tab-1');
      service.trackTab('tab-1');
      expect(service.getState('tab-1')).toBe('pending');
    });
  });

  describe('getInfo', () => {
    it('returns null for an untracked tab', () => {
      expect(service.getInfo('unknown')).toBeNull();
    });

    it('returns correct info for a pending tab', () => {
      service.trackTab('tab-1');
      const info = service.getInfo('tab-1');
      expect(info).toEqual({ tabId: 'tab-1', state: 'pending', queuePosition: 0 });
    });

    it('returns queue position -1 for a loaded tab', () => {
      service.trackTab('tab-1');
      service.activateTab('tab-1');
      const info = service.getInfo('tab-1');
      expect(info).toEqual({ tabId: 'tab-1', state: 'loaded', queuePosition: -1 });
    });

    it('returns queue position -1 for a loading tab', () => {
      service.trackTab('tab-1');
      service.triggerLoad('tab-1');
      const info = service.getInfo('tab-1');
      expect(info).toEqual({ tabId: 'tab-1', state: 'loading', queuePosition: -1 });
    });

    it('recalculates queue positions after a tab is cleared', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.trackTab('tab-3');
      service.clearTab('tab-1');
      expect(service.getInfo('tab-2')?.queuePosition).toBe(0);
      expect(service.getInfo('tab-3')?.queuePosition).toBe(1);
    });
  });

  describe('preloading', () => {
    it('defaults to preloading 1 tab', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      const preloaded = service.preload();
      expect(preloaded).toEqual(['tab-1']);
      expect(service.getState('tab-1')).toBe('loading');
      expect(service.getState('tab-2')).toBe('pending');
    });

    it('preloads up to N tabs with custom count', () => {
      const custom = new LazyTabService(3);
      custom.trackTab('tab-1');
      custom.trackTab('tab-2');
      custom.trackTab('tab-3');
      custom.trackTab('tab-4');
      const preloaded = custom.preload();
      expect(preloaded).toEqual(['tab-1', 'tab-2', 'tab-3']);
      expect(custom.getState('tab-1')).toBe('loading');
      expect(custom.getState('tab-2')).toBe('loading');
      expect(custom.getState('tab-3')).toBe('loading');
      expect(custom.getState('tab-4')).toBe('pending');
    });

    it('returns empty array when no pending tabs exist', () => {
      service.trackTab('tab-1');
      service.activateTab('tab-1');
      expect(service.preload()).toEqual([]);
    });

    it('skips tabs already in loading state', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.triggerLoad('tab-1');
      const custom = new LazyTabService(2);
      custom.trackTab('tab-a');
      custom.trackTab('tab-b');
      custom.trackTab('tab-c');
      custom.triggerLoad('tab-a');
      const preloaded = custom.preload();
      expect(preloaded).toEqual(['tab-b', 'tab-c']);
    });

    it('preloads fewer than N when fewer pending tabs remain', () => {
      const custom = new LazyTabService(5);
      custom.trackTab('tab-1');
      custom.trackTab('tab-2');
      const preloaded = custom.preload();
      expect(preloaded).toEqual(['tab-1', 'tab-2']);
    });
  });

  describe('edge cases', () => {
    it('handles clearing all tabs', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.clearTab('tab-1');
      service.clearTab('tab-2');
      expect(service.getPendingTabs()).toEqual([]);
      expect(service.getLoadedTabs()).toEqual([]);
      expect(service.getLoadOrder()).toEqual([]);
    });

    it('maintains correct order after mixed operations', () => {
      service.trackTab('tab-1');
      service.trackTab('tab-2');
      service.trackTab('tab-3');
      service.trackTab('tab-4');
      service.activateTab('tab-2');
      service.triggerLoad('tab-3');
      service.clearTab('tab-1');
      expect(service.getLoadOrder()).toEqual(['tab-4']);
      expect(service.getLoadedTabs()).toEqual(['tab-2']);
      expect(service.getState('tab-3')).toBe('loading');
    });

    it('type assertion for TabLoadState', () => {
      service.trackTab('tab-1');
      const state: TabLoadState | undefined = service.getState('tab-1');
      expect(state).toBe('pending');
    });

    it('type assertion for LazyTabInfo', () => {
      service.trackTab('tab-1');
      const info: LazyTabInfo | null = service.getInfo('tab-1');
      expect(info).not.toBeNull();
      expect(info?.tabId).toBe('tab-1');
      expect(info?.state).toBe('pending');
      expect(info?.queuePosition).toBe(0);
    });
  });
});
