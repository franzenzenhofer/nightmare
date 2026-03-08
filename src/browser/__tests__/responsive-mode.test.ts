import { describe, it, expect, beforeEach } from 'vitest';
import {
  ResponsiveMode,
  DEVICE_PRESETS,
  VIEWPORT_MIN_WIDTH,
  VIEWPORT_MIN_HEIGHT,
  VIEWPORT_MAX_WIDTH,
  VIEWPORT_MAX_HEIGHT,
  DEFAULT_DEVICE_PIXEL_RATIO,
} from '../services/responsive-mode';
import type { ViewportPreset, ViewportState } from '../services/responsive-mode';

let rm: ResponsiveMode;
beforeEach(() => {
  rm = new ResponsiveMode();
});

describe('ResponsiveMode', () => {
  describe('constants', () => {
    it('exports correct dimension constraints', () => {
      expect(VIEWPORT_MIN_WIDTH).toBe(100);
      expect(VIEWPORT_MIN_HEIGHT).toBe(100);
      expect(VIEWPORT_MAX_WIDTH).toBe(7680);
      expect(VIEWPORT_MAX_HEIGHT).toBe(4320);
    });

    it('exports default device pixel ratio', () => {
      expect(DEFAULT_DEVICE_PIXEL_RATIO).toBe(1);
    });

    it('exports all seven device presets', () => {
      expect(DEVICE_PRESETS).toHaveLength(7);
    });

    it('includes iPhone SE preset with correct values', () => {
      const preset = DEVICE_PRESETS.find((p) => p.name === 'iPhone SE');
      expect(preset).toEqual({ name: 'iPhone SE', width: 375, height: 667, devicePixelRatio: 2 });
    });

    it('includes iPhone 14 Pro preset with correct values', () => {
      const preset = DEVICE_PRESETS.find((p) => p.name === 'iPhone 14 Pro');
      expect(preset).toEqual({ name: 'iPhone 14 Pro', width: 393, height: 852, devicePixelRatio: 3 });
    });

    it('includes iPad preset with correct values', () => {
      const preset = DEVICE_PRESETS.find((p) => p.name === 'iPad');
      expect(preset).toEqual({ name: 'iPad', width: 768, height: 1024, devicePixelRatio: 2 });
    });

    it('includes iPad Pro preset with correct values', () => {
      const preset = DEVICE_PRESETS.find((p) => p.name === 'iPad Pro');
      expect(preset).toEqual({ name: 'iPad Pro', width: 1024, height: 1366, devicePixelRatio: 2 });
    });

    it('includes Galaxy S21 preset with correct values', () => {
      const preset = DEVICE_PRESETS.find((p) => p.name === 'Galaxy S21');
      expect(preset).toEqual({ name: 'Galaxy S21', width: 360, height: 800, devicePixelRatio: 3 });
    });

    it('includes Desktop HD preset with correct values', () => {
      const preset = DEVICE_PRESETS.find((p) => p.name === 'Desktop HD');
      expect(preset).toEqual({ name: 'Desktop HD', width: 1920, height: 1080, devicePixelRatio: 1 });
    });

    it('includes Desktop 4K preset with correct values', () => {
      const preset = DEVICE_PRESETS.find((p) => p.name === 'Desktop 4K');
      expect(preset).toEqual({ name: 'Desktop 4K', width: 3840, height: 2160, devicePixelRatio: 1 });
    });
  });

  describe('getViewport', () => {
    it('returns null for unknown tab', () => {
      expect(rm.getViewport('unknown')).toBeNull();
    });

    it('returns viewport state after setting custom dimensions', () => {
      rm.setViewport('tab-1', 800, 600);
      const vp = rm.getViewport('tab-1');
      expect(vp).toEqual({
        width: 800,
        height: 600,
        devicePixelRatio: 1,
        isResponsiveMode: true,
      });
    });
  });

  describe('setViewport', () => {
    it('sets custom viewport dimensions for a tab', () => {
      const state = rm.setViewport('tab-1', 1024, 768);
      expect(state.width).toBe(1024);
      expect(state.height).toBe(768);
      expect(state.devicePixelRatio).toBe(1);
      expect(state.isResponsiveMode).toBe(true);
    });

    it('overwrites existing viewport for same tab', () => {
      rm.setViewport('tab-1', 800, 600);
      const state = rm.setViewport('tab-1', 1920, 1080);
      expect(state.width).toBe(1920);
      expect(state.height).toBe(1080);
    });

    it('tracks viewports independently per tab', () => {
      rm.setViewport('tab-1', 375, 667);
      rm.setViewport('tab-2', 1920, 1080);
      expect(rm.getViewport('tab-1')?.width).toBe(375);
      expect(rm.getViewport('tab-2')?.width).toBe(1920);
    });

    it('preserves existing device pixel ratio when setting dimensions', () => {
      rm.setViewport('tab-1', 800, 600);
      rm.setDevicePixelRatio('tab-1', 2);
      const state = rm.setViewport('tab-1', 1024, 768);
      expect(state.devicePixelRatio).toBe(2);
    });
  });

  describe('dimension validation', () => {
    it('throws for width below minimum', () => {
      expect(() => rm.setViewport('tab-1', 99, 200)).toThrow('Width must be between 100 and 7680');
    });

    it('throws for height below minimum', () => {
      expect(() => rm.setViewport('tab-1', 200, 99)).toThrow('Height must be between 100 and 4320');
    });

    it('throws for width above maximum', () => {
      expect(() => rm.setViewport('tab-1', 7681, 200)).toThrow('Width must be between 100 and 7680');
    });

    it('throws for height above maximum', () => {
      expect(() => rm.setViewport('tab-1', 200, 4321)).toThrow('Height must be between 100 and 4320');
    });

    it('accepts exact minimum dimensions', () => {
      const state = rm.setViewport('tab-1', 100, 100);
      expect(state.width).toBe(100);
      expect(state.height).toBe(100);
    });

    it('accepts exact maximum dimensions', () => {
      const state = rm.setViewport('tab-1', 7680, 4320);
      expect(state.width).toBe(7680);
      expect(state.height).toBe(4320);
    });

    it('throws for non-integer width', () => {
      expect(() => rm.setViewport('tab-1', 100.5, 200)).toThrow('Width must be an integer');
    });

    it('throws for non-integer height', () => {
      expect(() => rm.setViewport('tab-1', 200, 100.5)).toThrow('Height must be an integer');
    });
  });

  describe('resetViewport', () => {
    it('removes viewport state for a tab', () => {
      rm.setViewport('tab-1', 800, 600);
      rm.resetViewport('tab-1');
      expect(rm.getViewport('tab-1')).toBeNull();
    });

    it('returns false when tab has no viewport to reset', () => {
      expect(rm.resetViewport('unknown')).toBe(false);
    });

    it('returns true when viewport was reset', () => {
      rm.setViewport('tab-1', 800, 600);
      expect(rm.resetViewport('tab-1')).toBe(true);
    });

    it('does not affect other tabs', () => {
      rm.setViewport('tab-1', 800, 600);
      rm.setViewport('tab-2', 1024, 768);
      rm.resetViewport('tab-1');
      expect(rm.getViewport('tab-2')?.width).toBe(1024);
    });
  });

  describe('setFromPreset', () => {
    it('sets viewport from a known preset name', () => {
      const state = rm.setFromPreset('tab-1', 'iPhone SE');
      expect(state.width).toBe(375);
      expect(state.height).toBe(667);
      expect(state.devicePixelRatio).toBe(2);
      expect(state.isResponsiveMode).toBe(true);
    });

    it('sets viewport from iPad Pro preset', () => {
      const state = rm.setFromPreset('tab-1', 'iPad Pro');
      expect(state.width).toBe(1024);
      expect(state.height).toBe(1366);
      expect(state.devicePixelRatio).toBe(2);
    });

    it('sets viewport from Desktop 4K preset', () => {
      const state = rm.setFromPreset('tab-1', 'Desktop 4K');
      expect(state.width).toBe(3840);
      expect(state.height).toBe(2160);
      expect(state.devicePixelRatio).toBe(1);
    });

    it('throws for unknown preset name', () => {
      expect(() => rm.setFromPreset('tab-1', 'Nokia 3310')).toThrow('Unknown preset: Nokia 3310');
    });
  });

  describe('setDevicePixelRatio', () => {
    it('sets device pixel ratio for a tab in responsive mode', () => {
      rm.setViewport('tab-1', 800, 600);
      const state = rm.setDevicePixelRatio('tab-1', 2);
      expect(state.devicePixelRatio).toBe(2);
    });

    it('supports 3x pixel ratio', () => {
      rm.setViewport('tab-1', 800, 600);
      const state = rm.setDevicePixelRatio('tab-1', 3);
      expect(state.devicePixelRatio).toBe(3);
    });

    it('throws when tab is not in responsive mode', () => {
      expect(() => rm.setDevicePixelRatio('tab-1', 2)).toThrow(
        'Tab tab-1 is not in responsive mode',
      );
    });

    it('throws for invalid pixel ratio below 1', () => {
      rm.setViewport('tab-1', 800, 600);
      expect(() => rm.setDevicePixelRatio('tab-1', 0)).toThrow(
        'Device pixel ratio must be 1, 2, or 3',
      );
    });

    it('throws for invalid pixel ratio above 3', () => {
      rm.setViewport('tab-1', 800, 600);
      expect(() => rm.setDevicePixelRatio('tab-1', 4)).toThrow(
        'Device pixel ratio must be 1, 2, or 3',
      );
    });

    it('throws for non-integer pixel ratio', () => {
      rm.setViewport('tab-1', 800, 600);
      expect(() => rm.setDevicePixelRatio('tab-1', 1.5)).toThrow(
        'Device pixel ratio must be 1, 2, or 3',
      );
    });

    it('preserves width and height when changing pixel ratio', () => {
      rm.setViewport('tab-1', 800, 600);
      const state = rm.setDevicePixelRatio('tab-1', 3);
      expect(state.width).toBe(800);
      expect(state.height).toBe(600);
    });
  });

  describe('isResponsiveMode', () => {
    it('returns false for unknown tab', () => {
      expect(rm.isResponsiveMode('unknown')).toBe(false);
    });

    it('returns true after setting viewport', () => {
      rm.setViewport('tab-1', 800, 600);
      expect(rm.isResponsiveMode('tab-1')).toBe(true);
    });

    it('returns false after resetting viewport', () => {
      rm.setViewport('tab-1', 800, 600);
      rm.resetViewport('tab-1');
      expect(rm.isResponsiveMode('tab-1')).toBe(false);
    });

    it('returns true after setting from preset', () => {
      rm.setFromPreset('tab-1', 'Galaxy S21');
      expect(rm.isResponsiveMode('tab-1')).toBe(true);
    });
  });

  describe('listPresets', () => {
    it('returns all device presets', () => {
      const presets = rm.listPresets();
      expect(presets).toHaveLength(7);
    });

    it('returns a copy, not the internal array', () => {
      const presets = rm.listPresets();
      const originalLength = presets.length;
      presets.push({ name: 'Custom', width: 500, height: 500, devicePixelRatio: 1 });
      expect(rm.listPresets()).toHaveLength(originalLength);
    });

    it('contains all expected preset names', () => {
      const names = rm.listPresets().map((p) => p.name);
      expect(names).toContain('iPhone SE');
      expect(names).toContain('iPhone 14 Pro');
      expect(names).toContain('iPad');
      expect(names).toContain('iPad Pro');
      expect(names).toContain('Galaxy S21');
      expect(names).toContain('Desktop HD');
      expect(names).toContain('Desktop 4K');
    });
  });

  describe('removeTab', () => {
    it('removes viewport tracking for a tab', () => {
      rm.setViewport('tab-1', 800, 600);
      rm.removeTab('tab-1');
      expect(rm.getViewport('tab-1')).toBeNull();
    });

    it('does not throw for unknown tab', () => {
      expect(() => rm.removeTab('unknown')).not.toThrow();
    });

    it('does not affect other tabs', () => {
      rm.setViewport('tab-1', 800, 600);
      rm.setViewport('tab-2', 1024, 768);
      rm.removeTab('tab-1');
      expect(rm.getViewport('tab-2')?.width).toBe(1024);
    });
  });
});
