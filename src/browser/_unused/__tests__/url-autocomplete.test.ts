import { describe, it, expect } from 'vitest';
import type { HistoryEntry } from '../services/history';
import type { Bookmark } from '../services/bookmarks';
import { suggest } from '../services/url-autocomplete';
import type { Suggestion } from '../services/url-autocomplete';

function makeHistory(
  url: string,
  title: string,
  visitCount: number = 1,
): HistoryEntry {
  return { url, title, visitedAt: Date.now(), visitCount, sequence: 0 };
}

function makeBookmark(url: string, title: string): Bookmark {
  return {
    id: crypto.randomUUID(),
    title,
    url,
    favicon: null,
    folderId: null,
    createdAt: Date.now(),
    position: 0,
  };
}

const EMPTY_HISTORY: readonly HistoryEntry[] = [];
const EMPTY_BOOKMARKS: readonly Bookmark[] = [];

describe('url-autocomplete', () => {
  describe('suggest', () => {
    it('returns empty array for empty query', () => {
      const results = suggest('', EMPTY_HISTORY, EMPTY_BOOKMARKS);
      expect(results).toEqual([]);
    });

    it('returns search suggestion for plain text query', () => {
      const results = suggest('cats', EMPTY_HISTORY, EMPTY_BOOKMARKS);
      expect(results).toHaveLength(1);
      expect(results[0]?.type).toBe('search');
      expect(results[0]?.url).toContain('google.com');
      expect(results[0]?.url).toContain('cats');
    });

    it('returns url suggestion when query contains a dot', () => {
      const results = suggest('example.com', EMPTY_HISTORY, EMPTY_BOOKMARKS);
      const urlSuggestion = results.find((s) => s.type === 'url');
      expect(urlSuggestion).toBeDefined();
      expect(urlSuggestion?.url).toBe('https://example.com');
    });

    it('returns url suggestion when query starts with http', () => {
      const results = suggest(
        'http://localhost:3000',
        EMPTY_HISTORY,
        EMPTY_BOOKMARKS,
      );
      const urlSuggestion = results.find((s) => s.type === 'url');
      expect(urlSuggestion).toBeDefined();
      expect(urlSuggestion?.url).toBe('http://localhost:3000');
    });

    it('returns url suggestion when query starts with file://', () => {
      const results = suggest(
        'file:///tmp/test.html',
        EMPTY_HISTORY,
        EMPTY_BOOKMARKS,
      );
      const urlSuggestion = results.find((s) => s.type === 'url');
      expect(urlSuggestion).toBeDefined();
      expect(urlSuggestion?.url).toBe('file:///tmp/test.html');
    });

    it('does not add https prefix when query already has a scheme', () => {
      const results = suggest(
        'https://example.com',
        EMPTY_HISTORY,
        EMPTY_BOOKMARKS,
      );
      const urlSuggestion = results.find((s) => s.type === 'url');
      expect(urlSuggestion?.url).toBe('https://example.com');
    });

    it('matches history entries by URL', () => {
      const history = [makeHistory('https://github.com', 'GitHub')];
      const results = suggest('github', history, EMPTY_BOOKMARKS);
      const match = results.find((s) => s.type === 'history');
      expect(match).toBeDefined();
      expect(match?.url).toBe('https://github.com');
    });

    it('matches history entries by title', () => {
      const history = [makeHistory('https://example.com', 'My Portfolio')];
      const results = suggest('portfolio', history, EMPTY_BOOKMARKS);
      const match = results.find((s) => s.type === 'history');
      expect(match).toBeDefined();
      expect(match?.title).toBe('My Portfolio');
    });

    it('matches bookmark entries by URL', () => {
      const bookmarks = [makeBookmark('https://docs.rs', 'Rust Docs')];
      const results = suggest('docs.rs', EMPTY_HISTORY, bookmarks);
      const match = results.find((s) => s.type === 'bookmark');
      expect(match).toBeDefined();
      expect(match?.url).toBe('https://docs.rs');
    });

    it('matches bookmark entries by title', () => {
      const bookmarks = [makeBookmark('https://x.com', 'Twitter Clone')];
      const results = suggest('twitter', EMPTY_HISTORY, bookmarks);
      const match = results.find((s) => s.type === 'bookmark');
      expect(match).toBeDefined();
      expect(match?.title).toBe('Twitter Clone');
    });

    it('is case-insensitive', () => {
      const history = [makeHistory('https://GitHub.com', 'GitHub')];
      const results = suggest('GITHUB', history, EMPTY_BOOKMARKS);
      const match = results.find((s) => s.type === 'history');
      expect(match).toBeDefined();
    });
  });

  describe('ranking', () => {
    it('ranks exact URL match highest', () => {
      const history = [
        makeHistory('https://example.com', 'Example Site'),
        makeHistory('https://example.com/deep/page', 'Deep Page'),
      ];
      const results = suggest('https://example.com', history, EMPTY_BOOKMARKS);
      const historyResults = results.filter((s) => s.type === 'history');
      const exact = historyResults.find(
        (s) => s.url === 'https://example.com',
      );
      const partial = historyResults.find(
        (s) => s.url === 'https://example.com/deep/page',
      );
      expect(exact).toBeDefined();
      expect(partial).toBeDefined();
      expect(exact!.score).toBeGreaterThan(partial!.score);
    });

    it('ranks title-starts-with higher than URL-contains', () => {
      const history = [
        makeHistory('https://xyzgithub.com/page', 'Some Page'),
        makeHistory('https://example.com', 'GitHub Dashboard'),
      ];
      const results = suggest('github', history, EMPTY_BOOKMARKS);
      const historyResults = results.filter((s) => s.type === 'history');
      expect(historyResults[0]?.title).toBe('GitHub Dashboard');
    });

    it('ranks URL-contains higher than title-contains', () => {
      const history = [
        makeHistory('https://example.com', 'My GitHub Page'),
        makeHistory('https://github.com/repo', 'Repository'),
      ];
      const results = suggest('github', history, EMPTY_BOOKMARKS);
      const historyResults = results.filter((s) => s.type === 'history');
      expect(historyResults[0]?.url).toBe('https://github.com/repo');
    });

    it('returns results sorted by score descending', () => {
      const history = [
        makeHistory('https://other.com', 'Contains react in title'),
        makeHistory('https://react.dev', 'React'),
        makeHistory('https://example.com/react', 'Tutorial'),
      ];
      const results = suggest('react', history, EMPTY_BOOKMARKS);
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1];
        const curr = results[i];
        if (prev !== undefined && curr !== undefined) {
          expect(prev.score).toBeGreaterThanOrEqual(curr.score);
        }
      }
    });
  });

  describe('limits', () => {
    it('returns at most 10 suggestions', () => {
      const history = Array.from({ length: 20 }, (_, i) =>
        makeHistory(`https://site${String(i)}.com`, `Site ${String(i)}`),
      );
      const results = suggest('site', history, EMPTY_BOOKMARKS);
      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  describe('deduplication', () => {
    it('deduplicates URL across history and bookmarks', () => {
      const history = [makeHistory('https://github.com', 'GitHub')];
      const bookmarks = [makeBookmark('https://github.com', 'GitHub BM')];
      const results = suggest('github', history, bookmarks);
      const githubResults = results.filter(
        (s) => s.url === 'https://github.com',
      );
      expect(githubResults).toHaveLength(1);
    });

    it('prefers bookmark over history when deduplicating', () => {
      const history = [makeHistory('https://github.com', 'GitHub History')];
      const bookmarks = [
        makeBookmark('https://github.com', 'GitHub Bookmark'),
      ];
      const results = suggest('github', history, bookmarks);
      const match = results.find((s) => s.url === 'https://github.com');
      expect(match?.type).toBe('bookmark');
    });
  });

  describe('search engine query', () => {
    it('encodes query in search URL', () => {
      const results = suggest(
        'hello world',
        EMPTY_HISTORY,
        EMPTY_BOOKMARKS,
      );
      const search = results.find((s) => s.type === 'search');
      expect(search?.url).toContain('hello+world');
    });

    it('always includes search suggestion for non-URL queries', () => {
      const history = [makeHistory('https://cats.com', 'Cats')];
      const results = suggest('cats', history, EMPTY_BOOKMARKS);
      const search = results.find((s) => s.type === 'search');
      expect(search).toBeDefined();
    });

    it('does not include search suggestion for URL-like queries', () => {
      const results = suggest(
        'https://example.com',
        EMPTY_HISTORY,
        EMPTY_BOOKMARKS,
      );
      const search = results.find((s) => s.type === 'search');
      expect(search).toBeUndefined();
    });
  });

  describe('suggestion shape', () => {
    it('each suggestion has type, title, url, and score', () => {
      const history = [makeHistory('https://example.com', 'Example')];
      const results = suggest('example', history, EMPTY_BOOKMARKS);
      for (const s of results) {
        expect(s).toHaveProperty('type');
        expect(s).toHaveProperty('title');
        expect(s).toHaveProperty('url');
        expect(s).toHaveProperty('score');
        expect(typeof s.score).toBe('number');
      }
    });

    it('search suggestion has descriptive title', () => {
      const results = suggest('test query', EMPTY_HISTORY, EMPTY_BOOKMARKS);
      const search = results.find((s) => s.type === 'search');
      expect(search?.title).toContain('test query');
    });
  });
});
