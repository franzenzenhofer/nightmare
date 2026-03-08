import { describe, it, expect, beforeEach } from 'vitest';
import { UserAgentManager } from '../services/user-agent';

describe('UserAgentManager', () => {
  let manager: UserAgentManager;

  beforeEach(() => {
    manager = new UserAgentManager();
  });

  describe('getDefault', () => {
    it('returns a default user agent string', () => {
      const ua = manager.getDefault();
      expect(ua).toContain('Nightmare');
    });
  });

  describe('get', () => {
    it('returns default when no override set', () => {
      expect(manager.get('tab-1')).toBe(manager.getDefault());
    });

    it('returns override when set', () => {
      manager.set('tab-1', 'CustomUA/1.0');
      expect(manager.get('tab-1')).toBe('CustomUA/1.0');
    });
  });

  describe('set', () => {
    it('sets user agent for a specific tab', () => {
      manager.set('tab-1', 'Mozilla/5.0 Chrome/120');
      expect(manager.get('tab-1')).toBe('Mozilla/5.0 Chrome/120');
    });

    it('does not affect other tabs', () => {
      manager.set('tab-1', 'CustomUA');
      expect(manager.get('tab-2')).toBe(manager.getDefault());
    });
  });

  describe('reset', () => {
    it('resets tab to default user agent', () => {
      manager.set('tab-1', 'CustomUA');
      manager.reset('tab-1');
      expect(manager.get('tab-1')).toBe(manager.getDefault());
    });
  });

  describe('listPresets', () => {
    it('returns available UA presets', () => {
      const presets = manager.listPresets();
      expect(presets.length).toBeGreaterThan(0);
      expect(presets[0]).toHaveProperty('name');
      expect(presets[0]).toHaveProperty('value');
    });
  });

  describe('setFromPreset', () => {
    it('sets user agent from a named preset', () => {
      const presets = manager.listPresets();
      manager.setFromPreset('tab-1', presets[0]!.name);
      expect(manager.get('tab-1')).toBe(presets[0]!.value);
    });

    it('throws for unknown preset', () => {
      expect(() => manager.setFromPreset('tab-1', 'nonexistent')).toThrow();
    });
  });

  describe('getOverrides', () => {
    it('returns all tab overrides', () => {
      manager.set('tab-1', 'UA1');
      manager.set('tab-2', 'UA2');
      const overrides = manager.getOverrides();
      expect(overrides.size).toBe(2);
    });
  });
});
