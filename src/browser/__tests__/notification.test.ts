import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationManager } from '../services/notification';
import type { NightmareNotification } from '../services/notification';

const DEFAULT_MAX = 10;
const DEFAULT_HISTORY = 50;
const DEFAULT_TIMEOUT = 5000;

describe('NotificationManager', () => {
  let manager: NotificationManager;

  beforeEach(() => {
    manager = new NotificationManager();
  });

  describe('create', () => {
    it('creates a notification with all required fields', () => {
      const n = manager.create({ type: 'info', title: 'Test', message: 'Hello' });
      expect(n.id).toBeTypeOf('string');
      expect(n.id.length).toBeGreaterThan(0);
      expect(n.type).toBe('info');
      expect(n.priority).toBe('normal');
      expect(n.title).toBe('Test');
      expect(n.message).toBe('Hello');
      expect(n.timestamp).toBeTypeOf('number');
      expect(n.autoDismissMs).toBe(DEFAULT_TIMEOUT);
    });

    it('assigns unique ids to each notification', () => {
      const a = manager.create({ type: 'info', title: 'A', message: 'a' });
      const b = manager.create({ type: 'info', title: 'B', message: 'b' });
      expect(a.id).not.toBe(b.id);
    });

    it('accepts all notification types', () => {
      const types = ['info', 'warning', 'error', 'success'] as const;
      for (const t of types) {
        const n = manager.create({ type: t, title: 'T', message: 'm' });
        expect(n.type).toBe(t);
      }
    });

    it('accepts all priority levels', () => {
      const priorities = ['low', 'normal', 'high', 'critical'] as const;
      for (const p of priorities) {
        const n = manager.create({ type: 'info', title: 'T', message: 'm', priority: p });
        expect(n.priority).toBe(p);
      }
    });

    it('uses custom autoDismissMs when provided', () => {
      const n = manager.create({ type: 'info', title: 'T', message: 'm', autoDismissMs: 3000 });
      expect(n.autoDismissMs).toBe(3000);
    });

    it('sets autoDismissMs to 0 for critical priority', () => {
      const n = manager.create({ type: 'error', title: 'T', message: 'm', priority: 'critical' });
      expect(n.autoDismissMs).toBe(0);
    });

    it('forces autoDismissMs to 0 for critical even if explicitly set', () => {
      const n = manager.create({
        type: 'error', title: 'T', message: 'm',
        priority: 'critical', autoDismissMs: 9999,
      });
      expect(n.autoDismissMs).toBe(0);
    });

    it('assigns a timestamp close to now', () => {
      const before = Date.now();
      const n = manager.create({ type: 'info', title: 'T', message: 'm' });
      const after = Date.now();
      expect(n.timestamp).toBeGreaterThanOrEqual(before);
      expect(n.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('getAll', () => {
    it('returns empty array when no notifications exist', () => {
      expect(manager.getAll()).toEqual([]);
    });

    it('returns all active notifications', () => {
      manager.create({ type: 'info', title: 'A', message: 'a' });
      manager.create({ type: 'warning', title: 'B', message: 'b' });
      expect(manager.getAll()).toHaveLength(2);
    });

    it('returns a defensive copy', () => {
      manager.create({ type: 'info', title: 'A', message: 'a' });
      const first = manager.getAll();
      const second = manager.getAll();
      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });
  });

  describe('getById', () => {
    it('returns a notification by its id', () => {
      const created = manager.create({ type: 'info', title: 'T', message: 'm' });
      const found = manager.getById(created.id);
      expect(found).toEqual(created);
    });

    it('returns undefined for non-existent id', () => {
      expect(manager.getById('nonexistent')).toBeUndefined();
    });

    it('returns undefined for a dismissed notification', () => {
      const created = manager.create({ type: 'info', title: 'T', message: 'm' });
      manager.dismiss(created.id);
      expect(manager.getById(created.id)).toBeUndefined();
    });
  });

  describe('dismiss', () => {
    it('removes a notification from active list', () => {
      const n = manager.create({ type: 'info', title: 'T', message: 'm' });
      manager.dismiss(n.id);
      expect(manager.getAll()).toHaveLength(0);
    });

    it('returns true when notification was dismissed', () => {
      const n = manager.create({ type: 'info', title: 'T', message: 'm' });
      expect(manager.dismiss(n.id)).toBe(true);
    });

    it('returns false when notification does not exist', () => {
      expect(manager.dismiss('nonexistent')).toBe(false);
    });

    it('returns false when dismissing the same notification twice', () => {
      const n = manager.create({ type: 'info', title: 'T', message: 'm' });
      manager.dismiss(n.id);
      expect(manager.dismiss(n.id)).toBe(false);
    });

    it('adds dismissed notification to history', () => {
      const n = manager.create({ type: 'info', title: 'T', message: 'm' });
      manager.dismiss(n.id);
      const history = manager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]?.id).toBe(n.id);
    });

    it('does not affect other notifications', () => {
      const a = manager.create({ type: 'info', title: 'A', message: 'a' });
      manager.create({ type: 'info', title: 'B', message: 'b' });
      manager.dismiss(a.id);
      expect(manager.getAll()).toHaveLength(1);
      expect(manager.getAll()[0]?.title).toBe('B');
    });
  });

  describe('clearAll', () => {
    it('removes all active notifications', () => {
      manager.create({ type: 'info', title: 'A', message: 'a' });
      manager.create({ type: 'warning', title: 'B', message: 'b' });
      manager.clearAll();
      expect(manager.getAll()).toEqual([]);
    });

    it('adds all cleared notifications to history', () => {
      manager.create({ type: 'info', title: 'A', message: 'a' });
      manager.create({ type: 'warning', title: 'B', message: 'b' });
      manager.clearAll();
      expect(manager.getHistory()).toHaveLength(2);
    });

    it('works when no notifications exist', () => {
      manager.clearAll();
      expect(manager.getAll()).toEqual([]);
    });
  });

  describe('max notification limit', () => {
    it('enforces default max of 10 active notifications', () => {
      for (let i = 0; i < 15; i++) {
        manager.create({ type: 'info', title: `N${String(i)}`, message: `m${String(i)}` });
      }
      expect(manager.getAll()).toHaveLength(DEFAULT_MAX);
    });

    it('dismisses oldest non-critical notification when limit is exceeded', () => {
      for (let i = 0; i < DEFAULT_MAX; i++) {
        manager.create({ type: 'info', title: `N${String(i)}`, message: `m${String(i)}` });
      }
      manager.create({ type: 'info', title: 'Overflow', message: 'new' });
      const all = manager.getAll();
      expect(all).toHaveLength(DEFAULT_MAX);
      const titles = all.map((n) => n.title);
      expect(titles).not.toContain('N0');
      expect(titles).toContain('Overflow');
    });

    it('preserves critical notifications when evicting', () => {
      const critical = manager.create({
        type: 'error', title: 'Critical', message: 'do not evict', priority: 'critical',
      });
      for (let i = 0; i < DEFAULT_MAX; i++) {
        manager.create({ type: 'info', title: `N${String(i)}`, message: `m${String(i)}` });
      }
      const all = manager.getAll();
      expect(all).toHaveLength(DEFAULT_MAX);
      const ids = all.map((n) => n.id);
      expect(ids).toContain(critical.id);
    });

    it('allows custom max limit via constructor', () => {
      const small = new NotificationManager({ maxActive: 3 });
      for (let i = 0; i < 5; i++) {
        small.create({ type: 'info', title: `N${String(i)}`, message: `m${String(i)}` });
      }
      expect(small.getAll()).toHaveLength(3);
    });

    it('evicts oldest non-critical when all slots are filled', () => {
      const tiny = new NotificationManager({ maxActive: 2 });
      tiny.create({ type: 'info', title: 'First', message: 'first' });
      tiny.create({ type: 'info', title: 'Second', message: 'second' });
      tiny.create({ type: 'info', title: 'Third', message: 'third' });
      const all = tiny.getAll();
      expect(all).toHaveLength(2);
      expect(all[0]?.title).toBe('Second');
      expect(all[1]?.title).toBe('Third');
    });
  });

  describe('history', () => {
    it('returns empty history initially', () => {
      expect(manager.getHistory()).toEqual([]);
    });

    it('stores dismissed notifications in history', () => {
      const n = manager.create({ type: 'info', title: 'T', message: 'm' });
      manager.dismiss(n.id);
      expect(manager.getHistory()).toHaveLength(1);
      expect(manager.getHistory()[0]?.id).toBe(n.id);
    });

    it('limits history to 50 entries by default', () => {
      for (let i = 0; i < 60; i++) {
        const n = manager.create({ type: 'info', title: `N${String(i)}`, message: `m${String(i)}` });
        manager.dismiss(n.id);
      }
      expect(manager.getHistory()).toHaveLength(DEFAULT_HISTORY);
    });

    it('drops oldest history entries when limit is exceeded', () => {
      for (let i = 0; i < 55; i++) {
        const n = manager.create({ type: 'info', title: `N${String(i)}`, message: `m${String(i)}` });
        manager.dismiss(n.id);
      }
      const history = manager.getHistory();
      expect(history).toHaveLength(DEFAULT_HISTORY);
      expect(history[0]?.title).toBe('N5');
    });

    it('allows custom history limit via constructor', () => {
      const small = new NotificationManager({ maxHistory: 5 });
      for (let i = 0; i < 10; i++) {
        const n = small.create({ type: 'info', title: `N${String(i)}`, message: `m${String(i)}` });
        small.dismiss(n.id);
      }
      expect(small.getHistory()).toHaveLength(5);
    });

    it('returns a defensive copy of history', () => {
      const n = manager.create({ type: 'info', title: 'T', message: 'm' });
      manager.dismiss(n.id);
      const first = manager.getHistory();
      const second = manager.getHistory();
      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });

    it('includes auto-evicted notifications in history', () => {
      for (let i = 0; i < DEFAULT_MAX + 2; i++) {
        manager.create({ type: 'info', title: `N${String(i)}`, message: `m${String(i)}` });
      }
      const history = manager.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0]?.title).toBe('N0');
      expect(history[1]?.title).toBe('N1');
    });
  });

  describe('clearHistory', () => {
    it('removes all history entries', () => {
      const n = manager.create({ type: 'info', title: 'T', message: 'm' });
      manager.dismiss(n.id);
      manager.clearHistory();
      expect(manager.getHistory()).toEqual([]);
    });

    it('does not affect active notifications', () => {
      manager.create({ type: 'info', title: 'Active', message: 'still here' });
      const old = manager.create({ type: 'info', title: 'Old', message: 'gone' });
      manager.dismiss(old.id);
      manager.clearHistory();
      expect(manager.getAll()).toHaveLength(1);
      expect(manager.getAll()[0]?.title).toBe('Active');
    });
  });

  describe('notification ordering', () => {
    it('getAll returns notifications in creation order', () => {
      manager.create({ type: 'info', title: 'First', message: 'a' });
      manager.create({ type: 'warning', title: 'Second', message: 'b' });
      manager.create({ type: 'error', title: 'Third', message: 'c' });
      const all = manager.getAll();
      expect(all[0]?.title).toBe('First');
      expect(all[1]?.title).toBe('Second');
      expect(all[2]?.title).toBe('Third');
    });
  });

  describe('all-critical overflow', () => {
    it('keeps all critical notifications even when exceeding limit', () => {
      const tiny = new NotificationManager({ maxActive: 2 });
      tiny.create({ type: 'error', title: 'C1', message: 'critical1', priority: 'critical' });
      tiny.create({ type: 'error', title: 'C2', message: 'critical2', priority: 'critical' });
      tiny.create({ type: 'error', title: 'C3', message: 'critical3', priority: 'critical' });
      expect(tiny.getAll()).toHaveLength(3);
    });
  });
});
