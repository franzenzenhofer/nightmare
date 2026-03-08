import type { HistoryEntry } from '../services/history';
import type { Bookmark } from '../services/bookmarks';

export interface Suggestion {
  readonly type: 'history' | 'bookmark' | 'search';
  readonly text: string;
  readonly url: string;
}

const MAX_SUGGESTIONS = 8;

export function getSuggestions(
  query: string,
  history: ReadonlyArray<HistoryEntry>,
  bookmarks: ReadonlyArray<Bookmark>,
): Suggestion[] {
  if (query === '') return [];

  const lower = query.toLowerCase();
  const seen = new Set<string>();

  const bookmarkMatches = matchBookmarks(bookmarks, lower, seen);
  const historyMatches = matchHistory(history, lower, seen);
  const combined = [...bookmarkMatches, ...historyMatches];

  if (combined.length === 0) {
    return [buildSearchSuggestion(query)];
  }

  return combined.slice(0, MAX_SUGGESTIONS);
}

function matchBookmarks(
  bookmarks: ReadonlyArray<Bookmark>,
  lower: string,
  seen: Set<string>,
): Suggestion[] {
  return bookmarks
    .filter((b) => matchesQuery(b.url, b.title, lower))
    .map((b): Suggestion => {
      seen.add(b.url);
      return { type: 'bookmark', text: b.title, url: b.url };
    });
}

function matchHistory(
  history: ReadonlyArray<HistoryEntry>,
  lower: string,
  seen: Set<string>,
): Suggestion[] {
  return [...history]
    .filter((h) => !seen.has(h.url) && matchesQuery(h.url, h.title, lower))
    .sort((a, b) => b.visitCount - a.visitCount)
    .map((h): Suggestion => ({ type: 'history', text: h.title, url: h.url }));
}

function matchesQuery(url: string, title: string, lower: string): boolean {
  return (
    url.toLowerCase().includes(lower) || title.toLowerCase().includes(lower)
  );
}

function buildSearchSuggestion(query: string): Suggestion {
  const encoded = encodeURIComponent(query);
  return {
    type: 'search',
    text: `Search for "${query}"`,
    url: `https://www.google.com/search?q=${encoded}`,
  };
}
