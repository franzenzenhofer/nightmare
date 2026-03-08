import type { HistoryEntry } from './history';
import type { Bookmark } from './bookmarks';

export type SuggestionType = 'history' | 'bookmark' | 'search' | 'url';

export interface Suggestion {
  readonly type: SuggestionType;
  readonly title: string;
  readonly url: string;
  readonly score: number;
}

const MAX_SUGGESTIONS = 10;
const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=';
const SCORE_EXACT_URL = 100;
const SCORE_TITLE_STARTS_WITH = 75;
const SCORE_URL_CONTAINS = 50;
const SCORE_TITLE_CONTAINS = 25;
const SCORE_URL_SUGGESTION = 90;
const SCORE_SEARCH_SUGGESTION = 10;

function looksLikeUrl(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.startsWith('http://')) return true;
  if (trimmed.startsWith('https://')) return true;
  if (trimmed.startsWith('file://')) return true;
  return trimmed.includes('.');
}

function hasScheme(query: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(query.trim());
}

function normalizeUrl(query: string): string {
  const trimmed = query.trim();
  if (hasScheme(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function scoreEntry(query: string, url: string, title: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();
  if (lowerUrl === lowerQuery) return SCORE_EXACT_URL;
  if (lowerTitle.startsWith(lowerQuery)) return SCORE_TITLE_STARTS_WITH;
  if (lowerUrl.includes(lowerQuery)) return SCORE_URL_CONTAINS;
  if (lowerTitle.includes(lowerQuery)) return SCORE_TITLE_CONTAINS;
  return 0;
}

function buildSearchSuggestion(query: string): Suggestion {
  const encoded = encodeURIComponent(query).replace(/%20/g, '+');
  return {
    type: 'search',
    title: `Search Google for "${query}"`,
    url: `${GOOGLE_SEARCH_URL}${encoded}`,
    score: SCORE_SEARCH_SUGGESTION,
  };
}

function buildUrlSuggestion(query: string): Suggestion {
  return {
    type: 'url',
    title: query.trim(),
    url: normalizeUrl(query),
    score: SCORE_URL_SUGGESTION,
  };
}

interface Matchable {
  readonly url: string;
  readonly title: string;
}

function scoreEntries(
  query: string,
  entries: readonly Matchable[],
  type: SuggestionType,
): Suggestion[] {
  const lowerQuery = query.toLowerCase();
  return entries
    .filter((e) => {
      const lUrl = e.url.toLowerCase();
      const lTitle = e.title.toLowerCase();
      return lUrl.includes(lowerQuery) || lTitle.includes(lowerQuery);
    })
    .map((e) => ({
      type,
      title: e.title,
      url: e.url,
      score: scoreEntry(query, e.url, e.title),
    }));
}

function deduplicateByUrl(suggestions: Suggestion[]): Suggestion[] {
  const seen = new Map<string, Suggestion>();
  for (const s of suggestions) {
    const existing = seen.get(s.url);
    if (existing === undefined) {
      seen.set(s.url, s);
    } else if (s.type === 'bookmark' && existing.type !== 'bookmark') {
      seen.set(s.url, s);
    } else if (s.score > existing.score) {
      seen.set(s.url, s);
    }
  }
  return [...seen.values()];
}

export function suggest(
  query: string,
  history: readonly HistoryEntry[],
  bookmarks: readonly Bookmark[],
): Suggestion[] {
  const trimmed = query.trim();
  if (trimmed === '') return [];

  const results: Suggestion[] = [];
  results.push(...scoreEntries(trimmed, bookmarks, 'bookmark'));
  results.push(...scoreEntries(trimmed, history, 'history'));

  const deduplicated = deduplicateByUrl(results);

  if (looksLikeUrl(trimmed)) {
    deduplicated.push(buildUrlSuggestion(trimmed));
  } else {
    deduplicated.push(buildSearchSuggestion(trimmed));
  }

  deduplicated.sort((a, b) => b.score - a.score);
  return deduplicated.slice(0, MAX_SUGGESTIONS);
}
