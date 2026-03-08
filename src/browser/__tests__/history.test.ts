import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HistoryManager } from '../services/history';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let tempDir: string;
let hm: HistoryManager;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'nightmare-hist-'));
  hm = new HistoryManager(tempDir);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('HistoryManager', () => {
  describe('addVisit', () => {
    it('adds a history entry', () => {
      hm.addVisit('https://google.com', 'Google');
      expect(hm.getRecent(10)).toHaveLength(1);
    });

    it('increments visitCount on repeat visits', () => {
      hm.addVisit('https://google.com', 'Google');
      hm.addVisit('https://google.com', 'Google');
      const entries = hm.getRecent(10);
      expect(entries).toHaveLength(1);
      expect(entries[0]?.visitCount).toBe(2);
    });

    it('updates title on repeat visit', () => {
      hm.addVisit('https://google.com', 'Old Title');
      hm.addVisit('https://google.com', 'New Title');
      expect(hm.getRecent(10)[0]?.title).toBe('New Title');
    });
  });

  describe('getRecent', () => {
    it('returns entries sorted by most recent first', () => {
      hm.addVisit('https://a.com', 'A');
      hm.addVisit('https://b.com', 'B');
      hm.addVisit('https://c.com', 'C');
      const recent = hm.getRecent(10);
      expect(recent[0]?.url).toBe('https://c.com');
    });

    it('respects limit', () => {
      hm.addVisit('https://a.com', 'A');
      hm.addVisit('https://b.com', 'B');
      hm.addVisit('https://c.com', 'C');
      expect(hm.getRecent(2)).toHaveLength(2);
    });
  });

  describe('getMostVisited', () => {
    it('returns entries sorted by visit count', () => {
      hm.addVisit('https://a.com', 'A');
      hm.addVisit('https://b.com', 'B');
      hm.addVisit('https://b.com', 'B');
      hm.addVisit('https://b.com', 'B');
      hm.addVisit('https://a.com', 'A');
      const most = hm.getMostVisited(10);
      expect(most[0]?.url).toBe('https://b.com');
      expect(most[0]?.visitCount).toBe(3);
    });
  });

  describe('search', () => {
    it('searches by URL', () => {
      hm.addVisit('https://google.com', 'Google');
      hm.addVisit('https://github.com', 'GitHub');
      expect(hm.search('google')).toHaveLength(1);
    });

    it('searches by title', () => {
      hm.addVisit('https://example.com', 'My Cool App');
      expect(hm.search('cool')).toHaveLength(1);
    });

    it('returns empty for no match', () => {
      hm.addVisit('https://a.com', 'A');
      expect(hm.search('zzzzz')).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('clears all history', () => {
      hm.addVisit('https://a.com', 'A');
      hm.addVisit('https://b.com', 'B');
      hm.clearAll();
      expect(hm.getRecent(10)).toHaveLength(0);
    });
  });

  describe('clearRange', () => {
    it('clears entries within time range', () => {
      hm.addVisit('https://a.com', 'A');
      hm.addVisit('https://b.com', 'B');
      const entries = hm.getRecent(10);
      const bEntry = entries.find((e) => e.url === 'https://b.com');
      expect(bEntry).toBeDefined();
      const ts = bEntry!.visitedAt;
      hm.clearRange(ts, ts + 1);
      const remaining = hm.getRecent(10);
      expect(remaining.some((e) => e.url === 'https://b.com')).toBe(false);
    });
  });

  describe('maxEntries', () => {
    it('trims entries when exceeding max', () => {
      const smallHm = new HistoryManager(tempDir, 5);
      for (let i = 0; i < 8; i++) {
        smallHm.addVisit(`https://site${String(i)}.com`, `Site ${String(i)}`);
      }
      expect(smallHm.getRecent(100).length).toBeLessThanOrEqual(5);
    });
  });

  describe('persistence', () => {
    it('persists history across instances', () => {
      hm.addVisit('https://persist.com', 'Persist');
      const hm2 = new HistoryManager(tempDir);
      expect(hm2.getRecent(10)).toHaveLength(1);
    });
  });
});
