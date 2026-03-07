import { describe, it, expect } from 'vitest';
import { KeyboardShortcuts } from '../services/keyboard-shortcuts';

const shortcuts = new KeyboardShortcuts();

describe('KeyboardShortcuts', () => {
  describe('match', () => {
    it('matches Ctrl+T to new-tab', () => {
      expect(shortcuts.match('t', { ctrl: true })).toBe('new-tab');
    });

    it('matches Ctrl+W to close-tab', () => {
      expect(shortcuts.match('w', { ctrl: true })).toBe('close-tab');
    });

    it('matches Ctrl+Tab to next-tab', () => {
      expect(shortcuts.match('Tab', { ctrl: true })).toBe('next-tab');
    });

    it('matches Ctrl+Shift+Tab to prev-tab', () => {
      expect(shortcuts.match('Tab', { ctrl: true, shift: true })).toBe('prev-tab');
    });

    it('matches Ctrl+L to focus-url', () => {
      expect(shortcuts.match('l', { ctrl: true })).toBe('focus-url');
    });

    it('matches Ctrl+D to bookmark-page', () => {
      expect(shortcuts.match('d', { ctrl: true })).toBe('bookmark-page');
    });

    it('matches Ctrl+B to toggle-bookmarks', () => {
      expect(shortcuts.match('b', { ctrl: true })).toBe('toggle-bookmarks');
    });

    it('matches Ctrl+H to open-history', () => {
      expect(shortcuts.match('h', { ctrl: true })).toBe('open-history');
    });

    it('matches Ctrl+J to open-downloads', () => {
      expect(shortcuts.match('j', { ctrl: true })).toBe('open-downloads');
    });

    it('matches Ctrl+F to find-in-page', () => {
      expect(shortcuts.match('f', { ctrl: true })).toBe('find-in-page');
    });

    it('matches Ctrl+R to reload', () => {
      expect(shortcuts.match('r', { ctrl: true })).toBe('reload');
    });

    it('matches Ctrl+Shift+R to hard-reload', () => {
      expect(shortcuts.match('r', { ctrl: true, shift: true })).toBe('hard-reload');
    });

    it('matches F5 to reload', () => {
      expect(shortcuts.match('F5', {})).toBe('reload');
    });

    it('matches F11 to fullscreen', () => {
      expect(shortcuts.match('F11', {})).toBe('fullscreen');
    });

    it('matches F12 to devtools', () => {
      expect(shortcuts.match('F12', {})).toBe('devtools');
    });

    it('matches Ctrl+Shift+I to devtools', () => {
      expect(shortcuts.match('i', { ctrl: true, shift: true })).toBe('devtools');
    });

    it('matches Alt+Left to go-back', () => {
      expect(shortcuts.match('ArrowLeft', { alt: true })).toBe('go-back');
    });

    it('matches Alt+Right to go-forward', () => {
      expect(shortcuts.match('ArrowRight', { alt: true })).toBe('go-forward');
    });

    it('matches Ctrl+Plus to zoom-in', () => {
      expect(shortcuts.match('+', { ctrl: true })).toBe('zoom-in');
    });

    it('matches Ctrl+Minus to zoom-out', () => {
      expect(shortcuts.match('-', { ctrl: true })).toBe('zoom-out');
    });

    it('matches Ctrl+0 to zoom-reset', () => {
      expect(shortcuts.match('0', { ctrl: true })).toBe('zoom-reset');
    });

    it('returns null for unmatched shortcut', () => {
      expect(shortcuts.match('x', { ctrl: true })).toBeNull();
    });

    it('returns null when no modifiers match', () => {
      expect(shortcuts.match('t', {})).toBeNull();
    });

    it('returns null for partial modifier match', () => {
      expect(shortcuts.match('t', { alt: true })).toBeNull();
    });

    it('distinguishes shift variants (Ctrl+R vs Ctrl+Shift+R)', () => {
      expect(shortcuts.match('r', { ctrl: true })).toBe('reload');
      expect(shortcuts.match('r', { ctrl: true, shift: true })).toBe('hard-reload');
    });

    it('distinguishes shift variants (Ctrl+Tab vs Ctrl+Shift+Tab)', () => {
      expect(shortcuts.match('Tab', { ctrl: true })).toBe('next-tab');
      expect(shortcuts.match('Tab', { ctrl: true, shift: true })).toBe('prev-tab');
    });
  });

  describe('getBindings', () => {
    it('returns all registered bindings', () => {
      const bindings = shortcuts.getBindings();
      expect(bindings.length).toBe(21);
    });

    it('returns readonly array', () => {
      const bindings = shortcuts.getBindings();
      expect(Array.isArray(bindings)).toBe(true);
    });

    it('includes Ctrl+T binding', () => {
      const bindings = shortcuts.getBindings();
      const ctrlT = bindings.find((b) => b.key === 't' && b.ctrl === true);
      expect(ctrlT).toBeDefined();
      expect(ctrlT?.action).toBe('new-tab');
    });

    it('includes F5 binding without modifiers', () => {
      const bindings = shortcuts.getBindings();
      const f5 = bindings.find((b) => b.key === 'F5');
      expect(f5).toBeDefined();
      expect(f5?.action).toBe('reload');
    });
  });
});
