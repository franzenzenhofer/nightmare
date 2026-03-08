import { describe, it, expect, beforeEach } from 'vitest';
import { TabDragManager } from '../services/tab-drag';

describe('TabDragManager', () => {
  let manager: TabDragManager;

  beforeEach(() => {
    manager = new TabDragManager();
  });

  describe('reorder', () => {
    it('moves a tab forward', () => {
      const tabs = ['a', 'b', 'c', 'd'];
      const result = manager.reorder(tabs, 0, 2);
      expect(result).toEqual(['b', 'c', 'a', 'd']);
    });

    it('moves a tab backward', () => {
      const tabs = ['a', 'b', 'c', 'd'];
      const result = manager.reorder(tabs, 3, 1);
      expect(result).toEqual(['a', 'd', 'b', 'c']);
    });

    it('does not mutate original array', () => {
      const tabs = ['a', 'b', 'c'];
      manager.reorder(tabs, 0, 2);
      expect(tabs).toEqual(['a', 'b', 'c']);
    });

    it('returns same order if from === to', () => {
      const tabs = ['a', 'b', 'c'];
      expect(manager.reorder(tabs, 1, 1)).toEqual(['a', 'b', 'c']);
    });

    it('handles single element', () => {
      expect(manager.reorder(['a'], 0, 0)).toEqual(['a']);
    });
  });

  describe('startDrag', () => {
    it('sets drag state', () => {
      manager.startDrag('tab-1', 0);
      expect(manager.isDragging()).toBe(true);
      expect(manager.getDragState()?.tabId).toBe('tab-1');
    });
  });

  describe('endDrag', () => {
    it('clears drag state', () => {
      manager.startDrag('tab-1', 0);
      manager.endDrag();
      expect(manager.isDragging()).toBe(false);
      expect(manager.getDragState()).toBeNull();
    });
  });

  describe('getDropIndex', () => {
    it('calculates drop index from position', () => {
      const tabWidths = [100, 100, 100, 100];
      expect(manager.getDropIndex(150, tabWidths)).toBe(1);
    });

    it('returns 0 for position at start', () => {
      const tabWidths = [100, 100, 100];
      expect(manager.getDropIndex(10, tabWidths)).toBe(0);
    });

    it('returns last index for position past end', () => {
      const tabWidths = [100, 100, 100];
      expect(manager.getDropIndex(500, tabWidths)).toBe(2);
    });

    it('handles empty widths', () => {
      expect(manager.getDropIndex(100, [])).toBe(0);
    });
  });

  describe('validateDrop', () => {
    it('returns true for valid indices', () => {
      expect(manager.validateDrop(0, 2, 4)).toBe(true);
    });

    it('returns false for same position', () => {
      expect(manager.validateDrop(1, 1, 4)).toBe(false);
    });

    it('returns false for out of bounds', () => {
      expect(manager.validateDrop(0, 5, 4)).toBe(false);
      expect(manager.validateDrop(-1, 2, 4)).toBe(false);
    });
  });
});
