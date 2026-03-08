import { describe, it, expect } from 'vitest';
import { getBarItems, isBookmarked } from '../components/bookmarks-bar';
import type { Bookmark } from '../services/bookmarks';

function makeBookmark(
  overrides: Partial<Bookmark> & { url: string; title: string },
): Bookmark {
  return {
    id: crypto.randomUUID(),
    favicon: null,
    folderId: null,
    createdAt: Date.now(),
    position: 0,
    ...overrides,
  };
}

describe('getBarItems', () => {
  it('returns empty array for no bookmarks', () => {
    expect(getBarItems([], 10)).toEqual([]);
  });

  it('returns only top-level bookmarks (folderId === null)', () => {
    const bookmarks = [
      makeBookmark({ url: 'https://a.com', title: 'A', folderId: null }),
      makeBookmark({ url: 'https://b.com', title: 'B', folderId: 'folder1' }),
    ];
    const items = getBarItems(bookmarks, 10);
    expect(items.length).toBe(1);
    expect(items[0]?.title).toBe('A');
  });

  it('sorts by position ascending', () => {
    const bookmarks = [
      makeBookmark({ url: 'https://c.com', title: 'C', position: 2 }),
      makeBookmark({ url: 'https://a.com', title: 'A', position: 0 }),
      makeBookmark({ url: 'https://b.com', title: 'B', position: 1 }),
    ];
    const items = getBarItems(bookmarks, 10);
    expect(items.map((i) => i.title)).toEqual(['A', 'B', 'C']);
  });

  it('limits to maxItems', () => {
    const bookmarks = Array.from({ length: 5 }, (_, i) =>
      makeBookmark({ url: `https://${i}.com`, title: `S${i}`, position: i }),
    );
    const items = getBarItems(bookmarks, 3);
    expect(items.length).toBe(3);
  });

  it('returns BarItem shape with correct fields', () => {
    const bm = makeBookmark({ url: 'https://x.com', title: 'X' });
    const items = getBarItems([bm], 10);
    expect(items[0]).toEqual({
      id: bm.id,
      title: 'X',
      url: 'https://x.com',
      isFolder: false,
    });
  });

  it('handles maxItems of zero', () => {
    const bookmarks = [
      makeBookmark({ url: 'https://a.com', title: 'A' }),
    ];
    expect(getBarItems(bookmarks, 0)).toEqual([]);
  });
});

describe('isBookmarked', () => {
  it('returns true when URL exists in bookmarks', () => {
    const bookmarks = [
      makeBookmark({ url: 'https://a.com', title: 'A' }),
    ];
    expect(isBookmarked('https://a.com', bookmarks)).toBe(true);
  });

  it('returns false when URL is not bookmarked', () => {
    const bookmarks = [
      makeBookmark({ url: 'https://a.com', title: 'A' }),
    ];
    expect(isBookmarked('https://b.com', bookmarks)).toBe(false);
  });

  it('returns false for empty bookmarks', () => {
    expect(isBookmarked('https://a.com', [])).toBe(false);
  });

  it('does exact URL match (not substring)', () => {
    const bookmarks = [
      makeBookmark({ url: 'https://example.com/page', title: 'Page' }),
    ];
    expect(isBookmarked('https://example.com', bookmarks)).toBe(false);
    expect(isBookmarked('https://example.com/page', bookmarks)).toBe(true);
  });
});
