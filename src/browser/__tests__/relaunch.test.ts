import { describe, it, expect, beforeEach } from 'vitest';
import { RelaunchManager } from '../services/relaunch';

describe('RelaunchManager', () => {
  let manager: RelaunchManager;

  beforeEach(() => {
    manager = new RelaunchManager();
  });

  describe('requestRelaunch', () => {
    it('marks relaunch as pending', () => {
      manager.requestRelaunch();
      expect(manager.isPending()).toBe(true);
    });

    it('records reason', () => {
      manager.requestRelaunch('settings-changed');
      expect(manager.getReason()).toBe('settings-changed');
    });

    it('uses default reason when none provided', () => {
      manager.requestRelaunch();
      expect(manager.getReason()).toBe('user-requested');
    });
  });

  describe('cancelRelaunch', () => {
    it('clears pending state', () => {
      manager.requestRelaunch();
      manager.cancelRelaunch();
      expect(manager.isPending()).toBe(false);
    });

    it('clears reason', () => {
      manager.requestRelaunch('update');
      manager.cancelRelaunch();
      expect(manager.getReason()).toBeNull();
    });
  });

  describe('confirmRelaunch', () => {
    it('returns true when relaunch is pending', () => {
      manager.requestRelaunch();
      expect(manager.confirmRelaunch()).toBe(true);
    });

    it('returns false when no relaunch is pending', () => {
      expect(manager.confirmRelaunch()).toBe(false);
    });

    it('clears pending state after confirm', () => {
      manager.requestRelaunch();
      manager.confirmRelaunch();
      expect(manager.isPending()).toBe(false);
    });

    it('increments relaunch count', () => {
      manager.requestRelaunch();
      manager.confirmRelaunch();
      expect(manager.getRelaunchCount()).toBe(1);
    });
  });

  describe('getRelaunchCount', () => {
    it('starts at 0', () => {
      expect(manager.getRelaunchCount()).toBe(0);
    });

    it('tracks multiple relaunches', () => {
      manager.requestRelaunch();
      manager.confirmRelaunch();
      manager.requestRelaunch();
      manager.confirmRelaunch();
      expect(manager.getRelaunchCount()).toBe(2);
    });
  });
});
