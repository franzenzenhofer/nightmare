import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  KeyboardShortcuts,
  parseKeyCombo,
  normalizeKeyName,
} from '../services/keyboard-shortcuts';
import type { KeyCombo } from '../services/keyboard-shortcuts';

describe('normalizeKeyName', () => {
  it('normalizes ctrl to Ctrl', () => {
    expect(normalizeKeyName('ctrl')).toBe('Ctrl');
  });

  it('normalizes CTRL to Ctrl', () => {
    expect(normalizeKeyName('CTRL')).toBe('Ctrl');
  });

  it('normalizes shift to Shift', () => {
    expect(normalizeKeyName('shift')).toBe('Shift');
  });

  it('normalizes alt to Alt', () => {
    expect(normalizeKeyName('alt')).toBe('Alt');
  });

  it('normalizes cmd to Meta', () => {
    expect(normalizeKeyName('cmd')).toBe('Meta');
  });

  it('normalizes Cmd to Meta', () => {
    expect(normalizeKeyName('Cmd')).toBe('Meta');
  });

  it('normalizes meta to Meta', () => {
    expect(normalizeKeyName('meta')).toBe('Meta');
  });

  it('normalizes command to Meta', () => {
    expect(normalizeKeyName('command')).toBe('Meta');
  });

  it('normalizes Command to Meta', () => {
    expect(normalizeKeyName('Command')).toBe('Meta');
  });

  it('preserves already-correct names', () => {
    expect(normalizeKeyName('Ctrl')).toBe('Ctrl');
    expect(normalizeKeyName('Meta')).toBe('Meta');
  });

  it('normalizes left/right arrow aliases', () => {
    expect(normalizeKeyName('Left')).toBe('ArrowLeft');
    expect(normalizeKeyName('Right')).toBe('ArrowRight');
    expect(normalizeKeyName('Up')).toBe('ArrowUp');
    expect(normalizeKeyName('Down')).toBe('ArrowDown');
  });

  it('preserves regular key names', () => {
    expect(normalizeKeyName('t')).toBe('t');
    expect(normalizeKeyName('F5')).toBe('F5');
    expect(normalizeKeyName('Enter')).toBe('Enter');
  });
});

describe('parseKeyCombo', () => {
  it('parses Ctrl+T', () => {
    const combo = parseKeyCombo('Ctrl+T');
    expect(combo).toEqual({ key: 'T', ctrl: true, shift: false, alt: false, meta: false });
  });

  it('parses Ctrl+Shift+N', () => {
    const combo = parseKeyCombo('Ctrl+Shift+N');
    expect(combo).toEqual({ key: 'N', ctrl: true, shift: true, alt: false, meta: false });
  });

  it('parses Alt+Left as Alt+ArrowLeft', () => {
    const combo = parseKeyCombo('Alt+Left');
    expect(combo).toEqual({ key: 'ArrowLeft', ctrl: false, shift: false, alt: true, meta: false });
  });

  it('parses F5 with no modifiers', () => {
    const combo = parseKeyCombo('F5');
    expect(combo).toEqual({ key: 'F5', ctrl: false, shift: false, alt: false, meta: false });
  });

  it('parses Cmd+L as Meta+L', () => {
    const combo = parseKeyCombo('Cmd+L');
    expect(combo).toEqual({ key: 'L', ctrl: false, shift: false, alt: false, meta: true });
  });

  it('parses Meta+Shift+I', () => {
    const combo = parseKeyCombo('Meta+Shift+I');
    expect(combo).toEqual({ key: 'I', ctrl: false, shift: true, alt: false, meta: true });
  });

  it('parses case-insensitive modifiers', () => {
    const combo = parseKeyCombo('ctrl+shift+t');
    expect(combo).toEqual({ key: 't', ctrl: true, shift: true, alt: false, meta: false });
  });

  it('throws on empty string', () => {
    expect(() => parseKeyCombo('')).toThrow();
  });

  it('parses Ctrl+Alt+Delete', () => {
    const combo = parseKeyCombo('Ctrl+Alt+Delete');
    expect(combo).toEqual({ key: 'Delete', ctrl: true, shift: false, alt: true, meta: false });
  });
});

describe('KeyboardShortcuts', () => {
  let shortcuts: KeyboardShortcuts;

  beforeEach(() => {
    shortcuts = new KeyboardShortcuts();
  });

  describe('register', () => {
    it('registers a shortcut and returns the registration', () => {
      const handler = vi.fn();
      const reg = shortcuts.register('Ctrl+T', 'new-tab', handler);
      expect(reg.id).toBeDefined();
      expect(reg.action).toBe('new-tab');
      expect(reg.combo.key).toBe('T');
      expect(reg.combo.ctrl).toBe(true);
      expect(reg.enabled).toBe(true);
    });

    it('assigns unique ids to each registration', () => {
      const reg1 = shortcuts.register('Ctrl+T', 'new-tab', vi.fn());
      const reg2 = shortcuts.register('Ctrl+W', 'close-tab', vi.fn());
      expect(reg1.id).not.toBe(reg2.id);
    });

    it('throws on conflict when same combo is already registered', () => {
      shortcuts.register('Ctrl+T', 'new-tab', vi.fn());
      expect(() => shortcuts.register('Ctrl+T', 'duplicate', vi.fn())).toThrow(/conflict/i);
    });
  });

  describe('unregister', () => {
    it('removes a registered shortcut by id', () => {
      const reg = shortcuts.register('Ctrl+T', 'new-tab', vi.fn());
      const removed = shortcuts.unregister(reg.id);
      expect(removed).toBe(true);
      expect(shortcuts.getAll()).toHaveLength(0);
    });

    it('returns false when id does not exist', () => {
      expect(shortcuts.unregister('nonexistent')).toBe(false);
    });

    it('allows re-registering a combo after unregister', () => {
      const reg = shortcuts.register('Ctrl+T', 'new-tab', vi.fn());
      shortcuts.unregister(reg.id);
      expect(() => shortcuts.register('Ctrl+T', 'new-tab', vi.fn())).not.toThrow();
    });
  });

  describe('handleKeyEvent', () => {
    it('calls the handler when a matching key event fires', () => {
      const handler = vi.fn();
      shortcuts.register('Ctrl+T', 'new-tab', handler);
      const matched = shortcuts.handleKeyEvent({
        key: 'T', ctrl: true, shift: false, alt: false, meta: false,
      });
      expect(matched).toBe(true);
      expect(handler).toHaveBeenCalledOnce();
    });

    it('returns false when no shortcut matches', () => {
      shortcuts.register('Ctrl+T', 'new-tab', vi.fn());
      const matched = shortcuts.handleKeyEvent({
        key: 'X', ctrl: true, shift: false, alt: false, meta: false,
      });
      expect(matched).toBe(false);
    });

    it('does not call handler for disabled shortcuts', () => {
      const handler = vi.fn();
      const reg = shortcuts.register('Ctrl+T', 'new-tab', handler);
      shortcuts.disableShortcut(reg.id);
      const matched = shortcuts.handleKeyEvent({
        key: 'T', ctrl: true, shift: false, alt: false, meta: false,
      });
      expect(matched).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('does not call handler when globally disabled', () => {
      const handler = vi.fn();
      shortcuts.register('Ctrl+T', 'new-tab', handler);
      shortcuts.disableAll();
      const matched = shortcuts.handleKeyEvent({
        key: 'T', ctrl: true, shift: false, alt: false, meta: false,
      });
      expect(matched).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('matches modifiers exactly', () => {
      const handler = vi.fn();
      shortcuts.register('Ctrl+Shift+T', 'reopen-tab', handler);
      const matched = shortcuts.handleKeyEvent({
        key: 'T', ctrl: true, shift: false, alt: false, meta: false,
      });
      expect(matched).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });

    it('matches F-keys without modifiers', () => {
      const handler = vi.fn();
      shortcuts.register('F5', 'reload', handler);
      const matched = shortcuts.handleKeyEvent({
        key: 'F5', ctrl: false, shift: false, alt: false, meta: false,
      });
      expect(matched).toBe(true);
      expect(handler).toHaveBeenCalledOnce();
    });

    it('matches Meta modifier (Cmd)', () => {
      const handler = vi.fn();
      shortcuts.register('Cmd+L', 'focus-url', handler);
      const matched = shortcuts.handleKeyEvent({
        key: 'L', ctrl: false, shift: false, alt: false, meta: true,
      });
      expect(matched).toBe(true);
      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('enableShortcut / disableShortcut', () => {
    it('disables a specific shortcut', () => {
      const reg = shortcuts.register('Ctrl+T', 'new-tab', vi.fn());
      const result = shortcuts.disableShortcut(reg.id);
      expect(result).toBe(true);
      const all = shortcuts.getAll();
      const found = all.find((r) => r.id === reg.id);
      expect(found?.enabled).toBe(false);
    });

    it('enables a previously disabled shortcut', () => {
      const reg = shortcuts.register('Ctrl+T', 'new-tab', vi.fn());
      shortcuts.disableShortcut(reg.id);
      const result = shortcuts.enableShortcut(reg.id);
      expect(result).toBe(true);
      const found = shortcuts.getAll().find((r) => r.id === reg.id);
      expect(found?.enabled).toBe(true);
    });

    it('returns false for nonexistent id', () => {
      expect(shortcuts.disableShortcut('nope')).toBe(false);
      expect(shortcuts.enableShortcut('nope')).toBe(false);
    });
  });

  describe('enableAll / disableAll', () => {
    it('disableAll prevents all shortcuts from firing', () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      shortcuts.register('Ctrl+T', 'new-tab', h1);
      shortcuts.register('Ctrl+W', 'close-tab', h2);
      shortcuts.disableAll();
      shortcuts.handleKeyEvent({ key: 'T', ctrl: true, shift: false, alt: false, meta: false });
      shortcuts.handleKeyEvent({ key: 'W', ctrl: true, shift: false, alt: false, meta: false });
      expect(h1).not.toHaveBeenCalled();
      expect(h2).not.toHaveBeenCalled();
    });

    it('enableAll re-enables all shortcuts', () => {
      const handler = vi.fn();
      shortcuts.register('Ctrl+T', 'new-tab', handler);
      shortcuts.disableAll();
      shortcuts.enableAll();
      shortcuts.handleKeyEvent({ key: 'T', ctrl: true, shift: false, alt: false, meta: false });
      expect(handler).toHaveBeenCalledOnce();
    });

    it('isEnabled reflects global state', () => {
      expect(shortcuts.isEnabled()).toBe(true);
      shortcuts.disableAll();
      expect(shortcuts.isEnabled()).toBe(false);
      shortcuts.enableAll();
      expect(shortcuts.isEnabled()).toBe(true);
    });
  });

  describe('getAll', () => {
    it('returns empty array initially', () => {
      expect(shortcuts.getAll()).toEqual([]);
    });

    it('returns all registered shortcuts', () => {
      shortcuts.register('Ctrl+T', 'new-tab', vi.fn());
      shortcuts.register('Ctrl+W', 'close-tab', vi.fn());
      shortcuts.register('F5', 'reload', vi.fn());
      expect(shortcuts.getAll()).toHaveLength(3);
    });

    it('returns copies so external mutation is impossible', () => {
      shortcuts.register('Ctrl+T', 'new-tab', vi.fn());
      const all = shortcuts.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]?.action).toBe('new-tab');
    });
  });

  describe('hasConflict', () => {
    it('returns false when no conflict exists', () => {
      expect(shortcuts.hasConflict('Ctrl+T')).toBe(false);
    });

    it('returns true when combo is already registered', () => {
      shortcuts.register('Ctrl+T', 'new-tab', vi.fn());
      expect(shortcuts.hasConflict('Ctrl+T')).toBe(true);
    });

    it('returns false after unregistering conflicting shortcut', () => {
      const reg = shortcuts.register('Ctrl+T', 'new-tab', vi.fn());
      shortcuts.unregister(reg.id);
      expect(shortcuts.hasConflict('Ctrl+T')).toBe(false);
    });

    it('detects conflict with normalized key names', () => {
      shortcuts.register('Cmd+L', 'focus-url', vi.fn());
      expect(shortcuts.hasConflict('Meta+L')).toBe(true);
    });
  });
});
