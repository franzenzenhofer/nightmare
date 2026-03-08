import { describe, it, expect, beforeEach } from 'vitest';
import { MultiScreenshotService } from '../services/multi-screenshot';

describe('MultiScreenshotService', () => {
  let service: MultiScreenshotService;

  beforeEach(() => {
    service = new MultiScreenshotService();
  });

  describe('createBatch', () => {
    it('creates a batch from tab IDs with default png format', () => {
      const batch = service.createBatch(['tab-1', 'tab-2', 'tab-3']);
      expect(batch.id).toBeTruthy();
      expect(batch.jobs).toHaveLength(3);
      expect(batch.createdAt).toBeGreaterThan(0);
      for (const job of batch.jobs) {
        expect(job.status).toBe('pending');
        expect(job.format).toBe('png');
        expect(job.data).toBeUndefined();
        expect(job.error).toBeUndefined();
      }
    });

    it('creates a batch with jpeg format', () => {
      const batch = service.createBatch(['tab-1'], 'jpeg');
      expect(batch.jobs[0]?.format).toBe('jpeg');
    });

    it('assigns unique IDs to each job', () => {
      const batch = service.createBatch(['tab-1', 'tab-2']);
      const ids = batch.jobs.map((j) => j.id);
      expect(new Set(ids).size).toBe(2);
    });

    it('assigns unique batch IDs', () => {
      const b1 = service.createBatch(['tab-1']);
      const b2 = service.createBatch(['tab-2']);
      expect(b1.id).not.toBe(b2.id);
    });

    it('maps each tab ID to its job', () => {
      const batch = service.createBatch(['tab-a', 'tab-b']);
      expect(batch.jobs[0]?.tabId).toBe('tab-a');
      expect(batch.jobs[1]?.tabId).toBe('tab-b');
    });

    it('throws on empty tab IDs array', () => {
      expect(() => service.createBatch([])).toThrow('at least one tab');
    });
  });

  describe('getBatch', () => {
    it('returns a batch by id', () => {
      const batch = service.createBatch(['tab-1']);
      const found = service.getBatch(batch.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(batch.id);
    });

    it('returns undefined for unknown batch id', () => {
      expect(service.getBatch('nonexistent')).toBeUndefined();
    });
  });

  describe('markCapturing', () => {
    it('sets job status to capturing', () => {
      const batch = service.createBatch(['tab-1']);
      const jobId = batch.jobs[0]!.id;
      service.markCapturing(batch.id, jobId);
      const updated = service.getBatch(batch.id);
      expect(updated?.jobs[0]?.status).toBe('capturing');
    });

    it('throws for unknown batch id', () => {
      expect(() => service.markCapturing('bad', 'bad')).toThrow(
        'Batch not found',
      );
    });

    it('throws for unknown job id', () => {
      const batch = service.createBatch(['tab-1']);
      expect(() => service.markCapturing(batch.id, 'bad')).toThrow(
        'Job not found',
      );
    });
  });

  describe('markCompleted', () => {
    it('sets status to completed with base64 data', () => {
      const batch = service.createBatch(['tab-1']);
      const jobId = batch.jobs[0]!.id;
      service.markCompleted(batch.id, jobId, 'iVBORw0KGgo=');
      const updated = service.getBatch(batch.id);
      expect(updated?.jobs[0]?.status).toBe('completed');
      expect(updated?.jobs[0]?.data).toBe('iVBORw0KGgo=');
    });

    it('throws for unknown batch', () => {
      expect(() => service.markCompleted('x', 'y', 'data')).toThrow(
        'Batch not found',
      );
    });

    it('throws for unknown job', () => {
      const batch = service.createBatch(['tab-1']);
      expect(() => service.markCompleted(batch.id, 'bad', 'data')).toThrow(
        'Job not found',
      );
    });
  });

  describe('markFailed', () => {
    it('sets status to failed with error message', () => {
      const batch = service.createBatch(['tab-1']);
      const jobId = batch.jobs[0]!.id;
      service.markFailed(batch.id, jobId, 'Tab not responding');
      const updated = service.getBatch(batch.id);
      expect(updated?.jobs[0]?.status).toBe('failed');
      expect(updated?.jobs[0]?.error).toBe('Tab not responding');
    });

    it('throws for unknown batch', () => {
      expect(() => service.markFailed('x', 'y', 'err')).toThrow(
        'Batch not found',
      );
    });

    it('throws for unknown job', () => {
      const batch = service.createBatch(['tab-1']);
      expect(() => service.markFailed(batch.id, 'bad', 'err')).toThrow(
        'Job not found',
      );
    });
  });

  describe('getProgress', () => {
    it('returns 0/total when no jobs completed', () => {
      const batch = service.createBatch(['tab-1', 'tab-2', 'tab-3']);
      const progress = service.getProgress(batch.id);
      expect(progress).toEqual({ completed: 0, total: 3 });
    });

    it('counts completed and failed as done', () => {
      const batch = service.createBatch(['tab-1', 'tab-2', 'tab-3']);
      service.markCompleted(batch.id, batch.jobs[0]!.id, 'data1');
      service.markFailed(batch.id, batch.jobs[1]!.id, 'error');
      const progress = service.getProgress(batch.id);
      expect(progress).toEqual({ completed: 2, total: 3 });
    });

    it('throws for unknown batch', () => {
      expect(() => service.getProgress('x')).toThrow('Batch not found');
    });
  });

  describe('isBatchComplete', () => {
    it('returns false when jobs are pending', () => {
      const batch = service.createBatch(['tab-1', 'tab-2']);
      expect(service.isBatchComplete(batch.id)).toBe(false);
    });

    it('returns false when some jobs are capturing', () => {
      const batch = service.createBatch(['tab-1', 'tab-2']);
      service.markCompleted(batch.id, batch.jobs[0]!.id, 'data');
      service.markCapturing(batch.id, batch.jobs[1]!.id);
      expect(service.isBatchComplete(batch.id)).toBe(false);
    });

    it('returns true when all jobs are completed or failed', () => {
      const batch = service.createBatch(['tab-1', 'tab-2']);
      service.markCompleted(batch.id, batch.jobs[0]!.id, 'data');
      service.markFailed(batch.id, batch.jobs[1]!.id, 'err');
      expect(service.isBatchComplete(batch.id)).toBe(true);
    });

    it('throws for unknown batch', () => {
      expect(() => service.isBatchComplete('x')).toThrow('Batch not found');
    });
  });

  describe('getCompletedScreenshots', () => {
    it('returns only completed jobs with data', () => {
      const batch = service.createBatch(['tab-1', 'tab-2', 'tab-3']);
      service.markCompleted(batch.id, batch.jobs[0]!.id, 'data1');
      service.markFailed(batch.id, batch.jobs[1]!.id, 'err');
      const completed = service.getCompletedScreenshots(batch.id);
      expect(completed).toHaveLength(1);
      expect(completed[0]?.data).toBe('data1');
      expect(completed[0]?.tabId).toBe('tab-1');
    });

    it('returns empty array when none completed', () => {
      const batch = service.createBatch(['tab-1']);
      expect(service.getCompletedScreenshots(batch.id)).toHaveLength(0);
    });

    it('throws for unknown batch', () => {
      expect(() => service.getCompletedScreenshots('x')).toThrow(
        'Batch not found',
      );
    });
  });

  describe('cancelBatch', () => {
    it('removes the batch entirely', () => {
      const batch = service.createBatch(['tab-1']);
      service.cancelBatch(batch.id);
      expect(service.getBatch(batch.id)).toBeUndefined();
    });

    it('throws for unknown batch', () => {
      expect(() => service.cancelBatch('x')).toThrow('Batch not found');
    });
  });
});
