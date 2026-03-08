import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConsoleStream,
  type ConsoleLogEntry,
  type StreamFilter,
  type LogCallback,
} from '../services/console-stream';

let stream: ConsoleStream;

beforeEach(() => {
  stream = new ConsoleStream();
});

function makeEntry(overrides: Partial<ConsoleLogEntry> = {}): ConsoleLogEntry {
  return {
    tabId: 'tab1',
    level: 'log',
    message: 'hello',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('ConsoleStream', () => {
  describe('subscribe', () => {
    it('returns a unique subscriber ID', () => {
      const cb: LogCallback = vi.fn();
      const id1 = stream.subscribe(cb);
      const id2 = stream.subscribe(cb);
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('increments subscriber count', () => {
      expect(stream.subscriberCount()).toBe(0);
      stream.subscribe(vi.fn());
      expect(stream.subscriberCount()).toBe(1);
      stream.subscribe(vi.fn());
      expect(stream.subscriberCount()).toBe(2);
    });
  });

  describe('unsubscribe', () => {
    it('removes a subscriber by ID', () => {
      const cb: LogCallback = vi.fn();
      const id = stream.subscribe(cb);
      expect(stream.unsubscribe(id)).toBe(true);
      expect(stream.subscriberCount()).toBe(0);
    });

    it('returns false for unknown ID', () => {
      expect(stream.unsubscribe('nonexistent')).toBe(false);
    });

    it('does not call removed subscriber on broadcast', () => {
      const cb: LogCallback = vi.fn();
      const id = stream.subscribe(cb);
      stream.unsubscribe(id);
      stream.broadcast(makeEntry());
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    it('delivers entry to all subscribers', () => {
      const cb1: LogCallback = vi.fn();
      const cb2: LogCallback = vi.fn();
      stream.subscribe(cb1);
      stream.subscribe(cb2);
      const entry = makeEntry();
      stream.broadcast(entry);
      expect(cb1).toHaveBeenCalledWith(entry);
      expect(cb2).toHaveBeenCalledWith(entry);
    });

    it('increments totalBroadcast count', () => {
      stream.subscribe(vi.fn());
      expect(stream.totalBroadcast()).toBe(0);
      stream.broadcast(makeEntry());
      expect(stream.totalBroadcast()).toBe(1);
      stream.broadcast(makeEntry());
      expect(stream.totalBroadcast()).toBe(2);
    });

    it('counts broadcast even with zero subscribers', () => {
      stream.broadcast(makeEntry());
      expect(stream.totalBroadcast()).toBe(1);
    });
  });

  describe('filter by tabId', () => {
    it('delivers only entries matching tabId filter', () => {
      const cb: LogCallback = vi.fn();
      const filter: StreamFilter = { tabId: 'tab1' };
      stream.subscribe(cb, filter);
      stream.broadcast(makeEntry({ tabId: 'tab1' }));
      stream.broadcast(makeEntry({ tabId: 'tab2' }));
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('filter by level', () => {
    it('delivers only entries matching level filter', () => {
      const cb: LogCallback = vi.fn();
      const filter: StreamFilter = { level: 'error' };
      stream.subscribe(cb, filter);
      stream.broadcast(makeEntry({ level: 'log' }));
      stream.broadcast(makeEntry({ level: 'error' }));
      stream.broadcast(makeEntry({ level: 'warn' }));
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('filter by pattern', () => {
    it('delivers only entries whose message matches pattern', () => {
      const cb: LogCallback = vi.fn();
      const filter: StreamFilter = { pattern: 'fail' };
      stream.subscribe(cb, filter);
      stream.broadcast(makeEntry({ message: 'test passed' }));
      stream.broadcast(makeEntry({ message: 'test failed' }));
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('pattern matching is case-insensitive', () => {
      const cb: LogCallback = vi.fn();
      stream.subscribe(cb, { pattern: 'ERROR' });
      stream.broadcast(makeEntry({ message: 'An error occurred' }));
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('combined filters', () => {
    it('applies all filters with AND logic', () => {
      const cb: LogCallback = vi.fn();
      const filter: StreamFilter = {
        tabId: 'tab1',
        level: 'error',
        pattern: 'crash',
      };
      stream.subscribe(cb, filter);

      stream.broadcast(makeEntry({ tabId: 'tab1', level: 'error', message: 'crash dump' }));
      stream.broadcast(makeEntry({ tabId: 'tab2', level: 'error', message: 'crash dump' }));
      stream.broadcast(makeEntry({ tabId: 'tab1', level: 'log', message: 'crash dump' }));
      stream.broadcast(makeEntry({ tabId: 'tab1', level: 'error', message: 'ok' }));

      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('no filter', () => {
    it('receives all entries when no filter is provided', () => {
      const cb: LogCallback = vi.fn();
      stream.subscribe(cb);
      stream.broadcast(makeEntry({ tabId: 'a', level: 'warn', message: 'x' }));
      stream.broadcast(makeEntry({ tabId: 'b', level: 'error', message: 'y' }));
      expect(cb).toHaveBeenCalledTimes(2);
    });
  });

  describe('pause and resume', () => {
    it('paused subscriber does not receive entries', () => {
      const cb: LogCallback = vi.fn();
      const id = stream.subscribe(cb);
      stream.pause(id);
      stream.broadcast(makeEntry());
      expect(cb).not.toHaveBeenCalled();
    });

    it('resumed subscriber receives entries again', () => {
      const cb: LogCallback = vi.fn();
      const id = stream.subscribe(cb);
      stream.pause(id);
      stream.broadcast(makeEntry());
      stream.resume(id);
      stream.broadcast(makeEntry());
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('pause returns false for unknown ID', () => {
      expect(stream.pause('unknown')).toBe(false);
    });

    it('resume returns false for unknown ID', () => {
      expect(stream.resume('unknown')).toBe(false);
    });

    it('pause returns true for valid subscriber', () => {
      const id = stream.subscribe(vi.fn());
      expect(stream.pause(id)).toBe(true);
    });

    it('resume returns true for valid subscriber', () => {
      const id = stream.subscribe(vi.fn());
      stream.pause(id);
      expect(stream.resume(id)).toBe(true);
    });
  });

  describe('subscriber count', () => {
    it('reflects additions and removals', () => {
      const id1 = stream.subscribe(vi.fn());
      const id2 = stream.subscribe(vi.fn());
      expect(stream.subscriberCount()).toBe(2);
      stream.unsubscribe(id1);
      expect(stream.subscriberCount()).toBe(1);
      stream.unsubscribe(id2);
      expect(stream.subscriberCount()).toBe(0);
    });
  });

  describe('error isolation', () => {
    it('continues broadcasting if a subscriber throws', () => {
      const throwing: LogCallback = () => {
        throw new Error('boom');
      };
      const cb: LogCallback = vi.fn();
      stream.subscribe(throwing);
      stream.subscribe(cb);
      stream.broadcast(makeEntry());
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });
});
