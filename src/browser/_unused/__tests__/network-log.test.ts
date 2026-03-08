import { describe, it, expect, beforeEach } from 'vitest';
import { NetworkLog } from '../services/network-log';
import type { NetworkEntry, NetworkFilter, NetworkStats } from '../services/network-log';

function makeEntry(overrides: Partial<NetworkEntry> = {}): NetworkEntry {
  return {
    id: overrides.id ?? 'req-1',
    tabId: overrides.tabId ?? 'tab1',
    url: overrides.url ?? 'https://example.com/api',
    method: overrides.method ?? 'GET',
    status: overrides.status ?? 200,
    statusText: overrides.statusText ?? 'OK',
    requestHeaders: overrides.requestHeaders ?? new Map(),
    responseHeaders: overrides.responseHeaders ?? new Map(),
    startTime: overrides.startTime ?? 1000,
    duration: overrides.duration ?? 50,
    size: overrides.size ?? 1024,
    mimeType: overrides.mimeType ?? 'application/json',
  };
}

let log: NetworkLog;

beforeEach(() => {
  log = new NetworkLog();
});

describe('NetworkLog', () => {
  describe('add', () => {
    it('adds an entry and retrieves it by tabId', () => {
      const entry = makeEntry();
      log.add(entry);
      const entries = log.getEntries('tab1');
      expect(entries).toHaveLength(1);
      expect(entries[0]?.url).toBe('https://example.com/api');
    });

    it('stores all fields correctly', () => {
      const reqHeaders = new Map([['Accept', 'text/html']]);
      const resHeaders = new Map([['Content-Type', 'text/html']]);
      const entry = makeEntry({
        id: 'req-full',
        tabId: 'tab-full',
        url: 'https://site.com/page',
        method: 'POST',
        status: 201,
        statusText: 'Created',
        requestHeaders: reqHeaders,
        responseHeaders: resHeaders,
        startTime: 5000,
        duration: 120,
        size: 2048,
        mimeType: 'text/html',
      });
      log.add(entry);
      const result = log.getEntries('tab-full')[0];
      expect(result?.id).toBe('req-full');
      expect(result?.method).toBe('POST');
      expect(result?.status).toBe(201);
      expect(result?.statusText).toBe('Created');
      expect(result?.requestHeaders.get('Accept')).toBe('text/html');
      expect(result?.responseHeaders.get('Content-Type')).toBe('text/html');
      expect(result?.startTime).toBe(5000);
      expect(result?.duration).toBe(120);
      expect(result?.size).toBe(2048);
      expect(result?.mimeType).toBe('text/html');
    });

    it('separates entries by tab', () => {
      log.add(makeEntry({ id: 'r1', tabId: 'tab1' }));
      log.add(makeEntry({ id: 'r2', tabId: 'tab2' }));
      expect(log.getEntries('tab1')).toHaveLength(1);
      expect(log.getEntries('tab2')).toHaveLength(1);
    });
  });

  describe('ring buffer', () => {
    it('enforces default max of 5000 per tab', () => {
      for (let i = 0; i < 5010; i++) {
        log.add(makeEntry({ id: `r-${String(i)}`, tabId: 'tab1' }));
      }
      expect(log.getEntries('tab1')).toHaveLength(5000);
    });

    it('drops oldest entries when buffer is full', () => {
      const small = new NetworkLog(3);
      small.add(makeEntry({ id: 'r1', url: 'https://a.com' }));
      small.add(makeEntry({ id: 'r2', url: 'https://b.com' }));
      small.add(makeEntry({ id: 'r3', url: 'https://c.com' }));
      small.add(makeEntry({ id: 'r4', url: 'https://d.com' }));
      const entries = small.getEntries('tab1');
      expect(entries).toHaveLength(3);
      expect(entries[0]?.url).toBe('https://b.com');
      expect(entries[2]?.url).toBe('https://d.com');
    });

    it('uses configurable max size', () => {
      const tiny = new NetworkLog(2);
      tiny.add(makeEntry({ id: 'r1' }));
      tiny.add(makeEntry({ id: 'r2' }));
      tiny.add(makeEntry({ id: 'r3' }));
      expect(tiny.getEntries('tab1')).toHaveLength(2);
    });

    it('does not affect other tabs when one overflows', () => {
      const small = new NetworkLog(2);
      small.add(makeEntry({ id: 'r1', tabId: 'tab1' }));
      small.add(makeEntry({ id: 'r2', tabId: 'tab1' }));
      small.add(makeEntry({ id: 'r3', tabId: 'tab1' }));
      small.add(makeEntry({ id: 'r4', tabId: 'tab2' }));
      expect(small.getEntries('tab1')).toHaveLength(2);
      expect(small.getEntries('tab2')).toHaveLength(1);
    });
  });

  describe('getEntries', () => {
    it('returns empty array for unknown tab', () => {
      expect(log.getEntries('nonexistent')).toHaveLength(0);
    });

    it('returns a copy of entries', () => {
      log.add(makeEntry());
      const a = log.getEntries('tab1');
      const b = log.getEntries('tab1');
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('filter', () => {
    beforeEach(() => {
      log.add(makeEntry({ id: 'r1', tabId: 'tab1', url: 'https://api.com/users', method: 'GET', status: 200 }));
      log.add(makeEntry({ id: 'r2', tabId: 'tab1', url: 'https://api.com/posts', method: 'POST', status: 201 }));
      log.add(makeEntry({ id: 'r3', tabId: 'tab1', url: 'https://cdn.com/image.png', method: 'GET', status: 304 }));
      log.add(makeEntry({ id: 'r4', tabId: 'tab2', url: 'https://api.com/error', method: 'GET', status: 500 }));
    });

    it('filters by tabId', () => {
      const results = log.filter({ tabId: 'tab1' });
      expect(results).toHaveLength(3);
    });

    it('filters by URL pattern', () => {
      const results = log.filter({ urlPattern: 'api.com' });
      expect(results).toHaveLength(3);
    });

    it('filters by method', () => {
      const results = log.filter({ method: 'POST' });
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('r2');
    });

    it('filters by status range (min only)', () => {
      const results = log.filter({ statusMin: 300 });
      expect(results).toHaveLength(2);
    });

    it('filters by status range (max only)', () => {
      const results = log.filter({ statusMax: 201 });
      expect(results).toHaveLength(2);
    });

    it('filters by status range (min and max)', () => {
      const results = log.filter({ statusMin: 200, statusMax: 299 });
      expect(results).toHaveLength(2);
      expect(results[0]?.id).toBe('r1');
      expect(results[1]?.id).toBe('r2');
    });

    it('combines multiple filters', () => {
      const results = log.filter({ tabId: 'tab1', method: 'GET', statusMax: 299 });
      expect(results).toHaveLength(1);
      expect(results[0]?.url).toBe('https://api.com/users');
    });

    it('returns all entries when no filter is given', () => {
      const results = log.filter({});
      expect(results).toHaveLength(4);
    });

    it('returns empty array when nothing matches', () => {
      const results = log.filter({ method: 'DELETE' });
      expect(results).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('clears entries for a specific tab', () => {
      log.add(makeEntry({ id: 'r1', tabId: 'tab1' }));
      log.add(makeEntry({ id: 'r2', tabId: 'tab2' }));
      log.clear('tab1');
      expect(log.getEntries('tab1')).toHaveLength(0);
      expect(log.getEntries('tab2')).toHaveLength(1);
    });

    it('is safe to clear an unknown tab', () => {
      expect(() => log.clear('ghost')).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('removes all entries from all tabs', () => {
      log.add(makeEntry({ id: 'r1', tabId: 'tab1' }));
      log.add(makeEntry({ id: 'r2', tabId: 'tab2' }));
      log.clearAll();
      expect(log.getEntries('tab1')).toHaveLength(0);
      expect(log.getEntries('tab2')).toHaveLength(0);
      expect(log.getAllEntries()).toHaveLength(0);
    });
  });

  describe('getAllEntries', () => {
    it('returns entries from all tabs sorted by startTime', () => {
      log.add(makeEntry({ id: 'r2', tabId: 'tab2', startTime: 2000 }));
      log.add(makeEntry({ id: 'r1', tabId: 'tab1', startTime: 1000 }));
      log.add(makeEntry({ id: 'r3', tabId: 'tab1', startTime: 3000 }));
      const all = log.getAllEntries();
      expect(all).toHaveLength(3);
      expect(all[0]?.id).toBe('r1');
      expect(all[1]?.id).toBe('r2');
      expect(all[2]?.id).toBe('r3');
    });

    it('returns empty array when no entries exist', () => {
      expect(log.getAllEntries()).toHaveLength(0);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      log.add(makeEntry({ id: 'r1', tabId: 'tab1', url: 'https://api.example.com/users' }));
      log.add(makeEntry({ id: 'r2', tabId: 'tab2', url: 'https://cdn.example.com/images/cat.png', mimeType: 'image/png' }));
      log.add(makeEntry({ id: 'r3', tabId: 'tab1', url: 'https://other.com/api' }));
    });

    it('searches URL across all tabs', () => {
      const results = log.search('example.com');
      expect(results).toHaveLength(2);
    });

    it('is case-insensitive', () => {
      const results = log.search('EXAMPLE.COM');
      expect(results).toHaveLength(2);
    });

    it('returns empty for no match', () => {
      expect(log.search('nonexistent.xyz')).toHaveLength(0);
    });

    it('matches partial URLs', () => {
      const results = log.search('/users');
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('r1');
    });
  });

  describe('getStats', () => {
    it('returns zero stats for an empty tab', () => {
      const stats = log.getStats('empty-tab');
      expect(stats.totalRequests).toBe(0);
      expect(stats.avgDuration).toBe(0);
      expect(stats.errorCount).toBe(0);
      expect(stats.totalSize).toBe(0);
    });

    it('calculates total requests', () => {
      log.add(makeEntry({ id: 'r1', tabId: 'tab1' }));
      log.add(makeEntry({ id: 'r2', tabId: 'tab1' }));
      const stats = log.getStats('tab1');
      expect(stats.totalRequests).toBe(2);
    });

    it('calculates average duration', () => {
      log.add(makeEntry({ id: 'r1', tabId: 'tab1', duration: 100 }));
      log.add(makeEntry({ id: 'r2', tabId: 'tab1', duration: 200 }));
      log.add(makeEntry({ id: 'r3', tabId: 'tab1', duration: 300 }));
      const stats = log.getStats('tab1');
      expect(stats.avgDuration).toBe(200);
    });

    it('counts errors (status >= 400)', () => {
      log.add(makeEntry({ id: 'r1', tabId: 'tab1', status: 200 }));
      log.add(makeEntry({ id: 'r2', tabId: 'tab1', status: 404 }));
      log.add(makeEntry({ id: 'r3', tabId: 'tab1', status: 500 }));
      log.add(makeEntry({ id: 'r4', tabId: 'tab1', status: 301 }));
      const stats = log.getStats('tab1');
      expect(stats.errorCount).toBe(2);
    });

    it('calculates total size', () => {
      log.add(makeEntry({ id: 'r1', tabId: 'tab1', size: 1000 }));
      log.add(makeEntry({ id: 'r2', tabId: 'tab1', size: 2500 }));
      const stats = log.getStats('tab1');
      expect(stats.totalSize).toBe(3500);
    });

    it('only counts entries for the specified tab', () => {
      log.add(makeEntry({ id: 'r1', tabId: 'tab1', status: 500 }));
      log.add(makeEntry({ id: 'r2', tabId: 'tab2', status: 500 }));
      const stats = log.getStats('tab1');
      expect(stats.totalRequests).toBe(1);
      expect(stats.errorCount).toBe(1);
    });
  });
});
