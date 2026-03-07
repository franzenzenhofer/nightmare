import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BookmarkManager } from '../services/bookmarks';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let tempDir: string;
let bm: BookmarkManager;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'nightmare-bm-'));
  bm = new BookmarkManager(tempDir);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('BookmarkManager', () => {
  describe('add', () => {
    it('adds a bookmark with correct properties', () => {
      const b = bm.add('Google', 'https://google.com');
      expect(b.title).toBe('Google');
      expect(b.url).toBe('https://google.com');
      expect(b.id).toBeDefined();
      expect(b.folderId).toBeNull();
    });

    it('adds bookmark to a specific folder', () => {
      const folder = bm.createFolder('Dev Tools');
      const b = bm.add('Docs', 'https://docs.dev', folder.id);
      expect(b.folderId).toBe(folder.id);
    });

    it('assigns incrementing positions', () => {
      const b1 = bm.add('A', 'https://a.com');
      const b2 = bm.add('B', 'https://b.com');
      expect(b1.position).toBe(0);
      expect(b2.position).toBe(1);
    });
  });

  describe('remove', () => {
    it('removes a bookmark', () => {
      const b = bm.add('Temp', 'https://temp.com');
      bm.remove(b.id);
      expect(bm.getBarBookmarks()).toHaveLength(0);
    });

    it('does nothing for non-existent id', () => {
      bm.add('A', 'https://a.com');
      bm.remove('nonexistent');
      expect(bm.getBarBookmarks()).toHaveLength(1);
    });
  });

  describe('getBarBookmarks', () => {
    it('returns root-level bookmarks', () => {
      bm.add('A', 'https://a.com');
      bm.add('B', 'https://b.com');
      const folder = bm.createFolder('Folder');
      bm.add('C', 'https://c.com', folder.id);
      expect(bm.getBarBookmarks()).toHaveLength(2);
    });
  });

  describe('search', () => {
    it('searches by title (case-insensitive)', () => {
      bm.add('Nightmare Docs', 'file:///docs');
      bm.add('Google', 'https://google.com');
      const results = bm.search('night');
      expect(results).toHaveLength(1);
      expect(results[0]?.title).toBe('Nightmare Docs');
    });

    it('searches by URL', () => {
      bm.add('My App', 'http://localhost:3000');
      const results = bm.search('localhost');
      expect(results).toHaveLength(1);
    });

    it('returns empty for no match', () => {
      bm.add('A', 'https://a.com');
      expect(bm.search('zzzzz')).toHaveLength(0);
    });
  });

  describe('createFolder', () => {
    it('creates a folder', () => {
      const folder = bm.createFolder('Dev Tools');
      expect(folder.name).toBe('Dev Tools');
      expect(folder.id).toBeDefined();
      expect(folder.parentId).toBeNull();
    });

    it('creates nested folders', () => {
      const parent = bm.createFolder('Parent');
      const child = bm.createFolder('Child', parent.id);
      expect(child.parentId).toBe(parent.id);
    });
  });

  describe('move', () => {
    it('moves a bookmark to a folder', () => {
      const b = bm.add('A', 'https://a.com');
      const folder = bm.createFolder('Folder');
      bm.move(b.id, folder.id, 0);
      expect(bm.getBarBookmarks()).toHaveLength(0);
    });

    it('moves a bookmark back to root', () => {
      const folder = bm.createFolder('Folder');
      const b = bm.add('A', 'https://a.com', folder.id);
      bm.move(b.id, null, 0);
      expect(bm.getBarBookmarks()).toHaveLength(1);
    });
  });

  describe('persistence', () => {
    it('persists bookmarks across instances', () => {
      bm.add('Persisted', 'https://persisted.com');
      const bm2 = new BookmarkManager(tempDir);
      expect(bm2.getBarBookmarks()).toHaveLength(1);
      expect(bm2.getBarBookmarks()[0]?.title).toBe('Persisted');
    });
  });

  describe('getAll', () => {
    it('returns all bookmarks', () => {
      bm.add('A', 'https://a.com');
      bm.add('B', 'https://b.com');
      expect(bm.getAll()).toHaveLength(2);
    });
  });
});
