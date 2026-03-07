import { describe, it, expect, beforeEach } from 'vitest';
import { FindBarLogic } from '../components/find-bar';

let findBar: FindBarLogic;

beforeEach(() => {
  findBar = new FindBarLogic();
});

describe('FindBarLogic', () => {
  describe('initial state', () => {
    it('starts closed with empty query', () => {
      const state = findBar.getState();
      expect(state.isOpen).toBe(false);
      expect(state.query).toBe('');
      expect(state.currentMatch).toBe(0);
      expect(state.totalMatches).toBe(0);
    });
  });

  describe('open/close', () => {
    it('opens the find bar', () => {
      findBar.open();
      expect(findBar.getState().isOpen).toBe(true);
    });

    it('closes and resets the find bar', () => {
      findBar.open();
      findBar.setQuery('test');
      findBar.setMatches(5);
      findBar.close();
      const state = findBar.getState();
      expect(state.isOpen).toBe(false);
      expect(state.query).toBe('');
      expect(state.currentMatch).toBe(0);
      expect(state.totalMatches).toBe(0);
    });
  });

  describe('setQuery', () => {
    it('sets the search query', () => {
      findBar.setQuery('hello');
      expect(findBar.getState().query).toBe('hello');
    });

    it('resets match index to 0 when query changes', () => {
      findBar.setMatches(5);
      findBar.nextMatch();
      findBar.nextMatch();
      findBar.setQuery('new query');
      expect(findBar.getState().currentMatch).toBe(0);
    });

    it('resets total matches when query changes', () => {
      findBar.setMatches(5);
      findBar.setQuery('new');
      expect(findBar.getState().totalMatches).toBe(0);
    });
  });

  describe('setMatches', () => {
    it('sets total matches', () => {
      findBar.setMatches(10);
      expect(findBar.getState().totalMatches).toBe(10);
    });

    it('resets currentMatch to 0 if total is 0', () => {
      findBar.setMatches(5);
      findBar.nextMatch();
      findBar.setMatches(0);
      expect(findBar.getState().currentMatch).toBe(0);
    });
  });

  describe('nextMatch', () => {
    it('increments currentMatch', () => {
      findBar.setMatches(5);
      findBar.nextMatch();
      expect(findBar.getState().currentMatch).toBe(1);
    });

    it('wraps around to 0 at totalMatches', () => {
      findBar.setMatches(3);
      findBar.nextMatch();
      findBar.nextMatch();
      findBar.nextMatch();
      expect(findBar.getState().currentMatch).toBe(0);
    });

    it('does nothing when totalMatches is 0', () => {
      findBar.nextMatch();
      expect(findBar.getState().currentMatch).toBe(0);
    });
  });

  describe('prevMatch', () => {
    it('decrements currentMatch', () => {
      findBar.setMatches(5);
      findBar.nextMatch();
      findBar.nextMatch();
      findBar.prevMatch();
      expect(findBar.getState().currentMatch).toBe(1);
    });

    it('wraps around to last match from 0', () => {
      findBar.setMatches(3);
      findBar.prevMatch();
      expect(findBar.getState().currentMatch).toBe(2);
    });

    it('does nothing when totalMatches is 0', () => {
      findBar.prevMatch();
      expect(findBar.getState().currentMatch).toBe(0);
    });
  });

  describe('state immutability', () => {
    it('returns a snapshot, not a live reference', () => {
      const state1 = findBar.getState();
      findBar.open();
      const state2 = findBar.getState();
      expect(state1.isOpen).toBe(false);
      expect(state2.isOpen).toBe(true);
    });
  });
});
