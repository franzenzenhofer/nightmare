import type { Bookmark, BookmarkFolder } from './bookmarks';
import { renderFolder, parseHtmlLines } from './bookmark-io-html';

interface BookmarkData {
  readonly bookmarks: readonly Bookmark[];
  readonly folders: readonly BookmarkFolder[];
}

const NETSCAPE_HEADER = '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>';

export function exportToJson(
  bookmarks: readonly Bookmark[],
  folders: readonly BookmarkFolder[],
): string {
  return JSON.stringify({ bookmarks, folders }, null, 2);
}

export function importFromJson(json: string): BookmarkData {
  const parsed: unknown = JSON.parse(json);
  return validateBookmarkData(parsed);
}

export function exportToNetscapeHtml(
  bookmarks: readonly Bookmark[],
  folders: readonly BookmarkFolder[],
): string {
  const body = renderFolder(null, bookmarks, folders, 0);
  return `${NETSCAPE_HEADER}\n${body}\n`;
}

export function importFromNetscapeHtml(html: string): BookmarkData {
  const bookmarks: Bookmark[] = [];
  const folders: BookmarkFolder[] = [];
  if (html.trim() === '') return { bookmarks, folders };
  parseHtmlLines(html, bookmarks, folders);
  return { bookmarks, folders };
}

function validateBookmarkData(data: unknown): BookmarkData {
  if (typeof data !== 'object' || data === null) throw new Error('Invalid bookmark data');
  const record = data as Record<string, unknown>;
  if (!Array.isArray(record['bookmarks'])) throw new Error('Missing bookmarks array');
  if (!Array.isArray(record['folders'])) throw new Error('Missing folders array');
  (record['bookmarks'] as unknown[]).forEach(validateBookmark);
  (record['folders'] as unknown[]).forEach(validateFolder);
  return data as BookmarkData;
}

function validateBookmark(item: unknown): void {
  if (typeof item !== 'object' || item === null) throw new Error('Invalid bookmark');
  const b = item as Record<string, unknown>;
  if (typeof b['title'] !== 'string') throw new Error('Bookmark missing title');
  if (typeof b['url'] !== 'string') throw new Error('Bookmark missing url');
  if (typeof b['id'] !== 'string') throw new Error('Bookmark missing id');
}

function validateFolder(item: unknown): void {
  if (typeof item !== 'object' || item === null) throw new Error('Invalid folder');
  const f = item as Record<string, unknown>;
  if (typeof f['name'] !== 'string') throw new Error('Folder missing name');
  if (typeof f['id'] !== 'string') throw new Error('Folder missing id');
}
