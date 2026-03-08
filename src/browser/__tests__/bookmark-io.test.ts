import { describe, it, expect } from 'vitest';
import type { Bookmark, BookmarkFolder } from '../services/bookmarks';
import {
  exportToJson,
  importFromJson,
  exportToNetscapeHtml,
  importFromNetscapeHtml,
} from '../services/bookmark-io';

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: crypto.randomUUID(),
    title: 'Test',
    url: 'https://example.com',
    favicon: null,
    folderId: null,
    createdAt: 1700000000000,
    position: 0,
    ...overrides,
  };
}

function makeFolder(overrides: Partial<BookmarkFolder> = {}): BookmarkFolder {
  return {
    id: crypto.randomUUID(),
    name: 'Folder',
    parentId: null,
    position: 0,
    ...overrides,
  };
}

describe('exportToJson', () => {
  it('exports empty collections as valid JSON', () => {
    const result = exportToJson([], []);
    const parsed = JSON.parse(result) as { bookmarks: Bookmark[]; folders: BookmarkFolder[] };
    expect(parsed.bookmarks).toEqual([]);
    expect(parsed.folders).toEqual([]);
  });

  it('exports bookmarks and folders preserving all fields', () => {
    const bm = makeBookmark({ title: 'Google', url: 'https://google.com' });
    const folder = makeFolder({ name: 'Dev' });
    const result = exportToJson([bm], [folder]);
    const parsed = JSON.parse(result) as { bookmarks: Bookmark[]; folders: BookmarkFolder[] };
    expect(parsed.bookmarks).toHaveLength(1);
    expect(parsed.bookmarks[0]?.title).toBe('Google');
    expect(parsed.folders).toHaveLength(1);
    expect(parsed.folders[0]?.name).toBe('Dev');
  });

  it('produces valid JSON string', () => {
    const bm = makeBookmark();
    expect(() => JSON.parse(exportToJson([bm], []))).not.toThrow();
  });
});

describe('importFromJson', () => {
  it('imports valid JSON bookmark data', () => {
    const bm = makeBookmark({ title: 'Imported' });
    const folder = makeFolder({ name: 'ImportedFolder' });
    const json = exportToJson([bm], [folder]);
    const result = importFromJson(json);
    expect(result.bookmarks).toHaveLength(1);
    expect(result.bookmarks[0]?.title).toBe('Imported');
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0]?.name).toBe('ImportedFolder');
  });

  it('throws on invalid JSON', () => {
    expect(() => importFromJson('not json at all')).toThrow();
  });

  it('throws when bookmarks array is missing', () => {
    expect(() => importFromJson('{"folders": []}')).toThrow();
  });

  it('throws when folders array is missing', () => {
    expect(() => importFromJson('{"bookmarks": []}')).toThrow();
  });

  it('throws when bookmark is missing required fields', () => {
    const bad = JSON.stringify({
      bookmarks: [{ id: '1' }],
      folders: [],
    });
    expect(() => importFromJson(bad)).toThrow();
  });

  it('throws when bookmark is not an object', () => {
    const bad = JSON.stringify({ bookmarks: ['not-an-object'], folders: [] });
    expect(() => importFromJson(bad)).toThrow('Invalid bookmark');
  });

  it('throws when bookmark has title but no url', () => {
    const bad = JSON.stringify({ bookmarks: [{ id: '1', title: 'x' }], folders: [] });
    expect(() => importFromJson(bad)).toThrow('Bookmark missing url');
  });

  it('throws when data is null', () => {
    expect(() => importFromJson('null')).toThrow('Invalid bookmark data');
  });

  it('throws when data is a primitive', () => {
    expect(() => importFromJson('"string"')).toThrow('Invalid bookmark data');
  });

  it('throws when folder is missing required fields', () => {
    const bad = JSON.stringify({
      bookmarks: [],
      folders: [{ id: '1' }],
    });
    expect(() => importFromJson(bad)).toThrow();
  });

  it('throws when folder is null', () => {
    const bad = JSON.stringify({
      bookmarks: [],
      folders: [null],
    });
    expect(() => importFromJson(bad)).toThrow('Invalid folder');
  });

  it('throws when bookmark is null', () => {
    const bad = JSON.stringify({
      bookmarks: [null],
      folders: [],
    });
    expect(() => importFromJson(bad)).toThrow('Invalid bookmark');
  });

  it('round-trips through export and import', () => {
    const folderId = crypto.randomUUID();
    const folder = makeFolder({ id: folderId, name: 'Work' });
    const bm = makeBookmark({ title: 'Task', url: 'https://task.com', folderId });
    const json = exportToJson([bm], [folder]);
    const result = importFromJson(json);
    expect(result.bookmarks[0]?.folderId).toBe(folderId);
    expect(result.folders[0]?.id).toBe(folderId);
  });
});

describe('exportToNetscapeHtml', () => {
  it('produces valid HTML with DOCTYPE', () => {
    const html = exportToNetscapeHtml([], []);
    expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
  });

  it('exports root-level bookmarks as DT A tags', () => {
    const bm = makeBookmark({ title: 'Google', url: 'https://google.com' });
    const html = exportToNetscapeHtml([bm], []);
    expect(html).toContain('HREF="https://google.com"');
    expect(html).toContain('Google');
  });

  it('exports folders as DT H3 with nested DL', () => {
    const folderId = crypto.randomUUID();
    const folder = makeFolder({ id: folderId, name: 'Dev Tools' });
    const bm = makeBookmark({ title: 'Docs', url: 'https://docs.dev', folderId });
    const html = exportToNetscapeHtml([bm], [folder]);
    expect(html).toContain('<DT><H3>Dev Tools</H3>');
    expect(html).toContain('HREF="https://docs.dev"');
  });

  it('handles nested folders', () => {
    const parentId = crypto.randomUUID();
    const childId = crypto.randomUUID();
    const parent = makeFolder({ id: parentId, name: 'Parent' });
    const child = makeFolder({ id: childId, name: 'Child', parentId });
    const bm = makeBookmark({ title: 'Deep', url: 'https://deep.com', folderId: childId });
    const html = exportToNetscapeHtml([bm], [parent, child]);
    expect(html).toContain('<DT><H3>Parent</H3>');
    expect(html).toContain('<DT><H3>Child</H3>');
    expect(html).toContain('HREF="https://deep.com"');
  });

  it('escapes HTML entities in title and url', () => {
    const bm = makeBookmark({
      title: 'A & B <script>',
      url: 'https://example.com?a=1&b=2',
    });
    const html = exportToNetscapeHtml([bm], []);
    expect(html).toContain('A &amp; B &lt;script&gt;');
    expect(html).toContain('HREF="https://example.com?a=1&amp;b=2"');
  });
});

describe('importFromNetscapeHtml', () => {
  it('imports bookmarks from Netscape HTML', () => {
    const html = [
      '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
      '<DL><p>',
      '<DT><A HREF="https://google.com">Google</A>',
      '<DT><A HREF="https://github.com">GitHub</A>',
      '</DL><p>',
    ].join('\n');
    const result = importFromNetscapeHtml(html);
    expect(result.bookmarks).toHaveLength(2);
    expect(result.bookmarks[0]?.title).toBe('Google');
    expect(result.bookmarks[0]?.url).toBe('https://google.com');
    expect(result.bookmarks[1]?.title).toBe('GitHub');
  });

  it('imports folders with nested bookmarks', () => {
    const html = [
      '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
      '<DL><p>',
      '<DT><H3>Work</H3>',
      '<DL><p>',
      '<DT><A HREF="https://jira.com">Jira</A>',
      '</DL><p>',
      '</DL><p>',
    ].join('\n');
    const result = importFromNetscapeHtml(html);
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0]?.name).toBe('Work');
    expect(result.bookmarks).toHaveLength(1);
    expect(result.bookmarks[0]?.title).toBe('Jira');
    expect(result.bookmarks[0]?.folderId).toBe(result.folders[0]?.id);
  });

  it('imports deeply nested folders', () => {
    const html = [
      '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
      '<DL><p>',
      '<DT><H3>Level1</H3>',
      '<DL><p>',
      '<DT><H3>Level2</H3>',
      '<DL><p>',
      '<DT><A HREF="https://deep.com">Deep</A>',
      '</DL><p>',
      '</DL><p>',
      '</DL><p>',
    ].join('\n');
    const result = importFromNetscapeHtml(html);
    expect(result.folders).toHaveLength(2);
    const level1 = result.folders.find((f) => f.name === 'Level1');
    const level2 = result.folders.find((f) => f.name === 'Level2');
    expect(level1).toBeDefined();
    expect(level2).toBeDefined();
    expect(level2?.parentId).toBe(level1?.id);
    expect(result.bookmarks[0]?.folderId).toBe(level2?.id);
  });

  it('returns empty collections for empty HTML', () => {
    const result = importFromNetscapeHtml('');
    expect(result.bookmarks).toHaveLength(0);
    expect(result.folders).toHaveLength(0);
  });

  it('handles HTML with no bookmarks', () => {
    const html = '<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><p></DL><p>';
    const result = importFromNetscapeHtml(html);
    expect(result.bookmarks).toHaveLength(0);
  });

  it('round-trips through Netscape HTML export and import', () => {
    const folderId = crypto.randomUUID();
    const folder = makeFolder({ id: folderId, name: 'Roundtrip' });
    const bm = makeBookmark({
      title: 'Trip',
      url: 'https://trip.com',
      folderId,
    });
    const html = exportToNetscapeHtml([bm], [folder]);
    const result = importFromNetscapeHtml(html);
    expect(result.bookmarks).toHaveLength(1);
    expect(result.bookmarks[0]?.title).toBe('Trip');
    expect(result.bookmarks[0]?.url).toBe('https://trip.com');
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0]?.name).toBe('Roundtrip');
    expect(result.bookmarks[0]?.folderId).toBe(result.folders[0]?.id);
  });

  it('decodes HTML entities in imported bookmarks', () => {
    const html = [
      '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
      '<DL><p>',
      '<DT><A HREF="https://example.com?a=1&amp;b=2">A &amp; B</A>',
      '</DL><p>',
    ].join('\n');
    const result = importFromNetscapeHtml(html);
    expect(result.bookmarks[0]?.title).toBe('A & B');
    expect(result.bookmarks[0]?.url).toBe('https://example.com?a=1&b=2');
  });

  it('assigns incrementing positions to bookmarks in same folder', () => {
    const html = [
      '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
      '<DL><p>',
      '<DT><A HREF="https://a.com">A</A>',
      '<DT><A HREF="https://b.com">B</A>',
      '<DT><A HREF="https://c.com">C</A>',
      '</DL><p>',
    ].join('\n');
    const result = importFromNetscapeHtml(html);
    expect(result.bookmarks[0]?.position).toBe(0);
    expect(result.bookmarks[1]?.position).toBe(1);
    expect(result.bookmarks[2]?.position).toBe(2);
  });
});
