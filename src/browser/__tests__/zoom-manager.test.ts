import { describe, it, expect, beforeEach } from 'vitest';
import { ZoomManager, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT } from '../services/zoom-manager';

let zm: ZoomManager;
beforeEach(() => {
  zm = new ZoomManager();
});

describe('ZoomManager', () => {
  describe('constants', () => {
    it('exports correct zoom constants', () => {
      expect(ZOOM_MIN).toBe(0.25);
      expect(ZOOM_MAX).toBe(5.0);
      expect(ZOOM_STEP).toBe(0.1);
      expect(ZOOM_DEFAULT).toBe(1.0);
    });
  });

  describe('getZoom', () => {
    it('returns default zoom for unknown tab', () => {
      expect(zm.getZoom('unknown-tab')).toBe(1.0);
    });

    it('returns default zoom for newly tracked tab', () => {
      zm.setZoom('tab-1', 1.0);
      expect(zm.getZoom('tab-1')).toBe(1.0);
    });
  });

  describe('setZoom', () => {
    it('sets an exact zoom level', () => {
      zm.setZoom('tab-1', 2.0);
      expect(zm.getZoom('tab-1')).toBe(2.0);
    });

    it('clamps to minimum when below ZOOM_MIN', () => {
      zm.setZoom('tab-1', 0.1);
      expect(zm.getZoom('tab-1')).toBe(ZOOM_MIN);
    });

    it('clamps to maximum when above ZOOM_MAX', () => {
      zm.setZoom('tab-1', 10.0);
      expect(zm.getZoom('tab-1')).toBe(ZOOM_MAX);
    });

    it('clamps exactly at boundaries', () => {
      zm.setZoom('tab-1', 0.25);
      expect(zm.getZoom('tab-1')).toBe(0.25);

      zm.setZoom('tab-1', 5.0);
      expect(zm.getZoom('tab-1')).toBe(5.0);
    });

    it('handles zero zoom by clamping to min', () => {
      zm.setZoom('tab-1', 0);
      expect(zm.getZoom('tab-1')).toBe(ZOOM_MIN);
    });

    it('handles negative zoom by clamping to min', () => {
      zm.setZoom('tab-1', -1.0);
      expect(zm.getZoom('tab-1')).toBe(ZOOM_MIN);
    });

    it('tracks zoom independently per tab', () => {
      zm.setZoom('tab-1', 1.5);
      zm.setZoom('tab-2', 3.0);
      expect(zm.getZoom('tab-1')).toBe(1.5);
      expect(zm.getZoom('tab-2')).toBe(3.0);
    });
  });

  describe('zoomIn', () => {
    it('increases zoom by ZOOM_STEP from default', () => {
      const level = zm.zoomIn('tab-1');
      expect(level).toBeCloseTo(1.1);
      expect(zm.getZoom('tab-1')).toBeCloseTo(1.1);
    });

    it('increases zoom from a custom level', () => {
      zm.setZoom('tab-1', 2.0);
      const level = zm.zoomIn('tab-1');
      expect(level).toBeCloseTo(2.1);
    });

    it('clamps at ZOOM_MAX', () => {
      zm.setZoom('tab-1', 4.95);
      const level = zm.zoomIn('tab-1');
      expect(level).toBe(ZOOM_MAX);
    });

    it('does not exceed ZOOM_MAX when already at max', () => {
      zm.setZoom('tab-1', 5.0);
      const level = zm.zoomIn('tab-1');
      expect(level).toBe(ZOOM_MAX);
    });
  });

  describe('zoomOut', () => {
    it('decreases zoom by ZOOM_STEP from default', () => {
      const level = zm.zoomOut('tab-1');
      expect(level).toBeCloseTo(0.9);
      expect(zm.getZoom('tab-1')).toBeCloseTo(0.9);
    });

    it('decreases zoom from a custom level', () => {
      zm.setZoom('tab-1', 2.0);
      const level = zm.zoomOut('tab-1');
      expect(level).toBeCloseTo(1.9);
    });

    it('clamps at ZOOM_MIN', () => {
      zm.setZoom('tab-1', 0.3);
      const level = zm.zoomOut('tab-1');
      expect(level).toBe(ZOOM_MIN);
    });

    it('does not go below ZOOM_MIN when already at min', () => {
      zm.setZoom('tab-1', 0.25);
      const level = zm.zoomOut('tab-1');
      expect(level).toBe(ZOOM_MIN);
    });
  });

  describe('resetZoom', () => {
    it('resets zoom to default', () => {
      zm.setZoom('tab-1', 3.0);
      const level = zm.resetZoom('tab-1');
      expect(level).toBe(ZOOM_DEFAULT);
      expect(zm.getZoom('tab-1')).toBe(ZOOM_DEFAULT);
    });

    it('is idempotent on default zoom', () => {
      const level = zm.resetZoom('tab-1');
      expect(level).toBe(ZOOM_DEFAULT);
    });

    it('resets only the specified tab', () => {
      zm.setZoom('tab-1', 2.0);
      zm.setZoom('tab-2', 3.0);
      zm.resetZoom('tab-1');
      expect(zm.getZoom('tab-1')).toBe(ZOOM_DEFAULT);
      expect(zm.getZoom('tab-2')).toBe(3.0);
    });
  });

  describe('removeTab', () => {
    it('removes zoom tracking for a tab', () => {
      zm.setZoom('tab-1', 2.0);
      zm.removeTab('tab-1');
      expect(zm.getZoom('tab-1')).toBe(ZOOM_DEFAULT);
    });

    it('does not throw for unknown tab', () => {
      expect(() => zm.removeTab('unknown')).not.toThrow();
    });
  });

  describe('getAllZoomLevels', () => {
    it('returns empty map when no tabs tracked', () => {
      const levels = zm.getAllZoomLevels();
      expect(levels.size).toBe(0);
    });

    it('returns all tracked zoom levels', () => {
      zm.setZoom('tab-1', 1.5);
      zm.setZoom('tab-2', 2.0);
      const levels = zm.getAllZoomLevels();
      expect(levels.size).toBe(2);
      expect(levels.get('tab-1')).toBe(1.5);
      expect(levels.get('tab-2')).toBe(2.0);
    });

    it('returns a copy, not the internal map', () => {
      zm.setZoom('tab-1', 1.5);
      const levels = zm.getAllZoomLevels();
      levels.set('tab-1', 9.9);
      expect(zm.getZoom('tab-1')).toBe(1.5);
    });
  });
});
