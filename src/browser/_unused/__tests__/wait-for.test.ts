import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  WaitForManager,
  DEFAULT_TIMEOUT,
  DEFAULT_POLL_INTERVAL,
} from '../services/wait-for';
import type { WaitJob, WaitCondition } from '../services/wait-for';

let manager: WaitForManager;

beforeEach(() => {
  manager = new WaitForManager();
});

describe('WaitForManager', () => {
  describe('constants', () => {
    it('exports correct default constants', () => {
      expect(DEFAULT_TIMEOUT).toBe(30_000);
      expect(DEFAULT_POLL_INTERVAL).toBe(250);
    });
  });

  describe('createJob', () => {
    it('creates a wait job with selector condition', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#main',
      });
      expect(job.id).toBeDefined();
      expect(job.tabId).toBe('tab-1');
      expect(job.condition).toBe('selector');
      expect(job.value).toBe('#main');
      expect(job.status).toBe('waiting');
    });

    it('creates a wait job with text condition', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'text',
        value: 'Hello World',
      });
      expect(job.condition).toBe('text');
      expect(job.value).toBe('Hello World');
    });

    it('creates a wait job with url condition', () => {
      const job = manager.createJob({
        tabId: 'tab-2',
        condition: 'url',
        value: 'https://example.com/*',
      });
      expect(job.condition).toBe('url');
    });

    it('creates a wait job with idle condition', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'idle',
        value: '500',
      });
      expect(job.condition).toBe('idle');
      expect(job.value).toBe('500');
    });

    it('uses default timeout when not specified', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '.btn',
      });
      expect(job.timeout).toBe(DEFAULT_TIMEOUT);
    });

    it('uses custom timeout when specified', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '.btn',
        timeout: 5000,
      });
      expect(job.timeout).toBe(5000);
    });

    it('uses default polling interval when not specified', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '.btn',
      });
      expect(job.pollingInterval).toBe(DEFAULT_POLL_INTERVAL);
    });

    it('uses custom polling interval when specified', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '.btn',
        pollingInterval: 100,
      });
      expect(job.pollingInterval).toBe(100);
    });

    it('sets createdAt to a recent timestamp', () => {
      const before = Date.now();
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#app',
      });
      const after = Date.now();
      expect(job.createdAt).toBeGreaterThanOrEqual(before);
      expect(job.createdAt).toBeLessThanOrEqual(after);
    });

    it('generates unique ids for each job', () => {
      const job1 = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#a',
      });
      const job2 = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#b',
      });
      expect(job1.id).not.toBe(job2.id);
    });

    it('throws for empty value', () => {
      expect(() =>
        manager.createJob({
          tabId: 'tab-1',
          condition: 'selector',
          value: '',
        }),
      ).toThrow('Wait value must not be empty');
    });

    it('throws for empty tabId', () => {
      expect(() =>
        manager.createJob({
          tabId: '',
          condition: 'selector',
          value: '#app',
        }),
      ).toThrow('Tab ID must not be empty');
    });

    it('throws for non-positive timeout', () => {
      expect(() =>
        manager.createJob({
          tabId: 'tab-1',
          condition: 'selector',
          value: '#app',
          timeout: 0,
        }),
      ).toThrow('Timeout must be positive');
    });

    it('throws for non-positive polling interval', () => {
      expect(() =>
        manager.createJob({
          tabId: 'tab-1',
          condition: 'selector',
          value: '#app',
          pollingInterval: -1,
        }),
      ).toThrow('Polling interval must be positive');
    });
  });

  describe('getJob', () => {
    it('returns a job by id', () => {
      const created = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#app',
      });
      const found = manager.getJob(created.id);
      expect(found).toEqual(created);
    });

    it('returns undefined for unknown id', () => {
      expect(manager.getJob('nonexistent')).toBeUndefined();
    });
  });

  describe('satisfy', () => {
    it('marks a waiting job as satisfied', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#app',
      });
      const satisfied = manager.satisfy(job.id);
      expect(satisfied?.status).toBe('satisfied');
    });

    it('returns undefined for unknown job', () => {
      expect(manager.satisfy('nonexistent')).toBeUndefined();
    });

    it('does not change status of an already cancelled job', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#app',
      });
      manager.cancel(job.id);
      const result = manager.satisfy(job.id);
      expect(result?.status).toBe('cancelled');
    });

    it('does not change status of an already timed-out job', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#app',
      });
      manager.markTimeout(job.id);
      const result = manager.satisfy(job.id);
      expect(result?.status).toBe('timeout');
    });
  });

  describe('markTimeout', () => {
    it('marks a waiting job as timed out', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'text',
        value: 'Done',
      });
      const timedOut = manager.markTimeout(job.id);
      expect(timedOut?.status).toBe('timeout');
    });

    it('returns undefined for unknown job', () => {
      expect(manager.markTimeout('nonexistent')).toBeUndefined();
    });

    it('does not change status of already satisfied job', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'text',
        value: 'Done',
      });
      manager.satisfy(job.id);
      const result = manager.markTimeout(job.id);
      expect(result?.status).toBe('satisfied');
    });
  });

  describe('cancel', () => {
    it('cancels a waiting job', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'url',
        value: 'https://*',
      });
      const cancelled = manager.cancel(job.id);
      expect(cancelled?.status).toBe('cancelled');
    });

    it('returns undefined for unknown job', () => {
      expect(manager.cancel('nonexistent')).toBeUndefined();
    });

    it('does not change status of already satisfied job', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'url',
        value: 'https://*',
      });
      manager.satisfy(job.id);
      const result = manager.cancel(job.id);
      expect(result?.status).toBe('satisfied');
    });
  });

  describe('getActiveJobsForTab', () => {
    it('returns empty array when no jobs exist', () => {
      expect(manager.getActiveJobsForTab('tab-1')).toEqual([]);
    });

    it('returns only waiting jobs for a specific tab', () => {
      manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#a',
      });
      manager.createJob({
        tabId: 'tab-1',
        condition: 'text',
        value: 'Hello',
      });
      manager.createJob({
        tabId: 'tab-2',
        condition: 'selector',
        value: '#b',
      });

      const active = manager.getActiveJobsForTab('tab-1');
      expect(active).toHaveLength(2);
      expect(active.every((j) => j.tabId === 'tab-1')).toBe(true);
      expect(active.every((j) => j.status === 'waiting')).toBe(true);
    });

    it('excludes satisfied jobs', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#a',
      });
      manager.satisfy(job.id);

      expect(manager.getActiveJobsForTab('tab-1')).toEqual([]);
    });

    it('excludes cancelled jobs', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#a',
      });
      manager.cancel(job.id);

      expect(manager.getActiveJobsForTab('tab-1')).toEqual([]);
    });

    it('excludes timed out jobs', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#a',
      });
      manager.markTimeout(job.id);

      expect(manager.getActiveJobsForTab('tab-1')).toEqual([]);
    });
  });

  describe('getElapsedTime', () => {
    it('returns elapsed milliseconds for a job', () => {
      vi.useFakeTimers();
      const start = Date.now();
      vi.setSystemTime(start);

      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#app',
      });

      vi.advanceTimersByTime(1000);
      const elapsed = manager.getElapsedTime(job.id);
      expect(elapsed).toBe(1000);

      vi.useRealTimers();
    });

    it('returns undefined for unknown job', () => {
      expect(manager.getElapsedTime('nonexistent')).toBeUndefined();
    });
  });

  describe('isExpired', () => {
    it('returns false when job has not exceeded timeout', () => {
      vi.useFakeTimers();
      const start = Date.now();
      vi.setSystemTime(start);

      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#app',
        timeout: 5000,
      });

      vi.advanceTimersByTime(3000);
      expect(manager.isExpired(job.id)).toBe(false);

      vi.useRealTimers();
    });

    it('returns true when job has exceeded timeout', () => {
      vi.useFakeTimers();
      const start = Date.now();
      vi.setSystemTime(start);

      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#app',
        timeout: 5000,
      });

      vi.advanceTimersByTime(6000);
      expect(manager.isExpired(job.id)).toBe(true);

      vi.useRealTimers();
    });

    it('returns undefined for unknown job', () => {
      expect(manager.isExpired('nonexistent')).toBeUndefined();
    });

    it('returns true at exactly the timeout boundary', () => {
      vi.useFakeTimers();
      const start = Date.now();
      vi.setSystemTime(start);

      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#app',
        timeout: 5000,
      });

      vi.advanceTimersByTime(5000);
      expect(manager.isExpired(job.id)).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('cancelAllForTab', () => {
    it('cancels all waiting jobs for a tab', () => {
      manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#a',
      });
      manager.createJob({
        tabId: 'tab-1',
        condition: 'text',
        value: 'Hello',
      });
      manager.createJob({
        tabId: 'tab-2',
        condition: 'selector',
        value: '#b',
      });

      const cancelled = manager.cancelAllForTab('tab-1');
      expect(cancelled).toBe(2);
      expect(manager.getActiveJobsForTab('tab-1')).toHaveLength(0);
      expect(manager.getActiveJobsForTab('tab-2')).toHaveLength(1);
    });

    it('returns 0 when no active jobs exist for tab', () => {
      expect(manager.cancelAllForTab('tab-1')).toBe(0);
    });

    it('does not cancel already satisfied jobs', () => {
      const job = manager.createJob({
        tabId: 'tab-1',
        condition: 'selector',
        value: '#a',
      });
      manager.satisfy(job.id);

      const cancelled = manager.cancelAllForTab('tab-1');
      expect(cancelled).toBe(0);
      expect(manager.getJob(job.id)?.status).toBe('satisfied');
    });
  });
});
