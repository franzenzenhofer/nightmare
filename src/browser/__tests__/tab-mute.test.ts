import { describe, it, expect, beforeEach } from 'vitest';
import { TabMuteManager } from '../services/tab-mute';

let mute: TabMuteManager;
beforeEach(() => {
  mute = new TabMuteManager();
});

describe('TabMuteManager', () => {
  describe('isMuted', () => {
    it('returns false for unknown tab (default unmuted)', () => {
      expect(mute.isMuted('unknown')).toBe(false);
    });

    it('returns false for a tab that was never muted', () => {
      expect(mute.isMuted('tab-1')).toBe(false);
    });
  });

  describe('mute', () => {
    it('mutes a specific tab', () => {
      mute.mute('tab-1');
      expect(mute.isMuted('tab-1')).toBe(true);
    });

    it('is idempotent when muting an already muted tab', () => {
      mute.mute('tab-1');
      mute.mute('tab-1');
      expect(mute.isMuted('tab-1')).toBe(true);
    });

    it('mutes tabs independently', () => {
      mute.mute('tab-1');
      expect(mute.isMuted('tab-1')).toBe(true);
      expect(mute.isMuted('tab-2')).toBe(false);
    });
  });

  describe('unmute', () => {
    it('unmutes a muted tab', () => {
      mute.mute('tab-1');
      mute.unmute('tab-1');
      expect(mute.isMuted('tab-1')).toBe(false);
    });

    it('is safe to call on an already unmuted tab', () => {
      mute.unmute('tab-1');
      expect(mute.isMuted('tab-1')).toBe(false);
    });

    it('is safe to call on an unknown tab', () => {
      expect(() => mute.unmute('unknown')).not.toThrow();
      expect(mute.isMuted('unknown')).toBe(false);
    });
  });

  describe('toggle', () => {
    it('mutes an unmuted tab and returns true', () => {
      const result = mute.toggle('tab-1');
      expect(result).toBe(true);
      expect(mute.isMuted('tab-1')).toBe(true);
    });

    it('unmutes a muted tab and returns false', () => {
      mute.mute('tab-1');
      const result = mute.toggle('tab-1');
      expect(result).toBe(false);
      expect(mute.isMuted('tab-1')).toBe(false);
    });

    it('toggles back and forth correctly', () => {
      mute.toggle('tab-1');
      expect(mute.isMuted('tab-1')).toBe(true);
      mute.toggle('tab-1');
      expect(mute.isMuted('tab-1')).toBe(false);
      mute.toggle('tab-1');
      expect(mute.isMuted('tab-1')).toBe(true);
    });
  });

  describe('muteAll', () => {
    it('mutes all tracked tabs', () => {
      mute.mute('tab-1');
      mute.unmute('tab-1');
      mute.mute('tab-2');
      mute.muteAll(['tab-1', 'tab-2', 'tab-3']);
      expect(mute.isMuted('tab-1')).toBe(true);
      expect(mute.isMuted('tab-2')).toBe(true);
      expect(mute.isMuted('tab-3')).toBe(true);
    });

    it('works with an empty tab list', () => {
      expect(() => mute.muteAll([])).not.toThrow();
    });

    it('does not affect tabs not in the list', () => {
      mute.mute('tab-existing');
      mute.muteAll(['tab-1']);
      expect(mute.isMuted('tab-existing')).toBe(true);
      expect(mute.isMuted('tab-1')).toBe(true);
    });
  });

  describe('unmuteAll', () => {
    it('unmutes all tracked tabs', () => {
      mute.mute('tab-1');
      mute.mute('tab-2');
      mute.mute('tab-3');
      mute.unmuteAll();
      expect(mute.isMuted('tab-1')).toBe(false);
      expect(mute.isMuted('tab-2')).toBe(false);
      expect(mute.isMuted('tab-3')).toBe(false);
    });

    it('works when no tabs are muted', () => {
      expect(() => mute.unmuteAll()).not.toThrow();
    });

    it('clears the muted set completely', () => {
      mute.mute('tab-1');
      mute.mute('tab-2');
      mute.unmuteAll();
      expect(mute.getMutedTabIds()).toEqual([]);
    });
  });

  describe('getMutedTabIds', () => {
    it('returns empty array when no tabs are muted', () => {
      expect(mute.getMutedTabIds()).toEqual([]);
    });

    it('returns all muted tab IDs', () => {
      mute.mute('tab-1');
      mute.mute('tab-2');
      const ids = mute.getMutedTabIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain('tab-1');
      expect(ids).toContain('tab-2');
    });

    it('excludes unmuted tabs', () => {
      mute.mute('tab-1');
      mute.mute('tab-2');
      mute.unmute('tab-1');
      const ids = mute.getMutedTabIds();
      expect(ids).toEqual(['tab-2']);
    });

    it('returns a copy, not the internal state', () => {
      mute.mute('tab-1');
      const ids = mute.getMutedTabIds();
      ids.push('tab-fake');
      expect(mute.getMutedTabIds()).toEqual(['tab-1']);
    });
  });

  describe('hasAnyMuted', () => {
    it('returns false when no tabs are muted', () => {
      expect(mute.hasAnyMuted()).toBe(false);
    });

    it('returns true when at least one tab is muted', () => {
      mute.mute('tab-1');
      expect(mute.hasAnyMuted()).toBe(true);
    });

    it('returns false after all tabs are unmuted', () => {
      mute.mute('tab-1');
      mute.unmute('tab-1');
      expect(mute.hasAnyMuted()).toBe(false);
    });

    it('returns false after unmuteAll', () => {
      mute.mute('tab-1');
      mute.mute('tab-2');
      mute.unmuteAll();
      expect(mute.hasAnyMuted()).toBe(false);
    });
  });

  describe('removeTab', () => {
    it('removes a muted tab from tracking', () => {
      mute.mute('tab-1');
      mute.removeTab('tab-1');
      expect(mute.isMuted('tab-1')).toBe(false);
      expect(mute.getMutedTabIds()).toEqual([]);
    });

    it('does not throw for unknown tab', () => {
      expect(() => mute.removeTab('unknown')).not.toThrow();
    });

    it('does not affect other tabs', () => {
      mute.mute('tab-1');
      mute.mute('tab-2');
      mute.removeTab('tab-1');
      expect(mute.isMuted('tab-2')).toBe(true);
      expect(mute.getMutedTabIds()).toEqual(['tab-2']);
    });

    it('removes an unmuted tab cleanly', () => {
      mute.removeTab('tab-1');
      expect(mute.isMuted('tab-1')).toBe(false);
    });
  });
});
