import type { Bookmark } from '../services/bookmarks';

export interface BarItem {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly isFolder: boolean;
}

export function getBarItems(
  bookmarks: ReadonlyArray<Bookmark>,
  maxItems: number,
): BarItem[] {
  return bookmarks
    .filter((b) => b.folderId === null)
    .sort((a, b) => a.position - b.position)
    .slice(0, maxItems)
    .map(toBarItem);
}

function toBarItem(bookmark: Bookmark): BarItem {
  return {
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    isFolder: false,
  };
}

export function isBookmarked(
  url: string,
  bookmarks: ReadonlyArray<Bookmark>,
): boolean {
  return bookmarks.some((b) => b.url === url);
}
