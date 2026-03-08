import { join } from 'path';
import { JsonStorage } from './storage';

export interface Bookmark {
  readonly id: string;
  title: string;
  url: string;
  favicon: string | null;
  folderId: string | null;
  readonly createdAt: number;
  position: number;
}

export interface BookmarkFolder {
  readonly id: string;
  name: string;
  parentId: string | null;
  position: number;
}

interface BookmarkData {
  bookmarks: Bookmark[];
  folders: BookmarkFolder[];
}

export class BookmarkManager {
  private readonly storage: JsonStorage<BookmarkData>;

  constructor(storageDir: string) {
    this.storage = new JsonStorage(join(storageDir, 'bookmarks.json'));
  }

  add(title: string, url: string, folderId: string | null = null): Bookmark {
    const data = this.loadData();
    const sameFolder = data.bookmarks.filter((b) => b.folderId === folderId);
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      title,
      url,
      favicon: null,
      folderId,
      createdAt: Date.now(),
      position: sameFolder.length,
    };
    data.bookmarks.push(bookmark);
    this.saveData(data);
    return bookmark;
  }

  remove(id: string): void {
    const data = this.loadData();
    data.bookmarks = data.bookmarks.filter((b) => b.id !== id);
    this.saveData(data);
  }

  move(id: string, folderId: string | null, position: number): void {
    const data = this.loadData();
    const bookmark = data.bookmarks.find((b) => b.id === id);
    if (!bookmark) return;
    bookmark.folderId = folderId;
    bookmark.position = position;
    this.saveData(data);
  }

  getBarBookmarks(): Bookmark[] {
    const data = this.loadData();
    return data.bookmarks
      .filter((b) => b.folderId === null)
      .sort((a, b) => a.position - b.position);
  }

  getAll(): Bookmark[] {
    return this.loadData().bookmarks;
  }

  search(query: string): Bookmark[] {
    const lower = query.toLowerCase();
    return this.loadData().bookmarks.filter(
      (b) => b.title.toLowerCase().includes(lower) || b.url.toLowerCase().includes(lower),
    );
  }

  createFolder(name: string, parentId: string | null = null): BookmarkFolder {
    const data = this.loadData();
    const folder: BookmarkFolder = {
      id: crypto.randomUUID(),
      name,
      parentId,
      position: data.folders.filter((f) => f.parentId === parentId).length,
    };
    data.folders.push(folder);
    this.saveData(data);
    return folder;
  }

  private loadData(): BookmarkData {
    return this.storage.load({ bookmarks: [], folders: [] });
  }

  private saveData(data: BookmarkData): void {
    this.storage.save(data);
  }
}
