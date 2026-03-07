import { describe, it, expect } from 'vitest';
import { getSuggestions } from '../components/url-input';
import type { HistoryEntry } from '../services/history';
import type { Bookmark } from '../services/bookmarks';

function makeHistory(
  url: string,
  title: string,
  visitCount: number,
): HistoryEntry {
  return { url, title, visitedAt: Date.now(), visitCount, sequence: 1 };
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

describe('getSuggestions', () => {
  it('returns empty array for empty query', () => {
    const result = getSuggestions('', [], []);
    expect(result).toEqual([]);
  });

  it('matches history by URL (case-insensitive)', () => {
    const history = [makeHistory('https://Example.com', 'Ex', 5)];
    const result = getSuggestions('example', history, []);
    expect(result.length).toBe(1);
    expect(result[0]?.type).toBe('history');
    expect(result[0]?.url).toBe('https://Example.com');
  });

  it('matches history by title (case-insensitive)', () => {
    const history = [makeHistory('https://foo.com', 'My Blog', 3)];
    const result = getSuggestions('blog', history, []);
    expect(result.length).toBe(1);
    expect(result[0]?.text).toBe('My Blog');
  });

  it('sorts history matches by visitCount descending', () => {
    const history = [
      makeHistory('https://a.com', 'A', 2),
      makeHistory('https://b.com', 'B', 10),
      makeHistory('https://c.com', 'C', 5),
    ];
    const result = getSuggestions('.com', history, []);
    expect(result.map((r) => r.url)).toEqual([
      'https://b.com',
      'https://c.com',
      'https://a.com',
    ]);
  });

  it('matches bookmarks by URL', () => {
    const bookmarks = [makeBookmark('https://github.com', 'GitHub')];
    const result = getSuggestions('github', [], bookmarks);
    expect(result.length).toBe(1);
    expect(result[0]?.type).toBe('bookmark');
  });

  it('matches bookmarks by title', () => {
    const bookmarks = [makeBookmark('https://x.com', 'Twitter Clone')];
    const result = getSuggestions('twitter', [], bookmarks);
    expect(result[0]?.type).toBe('bookmark');
    expect(result[0]?.text).toBe('Twitter Clone');
  });

  it('returns max 8 results', () => {
    const history = Array.from({ length: 10 }, (_, i) =>
      makeHistory(`https://site${i}.com`, `Site ${i}`, 1),
    );
    const result = getSuggestions('site', history, []);
    expect(result.length).toBe(8);
  });

  it('deduplicates same URL from history and bookmark', () => {
    const history = [makeHistory('https://dup.com', 'Dup', 5)];
    const bookmarks = [makeBookmark('https://dup.com', 'Dup Bookmark')];
    const result = getSuggestions('dup', history, bookmarks);
    const urls = result.map((r) => r.url);
    const dupCount = urls.filter((u) => u === 'https://dup.com').length;
    expect(dupCount).toBe(1);
    expect(result[0]?.type).toBe('bookmark');
  });

  it('returns search suggestion when no matches found', () => {
    const result = getSuggestions('xyznotfound', [], []);
    expect(result.length).toBe(1);
    expect(result[0]?.type).toBe('search');
    expect(result[0]?.text).toBe('Search for "xyznotfound"');
  });

  it('includes search suggestion URL with encoded query', () => {
    const result = getSuggestions('hello world', [], []);
    expect(result[0]?.url).toBe(
      'https://www.google.com/search?q=hello%20world',
    );
  });

  it('does not return search suggestion when matches exist', () => {
    const history = [makeHistory('https://test.com', 'Test', 1)];
    const result = getSuggestions('test', history, []);
    const searchSuggestions = result.filter((r) => r.type === 'search');
    expect(searchSuggestions.length).toBe(0);
  });
});
