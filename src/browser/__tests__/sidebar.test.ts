import { describe, it, expect, beforeEach } from 'vitest';
import { SidebarLogic } from '../components/sidebar';
import type { SidebarPanel } from '../components/sidebar';

let sidebar: SidebarLogic;

beforeEach(() => {
  sidebar = new SidebarLogic();
});

describe('SidebarLogic', () => {
  describe('initial state', () => {
    it('starts closed with bookmarks panel', () => {
      const state = sidebar.getState();
      expect(state.isOpen).toBe(false);
      expect(state.activePanel).toBe('bookmarks');
    });
  });

  describe('toggle', () => {
    it('opens when closed', () => {
      sidebar.toggle();
      expect(sidebar.getState().isOpen).toBe(true);
    });

    it('closes when open', () => {
      sidebar.toggle();
      sidebar.toggle();
      expect(sidebar.getState().isOpen).toBe(false);
    });
  });

  describe('open', () => {
    it('opens with a specific panel', () => {
      sidebar.open('history');
      const state = sidebar.getState();
      expect(state.isOpen).toBe(true);
      expect(state.activePanel).toBe('history');
    });

    it('opens with downloads panel', () => {
      sidebar.open('downloads');
      expect(sidebar.getState().activePanel).toBe('downloads');
    });

    it('switches panel if already open with different panel', () => {
      sidebar.open('bookmarks');
      sidebar.open('history');
      const state = sidebar.getState();
      expect(state.isOpen).toBe(true);
      expect(state.activePanel).toBe('history');
    });
  });

  describe('close', () => {
    it('closes the sidebar', () => {
      sidebar.open('bookmarks');
      sidebar.close();
      expect(sidebar.getState().isOpen).toBe(false);
    });

    it('preserves active panel after close', () => {
      sidebar.open('history');
      sidebar.close();
      expect(sidebar.getState().activePanel).toBe('history');
    });
  });

  describe('switchPanel', () => {
    it('switches to a different panel', () => {
      sidebar.open('bookmarks');
      sidebar.switchPanel('downloads');
      expect(sidebar.getState().activePanel).toBe('downloads');
    });

    it('stays open when switching panels', () => {
      sidebar.open('bookmarks');
      sidebar.switchPanel('history');
      expect(sidebar.getState().isOpen).toBe(true);
    });

    it('works when closed (changes active panel)', () => {
      sidebar.switchPanel('downloads');
      expect(sidebar.getState().activePanel).toBe('downloads');
    });
  });

  describe('state immutability', () => {
    it('returns a snapshot, not a live reference', () => {
      const state1 = sidebar.getState();
      sidebar.toggle();
      const state2 = sidebar.getState();
      expect(state1.isOpen).toBe(false);
      expect(state2.isOpen).toBe(true);
    });
  });

  describe('all panel types', () => {
    it('supports all three panel types', () => {
      const panels: readonly SidebarPanel[] = [
        'bookmarks',
        'history',
        'downloads',
      ];
      for (const panel of panels) {
        sidebar.open(panel);
        expect(sidebar.getState().activePanel).toBe(panel);
      }
    });
  });
});
