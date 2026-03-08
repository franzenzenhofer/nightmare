import { describe, it, expect, beforeEach } from 'vitest';
import { PrintManager } from '../services/print-to-pdf';

describe('PrintManager', () => {
  let manager: PrintManager;

  beforeEach(() => {
    manager = new PrintManager();
  });

  describe('createPrintJob', () => {
    it('creates a print job with defaults', () => {
      const job = manager.createPrintJob('tab-1');
      expect(job.tabId).toBe('tab-1');
      expect(job.status).toBe('pending');
      expect(job.options.format).toBe('A4');
      expect(job.options.landscape).toBe(false);
      expect(job.options.printBackground).toBe(true);
    });

    it('creates a print job with custom options', () => {
      const job = manager.createPrintJob('tab-1', {
        format: 'Letter',
        landscape: true,
        printBackground: false,
        scale: 0.8,
      });
      expect(job.options.format).toBe('Letter');
      expect(job.options.landscape).toBe(true);
      expect(job.options.printBackground).toBe(false);
      expect(job.options.scale).toBe(0.8);
    });

    it('assigns unique IDs', () => {
      const j1 = manager.createPrintJob('tab-1');
      const j2 = manager.createPrintJob('tab-1');
      expect(j1.id).not.toBe(j2.id);
    });
  });

  describe('getJob', () => {
    it('returns a job by id', () => {
      const job = manager.createPrintJob('tab-1');
      expect(manager.getJob(job.id)).toEqual(job);
    });

    it('returns undefined for unknown id', () => {
      expect(manager.getJob('nope')).toBeUndefined();
    });
  });

  describe('markStarted', () => {
    it('sets status to printing', () => {
      const job = manager.createPrintJob('tab-1');
      manager.markStarted(job.id);
      expect(manager.getJob(job.id)?.status).toBe('printing');
    });
  });

  describe('markCompleted', () => {
    it('sets status to completed with output path', () => {
      const job = manager.createPrintJob('tab-1');
      manager.markStarted(job.id);
      manager.markCompleted(job.id, '/tmp/output.pdf');
      const updated = manager.getJob(job.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.outputPath).toBe('/tmp/output.pdf');
    });
  });

  describe('markFailed', () => {
    it('sets status to failed with error', () => {
      const job = manager.createPrintJob('tab-1');
      manager.markStarted(job.id);
      manager.markFailed(job.id, 'timeout');
      const updated = manager.getJob(job.id);
      expect(updated?.status).toBe('failed');
      expect(updated?.error).toBe('timeout');
    });
  });

  describe('getJobsForTab', () => {
    it('returns all jobs for a tab', () => {
      manager.createPrintJob('tab-1');
      manager.createPrintJob('tab-2');
      manager.createPrintJob('tab-1');
      expect(manager.getJobsForTab('tab-1')).toHaveLength(2);
    });
  });

  describe('getAllJobs', () => {
    it('returns all jobs', () => {
      manager.createPrintJob('tab-1');
      manager.createPrintJob('tab-2');
      expect(manager.getAllJobs()).toHaveLength(2);
    });
  });

  describe('scale validation', () => {
    it('clamps scale to valid range', () => {
      const j1 = manager.createPrintJob('tab-1', { scale: 0.05 });
      expect(j1.options.scale).toBe(0.1);
      const j2 = manager.createPrintJob('tab-1', { scale: 3 });
      expect(j2.options.scale).toBe(2);
    });
  });
});
