import { describe, it, expect, beforeEach } from 'vitest';
import { DownloadsManager } from '../services/downloads';

let dm: DownloadsManager;

beforeEach(() => {
  dm = new DownloadsManager();
});

describe('DownloadsManager', () => {
  describe('startDownload', () => {
    it('creates a new download with correct properties', () => {
      const dl = dm.startDownload('https://example.com/file.zip', 'file.zip', 1024);
      expect(dl.url).toBe('https://example.com/file.zip');
      expect(dl.filename).toBe('file.zip');
      expect(dl.totalBytes).toBe(1024);
      expect(dl.receivedBytes).toBe(0);
      expect(dl.status).toBe('downloading');
      expect(dl.id).toBeDefined();
      expect(dl.startedAt).toBeGreaterThan(0);
    });

    it('assigns unique ids to each download', () => {
      const dl1 = dm.startDownload('https://a.com/a.zip', 'a.zip', 100);
      const dl2 = dm.startDownload('https://b.com/b.zip', 'b.zip', 200);
      expect(dl1.id).not.toBe(dl2.id);
    });
  });

  describe('updateProgress', () => {
    it('updates received bytes', () => {
      const dl = dm.startDownload('https://a.com/a.zip', 'a.zip', 1000);
      dm.updateProgress(dl.id, 500);
      const updated = dm.getDownload(dl.id);
      expect(updated?.receivedBytes).toBe(500);
    });

    it('throws for non-existent download', () => {
      expect(() => dm.updateProgress('nonexistent', 100)).toThrow();
    });

    it('throws if download is not in downloading status', () => {
      const dl = dm.startDownload('https://a.com/a.zip', 'a.zip', 1000);
      dm.complete(dl.id);
      expect(() => dm.updateProgress(dl.id, 500)).toThrow();
    });
  });

  describe('complete', () => {
    it('marks download as completed', () => {
      const dl = dm.startDownload('https://a.com/a.zip', 'a.zip', 1000);
      dm.complete(dl.id);
      expect(dm.getDownload(dl.id)?.status).toBe('completed');
    });

    it('throws for non-existent download', () => {
      expect(() => dm.complete('nonexistent')).toThrow();
    });
  });

  describe('fail', () => {
    it('marks download as failed', () => {
      const dl = dm.startDownload('https://a.com/a.zip', 'a.zip', 1000);
      dm.fail(dl.id);
      expect(dm.getDownload(dl.id)?.status).toBe('failed');
    });

    it('throws for non-existent download', () => {
      expect(() => dm.fail('nonexistent')).toThrow();
    });
  });

  describe('cancel', () => {
    it('marks download as cancelled', () => {
      const dl = dm.startDownload('https://a.com/a.zip', 'a.zip', 1000);
      dm.cancel(dl.id);
      expect(dm.getDownload(dl.id)?.status).toBe('cancelled');
    });

    it('throws for non-existent download', () => {
      expect(() => dm.cancel('nonexistent')).toThrow();
    });
  });

  describe('getDownload', () => {
    it('returns download by id', () => {
      const dl = dm.startDownload('https://a.com/a.zip', 'a.zip', 1000);
      const found = dm.getDownload(dl.id);
      expect(found?.id).toBe(dl.id);
    });

    it('returns undefined for non-existent id', () => {
      expect(dm.getDownload('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllDownloads', () => {
    it('returns all downloads', () => {
      dm.startDownload('https://a.com/a.zip', 'a.zip', 100);
      dm.startDownload('https://b.com/b.zip', 'b.zip', 200);
      expect(dm.getAllDownloads()).toHaveLength(2);
    });

    it('returns empty array when no downloads', () => {
      expect(dm.getAllDownloads()).toHaveLength(0);
    });
  });

  describe('getActiveDownloads', () => {
    it('returns only downloading items', () => {
      const dl1 = dm.startDownload('https://a.com/a.zip', 'a.zip', 100);
      dm.startDownload('https://b.com/b.zip', 'b.zip', 200);
      dm.complete(dl1.id);
      const active = dm.getActiveDownloads();
      expect(active).toHaveLength(1);
      expect(active[0]?.status).toBe('downloading');
    });

    it('returns empty when all completed', () => {
      const dl = dm.startDownload('https://a.com/a.zip', 'a.zip', 100);
      dm.complete(dl.id);
      expect(dm.getActiveDownloads()).toHaveLength(0);
    });

    it('returns empty when no downloads exist', () => {
      expect(dm.getActiveDownloads()).toHaveLength(0);
    });
  });
});
