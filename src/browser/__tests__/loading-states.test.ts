import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoadingStateManager } from '../services/loading-states';
import type { LoadingState, LoadingStatus } from '../services/loading-states';

let manager: LoadingStateManager;

beforeEach(() => {
  manager = new LoadingStateManager();
  vi.restoreAllMocks();
});

describe('LoadingStateManager', () => {
  describe('getState', () => {
    it('returns idle state for unknown tab', () => {
      const state = manager.getState('unknown');
      expect(state.tabId).toBe('unknown');
      expect(state.status).toBe('idle');
      expect(state.progress).toBe(0);
      expect(state.startedAt).toBeNull();
      expect(state.completedAt).toBeNull();
      expect(state.error).toBeNull();
    });

    it('returns a fresh idle state each time for unknown tabs', () => {
      const a = manager.getState('a');
      const b = manager.getState('b');
      expect(a).not.toBe(b);
      expect(a.tabId).toBe('a');
      expect(b.tabId).toBe('b');
    });
  });

  describe('startLoading', () => {
    it('sets status to loading', () => {
      manager.startLoading('tab-1');
      expect(manager.getState('tab-1').status).toBe('loading');
    });

    it('sets progress to 0', () => {
      manager.startLoading('tab-1');
      expect(manager.getState('tab-1').progress).toBe(0);
    });

    it('records startedAt timestamp', () => {
      const now = 1000;
      vi.spyOn(Date, 'now').mockReturnValue(now);
      manager.startLoading('tab-1');
      expect(manager.getState('tab-1').startedAt).toBe(now);
    });

    it('clears completedAt', () => {
      vi.spyOn(Date, 'now').mockReturnValue(100);
      manager.startLoading('tab-1');
      manager.setComplete('tab-1');
      manager.startLoading('tab-1');
      expect(manager.getState('tab-1').completedAt).toBeNull();
    });

    it('clears any previous error', () => {
      manager.setError('tab-1', 'some error');
      manager.startLoading('tab-1');
      expect(manager.getState('tab-1').error).toBeNull();
    });

    it('returns the new loading state', () => {
      const state = manager.startLoading('tab-1');
      expect(state.status).toBe('loading');
    });
  });

  describe('setProgress', () => {
    it('updates progress for a loading tab', () => {
      manager.startLoading('tab-1');
      manager.setProgress('tab-1', 50);
      expect(manager.getState('tab-1').progress).toBe(50);
    });

    it('clamps progress to 0 minimum', () => {
      manager.startLoading('tab-1');
      manager.setProgress('tab-1', -10);
      expect(manager.getState('tab-1').progress).toBe(0);
    });

    it('clamps progress to 100 maximum', () => {
      manager.startLoading('tab-1');
      manager.setProgress('tab-1', 150);
      expect(manager.getState('tab-1').progress).toBe(100);
    });

    it('handles boundary value 0', () => {
      manager.startLoading('tab-1');
      manager.setProgress('tab-1', 0);
      expect(manager.getState('tab-1').progress).toBe(0);
    });

    it('handles boundary value 100', () => {
      manager.startLoading('tab-1');
      manager.setProgress('tab-1', 100);
      expect(manager.getState('tab-1').progress).toBe(100);
    });

    it('returns the updated state', () => {
      manager.startLoading('tab-1');
      const state = manager.setProgress('tab-1', 75);
      expect(state.progress).toBe(75);
    });

    it('sets progress on idle tab (auto-creates state)', () => {
      manager.setProgress('tab-new', 42);
      expect(manager.getState('tab-new').progress).toBe(42);
    });
  });

  describe('setComplete', () => {
    it('sets status to complete', () => {
      manager.startLoading('tab-1');
      manager.setComplete('tab-1');
      expect(manager.getState('tab-1').status).toBe('complete');
    });

    it('sets progress to 100', () => {
      manager.startLoading('tab-1');
      manager.setProgress('tab-1', 50);
      manager.setComplete('tab-1');
      expect(manager.getState('tab-1').progress).toBe(100);
    });

    it('records completedAt timestamp', () => {
      vi.spyOn(Date, 'now').mockReturnValue(500);
      manager.startLoading('tab-1');
      vi.spyOn(Date, 'now').mockReturnValue(1500);
      manager.setComplete('tab-1');
      expect(manager.getState('tab-1').completedAt).toBe(1500);
    });

    it('preserves startedAt', () => {
      vi.spyOn(Date, 'now').mockReturnValue(500);
      manager.startLoading('tab-1');
      vi.spyOn(Date, 'now').mockReturnValue(1500);
      manager.setComplete('tab-1');
      expect(manager.getState('tab-1').startedAt).toBe(500);
    });

    it('returns the completed state', () => {
      manager.startLoading('tab-1');
      const state = manager.setComplete('tab-1');
      expect(state.status).toBe('complete');
      expect(state.progress).toBe(100);
    });
  });

  describe('setError', () => {
    it('sets status to error', () => {
      manager.startLoading('tab-1');
      manager.setError('tab-1', 'Network timeout');
      expect(manager.getState('tab-1').status).toBe('error');
    });

    it('stores the error message', () => {
      manager.startLoading('tab-1');
      manager.setError('tab-1', 'Connection refused');
      expect(manager.getState('tab-1').error).toBe('Connection refused');
    });

    it('records completedAt timestamp on error', () => {
      vi.spyOn(Date, 'now').mockReturnValue(200);
      manager.startLoading('tab-1');
      vi.spyOn(Date, 'now').mockReturnValue(800);
      manager.setError('tab-1', 'fail');
      expect(manager.getState('tab-1').completedAt).toBe(800);
    });

    it('preserves the current progress', () => {
      manager.startLoading('tab-1');
      manager.setProgress('tab-1', 30);
      manager.setError('tab-1', 'fail');
      expect(manager.getState('tab-1').progress).toBe(30);
    });

    it('returns the error state', () => {
      manager.startLoading('tab-1');
      const state = manager.setError('tab-1', 'oops');
      expect(state.status).toBe('error');
      expect(state.error).toBe('oops');
    });

    it('can set error on a tab that was never loading', () => {
      const state = manager.setError('tab-new', 'DNS failure');
      expect(state.status).toBe('error');
      expect(state.error).toBe('DNS failure');
    });
  });

  describe('getLoadingTabs', () => {
    it('returns empty array when no tabs are loading', () => {
      expect(manager.getLoadingTabs()).toEqual([]);
    });

    it('returns only tabs with loading status', () => {
      manager.startLoading('tab-1');
      manager.startLoading('tab-2');
      manager.setComplete('tab-2');
      manager.startLoading('tab-3');
      const loading = manager.getLoadingTabs();
      expect(loading).toHaveLength(2);
      const ids = loading.map((s) => s.tabId);
      expect(ids).toContain('tab-1');
      expect(ids).toContain('tab-3');
    });

    it('excludes error and idle tabs', () => {
      manager.startLoading('tab-1');
      manager.setError('tab-1', 'err');
      manager.startLoading('tab-2');
      const loading = manager.getLoadingTabs();
      expect(loading).toHaveLength(1);
      expect(loading[0]?.tabId).toBe('tab-2');
    });
  });

  describe('isAnyLoading', () => {
    it('returns false when no tabs tracked', () => {
      expect(manager.isAnyLoading()).toBe(false);
    });

    it('returns true when at least one tab is loading', () => {
      manager.startLoading('tab-1');
      expect(manager.isAnyLoading()).toBe(true);
    });

    it('returns false when all tabs completed', () => {
      manager.startLoading('tab-1');
      manager.startLoading('tab-2');
      manager.setComplete('tab-1');
      manager.setComplete('tab-2');
      expect(manager.isAnyLoading()).toBe(false);
    });

    it('returns false when all tabs errored', () => {
      manager.startLoading('tab-1');
      manager.setError('tab-1', 'err');
      expect(manager.isAnyLoading()).toBe(false);
    });
  });

  describe('resetState', () => {
    it('resets a tab back to idle', () => {
      manager.startLoading('tab-1');
      manager.setProgress('tab-1', 50);
      manager.resetState('tab-1');
      const state = manager.getState('tab-1');
      expect(state.status).toBe('idle');
      expect(state.progress).toBe(0);
      expect(state.startedAt).toBeNull();
      expect(state.completedAt).toBeNull();
      expect(state.error).toBeNull();
    });

    it('is safe to call on unknown tab', () => {
      expect(() => manager.resetState('unknown')).not.toThrow();
    });

    it('removes the tab from internal tracking', () => {
      manager.startLoading('tab-1');
      manager.resetState('tab-1');
      expect(manager.isAnyLoading()).toBe(false);
      expect(manager.getLoadingTabs()).toEqual([]);
    });
  });

  describe('getDuration', () => {
    it('returns null for unknown tab', () => {
      expect(manager.getDuration('unknown')).toBeNull();
    });

    it('returns null for tab that has not started', () => {
      expect(manager.getDuration('tab-1')).toBeNull();
    });

    it('returns null for tab still loading (no completedAt)', () => {
      manager.startLoading('tab-1');
      expect(manager.getDuration('tab-1')).toBeNull();
    });

    it('returns duration for completed tab', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1000);
      manager.startLoading('tab-1');
      vi.spyOn(Date, 'now').mockReturnValue(3500);
      manager.setComplete('tab-1');
      expect(manager.getDuration('tab-1')).toBe(2500);
    });

    it('returns duration for errored tab', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1000);
      manager.startLoading('tab-1');
      vi.spyOn(Date, 'now').mockReturnValue(2000);
      manager.setError('tab-1', 'timeout');
      expect(manager.getDuration('tab-1')).toBe(1000);
    });
  });

  describe('type exports', () => {
    it('LoadingStatus type covers all statuses', () => {
      const statuses: LoadingStatus[] = ['idle', 'loading', 'complete', 'error'];
      expect(statuses).toHaveLength(4);
    });

    it('LoadingState interface has required shape', () => {
      const state: LoadingState = {
        tabId: 'test',
        status: 'idle',
        progress: 0,
        startedAt: null,
        completedAt: null,
        error: null,
      };
      expect(state.tabId).toBe('test');
    });
  });
});
