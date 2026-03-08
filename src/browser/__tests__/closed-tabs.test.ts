import { describe, it, expect, beforeEach } from 'vitest';
import { ClosedTabsManager } from '../services/closed-tabs';

const MAX_CAPACITY = 25;

describe('ClosedTabsManager', () => {
  let manager: ClosedTabsManager;

  beforeEach(() => {
    manager = new ClosedTabsManager();
  });

  describe('record', () => {
    it('records a closed tab entry', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'WEB' });
      const recent = manager.getRecentlyClosed(10);
      expect(recent).toHaveLength(1);
      expect(recent[0]?.url).toBe('https://a.com');
      expect(recent[0]?.title).toBe('A');
      expect(recent[0]?.zone).toBe('WEB');
    });

    it('assigns a closedAt timestamp automatically', () => {
      const before = Date.now();
      manager.record({ url: 'https://a.com', title: 'A', zone: 'LOCAL' });
      const after = Date.now();
      const entry = manager.getRecentlyClosed(1)[0];
      expect(entry?.closedAt).toBeGreaterThanOrEqual(before);
      expect(entry?.closedAt).toBeLessThanOrEqual(after);
    });

    it('records multiple closed tabs in order', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'WEB' });
      manager.record({ url: 'https://b.com', title: 'B', zone: 'LOCALHOST' });
      manager.record({ url: 'https://c.com', title: 'C', zone: 'LOCAL' });
      const recent = manager.getRecentlyClosed(10);
      expect(recent).toHaveLength(3);
      expect(recent[0]?.url).toBe('https://c.com');
      expect(recent[1]?.url).toBe('https://b.com');
      expect(recent[2]?.url).toBe('https://a.com');
    });
  });

  describe('getRecentlyClosed', () => {
    it('returns empty array when no tabs have been closed', () => {
      expect(manager.getRecentlyClosed(10)).toEqual([]);
    });

    it('returns entries in reverse chronological order (most recent first)', () => {
      manager.record({ url: 'https://first.com', title: 'First', zone: 'WEB' });
      manager.record({ url: 'https://second.com', title: 'Second', zone: 'WEB' });
      manager.record({ url: 'https://third.com', title: 'Third', zone: 'WEB' });
      const recent = manager.getRecentlyClosed(10);
      expect(recent[0]?.url).toBe('https://third.com');
      expect(recent[2]?.url).toBe('https://first.com');
    });

    it('respects the limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        manager.record({ url: `https://site${String(i)}.com`, title: `Site ${String(i)}`, zone: 'WEB' });
      }
      expect(manager.getRecentlyClosed(3)).toHaveLength(3);
    });

    it('returns all entries when limit exceeds count', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'WEB' });
      manager.record({ url: 'https://b.com', title: 'B', zone: 'WEB' });
      expect(manager.getRecentlyClosed(100)).toHaveLength(2);
    });

    it('returns a defensive copy (not internal state)', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'WEB' });
      const first = manager.getRecentlyClosed(10);
      const second = manager.getRecentlyClosed(10);
      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });
  });

  describe('reopenLast', () => {
    it('returns undefined when no tabs have been closed', () => {
      expect(manager.reopenLast()).toBeUndefined();
    });

    it('returns the most recently closed tab', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'WEB' });
      manager.record({ url: 'https://b.com', title: 'B', zone: 'LOCALHOST' });
      const reopened = manager.reopenLast();
      expect(reopened?.url).toBe('https://b.com');
      expect(reopened?.title).toBe('B');
      expect(reopened?.zone).toBe('LOCALHOST');
    });

    it('removes the reopened tab from the list', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'WEB' });
      manager.record({ url: 'https://b.com', title: 'B', zone: 'WEB' });
      manager.reopenLast();
      const remaining = manager.getRecentlyClosed(10);
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.url).toBe('https://a.com');
    });

    it('can reopen multiple tabs in sequence', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'WEB' });
      manager.record({ url: 'https://b.com', title: 'B', zone: 'WEB' });
      manager.record({ url: 'https://c.com', title: 'C', zone: 'WEB' });
      expect(manager.reopenLast()?.url).toBe('https://c.com');
      expect(manager.reopenLast()?.url).toBe('https://b.com');
      expect(manager.reopenLast()?.url).toBe('https://a.com');
      expect(manager.reopenLast()).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('removes all closed tab entries', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'WEB' });
      manager.record({ url: 'https://b.com', title: 'B', zone: 'WEB' });
      manager.clear();
      expect(manager.getRecentlyClosed(10)).toEqual([]);
    });

    it('allows recording new entries after clearing', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'WEB' });
      manager.clear();
      manager.record({ url: 'https://b.com', title: 'B', zone: 'WEB' });
      expect(manager.getRecentlyClosed(10)).toHaveLength(1);
      expect(manager.getRecentlyClosed(10)[0]?.url).toBe('https://b.com');
    });

    it('makes reopenLast return undefined', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'WEB' });
      manager.clear();
      expect(manager.reopenLast()).toBeUndefined();
    });
  });

  describe('ring buffer capacity', () => {
    it('enforces maximum capacity of 25 entries', () => {
      for (let i = 0; i < 30; i++) {
        manager.record({ url: `https://site${String(i)}.com`, title: `Site ${String(i)}`, zone: 'WEB' });
      }
      expect(manager.getRecentlyClosed(100)).toHaveLength(MAX_CAPACITY);
    });

    it('drops the oldest entries when capacity is exceeded', () => {
      for (let i = 0; i < 30; i++) {
        manager.record({ url: `https://site${String(i)}.com`, title: `Site ${String(i)}`, zone: 'WEB' });
      }
      const recent = manager.getRecentlyClosed(100);
      expect(recent[0]?.url).toBe('https://site29.com');
      const urls = recent.map((e) => e.url);
      expect(urls).not.toContain('https://site0.com');
      expect(urls).not.toContain('https://site4.com');
      expect(urls).toContain('https://site5.com');
    });

    it('keeps the most recent entries when capacity overflows', () => {
      for (let i = 0; i < 26; i++) {
        manager.record({ url: `https://site${String(i)}.com`, title: `Site ${String(i)}`, zone: 'WEB' });
      }
      const recent = manager.getRecentlyClosed(100);
      expect(recent).toHaveLength(MAX_CAPACITY);
      const urls = recent.map((e) => e.url);
      expect(urls).not.toContain('https://site0.com');
      expect(urls).toContain('https://site1.com');
      expect(urls).toContain('https://site25.com');
    });

    it('allows custom capacity via constructor', () => {
      const small = new ClosedTabsManager(5);
      for (let i = 0; i < 10; i++) {
        small.record({ url: `https://site${String(i)}.com`, title: `Site ${String(i)}`, zone: 'WEB' });
      }
      expect(small.getRecentlyClosed(100)).toHaveLength(5);
    });
  });

  describe('entry immutability', () => {
    it('returns entries with all required fields', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'WEB' });
      const entry = manager.getRecentlyClosed(1)[0];
      expect(entry).toBeDefined();
      expect(entry).toHaveProperty('url');
      expect(entry).toHaveProperty('title');
      expect(entry).toHaveProperty('zone');
      expect(entry).toHaveProperty('closedAt');
    });

    it('reopenLast returns entry with all required fields', () => {
      manager.record({ url: 'https://a.com', title: 'A', zone: 'LOCAL' });
      const entry = manager.reopenLast();
      expect(entry).toBeDefined();
      expect(entry?.url).toBe('https://a.com');
      expect(entry?.title).toBe('A');
      expect(entry?.zone).toBe('LOCAL');
      expect(entry?.closedAt).toBeTypeOf('number');
    });
  });
});
