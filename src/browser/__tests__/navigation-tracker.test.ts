import { describe, it, expect, beforeEach } from 'vitest';
import { NavigationTracker } from '../services/navigation-tracker';

let tracker: NavigationTracker;

beforeEach(() => {
  tracker = new NavigationTracker();
});

describe('NavigationTracker', () => {
  describe('trackTab', () => {
    it('registers a new tab with zero depth', () => {
      tracker.trackTab('tab-1');
      expect(tracker.canGoBack('tab-1')).toBe(false);
      expect(tracker.canGoForward('tab-1')).toBe(false);
    });

    it('registers a tab with an openerId', () => {
      tracker.trackTab('tab-1');
      tracker.trackTab('tab-2', 'tab-1');
      expect(tracker.canGoBack('tab-2')).toBe(true);
    });
  });

  describe('recordNavigation', () => {
    it('increments depth on navigation', () => {
      tracker.trackTab('tab-1');
      tracker.recordNavigation('tab-1');
      expect(tracker.canGoBack('tab-1')).toBe(true);
    });

    it('resets forward depth on new navigation', () => {
      tracker.trackTab('tab-1');
      tracker.recordNavigation('tab-1');
      tracker.recordNavigation('tab-1');
      tracker.recordBack('tab-1');
      expect(tracker.canGoForward('tab-1')).toBe(true);
      tracker.recordNavigation('tab-1');
      expect(tracker.canGoForward('tab-1')).toBe(false);
    });

    it('does nothing for untracked tab', () => {
      tracker.recordNavigation('unknown');
      expect(tracker.canGoBack('unknown')).toBe(false);
    });
  });

  describe('recordBack', () => {
    it('decrements depth and increments forward depth', () => {
      tracker.trackTab('tab-1');
      tracker.recordNavigation('tab-1');
      tracker.recordNavigation('tab-1');
      tracker.recordBack('tab-1');
      expect(tracker.canGoBack('tab-1')).toBe(true);
      expect(tracker.canGoForward('tab-1')).toBe(true);
    });

    it('does not go below zero depth', () => {
      tracker.trackTab('tab-1');
      tracker.recordBack('tab-1');
      expect(tracker.canGoBack('tab-1')).toBe(false);
      expect(tracker.canGoForward('tab-1')).toBe(false);
    });
  });

  describe('recordForward', () => {
    it('increments depth and decrements forward depth', () => {
      tracker.trackTab('tab-1');
      tracker.recordNavigation('tab-1');
      tracker.recordBack('tab-1');
      tracker.recordForward('tab-1');
      expect(tracker.canGoBack('tab-1')).toBe(true);
      expect(tracker.canGoForward('tab-1')).toBe(false);
    });

    it('does not go below zero forward depth', () => {
      tracker.trackTab('tab-1');
      tracker.recordForward('tab-1');
      expect(tracker.canGoForward('tab-1')).toBe(false);
    });
  });

  describe('resetNavigation', () => {
    it('resets depth but keeps openerId', () => {
      tracker.trackTab('tab-1');
      tracker.trackTab('tab-2', 'tab-1');
      tracker.recordNavigation('tab-2');
      tracker.recordNavigation('tab-2');
      tracker.resetNavigation('tab-2');
      expect(tracker.canGoBack('tab-2')).toBe(true);
      const action = tracker.getBackAction('tab-2');
      expect(action.type).toBe('cross-tab');
    });
  });

  describe('removeTab', () => {
    it('removes tracking for a tab', () => {
      tracker.trackTab('tab-1');
      tracker.recordNavigation('tab-1');
      tracker.removeTab('tab-1');
      expect(tracker.canGoBack('tab-1')).toBe(false);
    });

    it('does nothing for untracked tab', () => {
      tracker.removeTab('unknown');
      expect(tracker.canGoBack('unknown')).toBe(false);
    });
  });

  describe('getBackAction', () => {
    it('returns in-page when depth > 0', () => {
      tracker.trackTab('tab-1');
      tracker.recordNavigation('tab-1');
      const action = tracker.getBackAction('tab-1');
      expect(action.type).toBe('in-page');
    });

    it('returns cross-tab when depth is 0 and opener exists', () => {
      tracker.trackTab('tab-1');
      tracker.trackTab('tab-2', 'tab-1');
      const action = tracker.getBackAction('tab-2');
      expect(action.type).toBe('cross-tab');
      if (action.type === 'cross-tab') {
        expect(action.openerId).toBe('tab-1');
      }
    });

    it('returns none when depth is 0 and no opener', () => {
      tracker.trackTab('tab-1');
      const action = tracker.getBackAction('tab-1');
      expect(action.type).toBe('none');
    });

    it('returns none when opener has been removed', () => {
      tracker.trackTab('tab-1');
      tracker.trackTab('tab-2', 'tab-1');
      tracker.removeTab('tab-1');
      const action = tracker.getBackAction('tab-2');
      expect(action.type).toBe('none');
    });

    it('returns none for untracked tab', () => {
      const action = tracker.getBackAction('unknown');
      expect(action.type).toBe('none');
    });
  });

  describe('getForwardAction', () => {
    it('returns in-page when forward depth > 0', () => {
      tracker.trackTab('tab-1');
      tracker.recordNavigation('tab-1');
      tracker.recordBack('tab-1');
      const action = tracker.getForwardAction('tab-1');
      expect(action.type).toBe('in-page');
    });

    it('returns none when forward depth is 0', () => {
      tracker.trackTab('tab-1');
      const action = tracker.getForwardAction('tab-1');
      expect(action.type).toBe('none');
    });

    it('returns none for untracked tab', () => {
      const action = tracker.getForwardAction('unknown');
      expect(action.type).toBe('none');
    });
  });

  describe('cross-tab chains', () => {
    it('A opens B, back from B closes B and activates A', () => {
      tracker.trackTab('A');
      tracker.trackTab('B', 'A');
      const action = tracker.getBackAction('B');
      expect(action.type).toBe('cross-tab');
      if (action.type === 'cross-tab') {
        expect(action.openerId).toBe('A');
      }
    });

    it('A -> B -> C chain works correctly', () => {
      tracker.trackTab('A');
      tracker.trackTab('B', 'A');
      tracker.trackTab('C', 'B');
      const cAction = tracker.getBackAction('C');
      expect(cAction.type).toBe('cross-tab');
      if (cAction.type === 'cross-tab') {
        expect(cAction.openerId).toBe('B');
      }
      const bAction = tracker.getBackAction('B');
      expect(bAction.type).toBe('cross-tab');
      if (bAction.type === 'cross-tab') {
        expect(bAction.openerId).toBe('A');
      }
    });

    it('in-page navigation takes priority over cross-tab', () => {
      tracker.trackTab('A');
      tracker.trackTab('B', 'A');
      tracker.recordNavigation('B');
      const action = tracker.getBackAction('B');
      expect(action.type).toBe('in-page');
    });

    it('after going back to depth 0, cross-tab is available again', () => {
      tracker.trackTab('A');
      tracker.trackTab('B', 'A');
      tracker.recordNavigation('B');
      tracker.recordBack('B');
      const action = tracker.getBackAction('B');
      expect(action.type).toBe('cross-tab');
    });
  });
});
