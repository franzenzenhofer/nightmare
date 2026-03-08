import { describe, it, expect } from 'vitest';
import { getNodeBridgeConfig } from '../services/node-bridge';

describe('getNodeBridgeConfig', () => {
  describe('LOCAL zone', () => {
    it('enables node', () => {
      expect(getNodeBridgeConfig('LOCAL').nodeEnabled).toBe(true);
    });

    it('disables CORS', () => {
      expect(getNodeBridgeConfig('LOCAL').corsDisabled).toBe(true);
    });

    it('uses nightmare namespace', () => {
      expect(getNodeBridgeConfig('LOCAL').apiNamespace).toBe('nightmare');
    });

    it('allows all modules including child_process', () => {
      const config = getNodeBridgeConfig('LOCAL');
      expect(config.allowedModules).toContain('fs');
      expect(config.allowedModules).toContain('path');
      expect(config.allowedModules).toContain('os');
      expect(config.allowedModules).toContain('child_process');
      expect(config.allowedModules).toContain('http');
      expect(config.allowedModules).toContain('https');
      expect(config.allowedModules).toContain('crypto');
      expect(config.allowedModules).toContain('url');
    });

    it('has exactly 8 allowed modules', () => {
      expect(getNodeBridgeConfig('LOCAL').allowedModules).toHaveLength(8);
    });
  });

  describe('LOCALHOST zone', () => {
    it('enables node', () => {
      expect(getNodeBridgeConfig('LOCALHOST').nodeEnabled).toBe(true);
    });

    it('disables CORS', () => {
      expect(getNodeBridgeConfig('LOCALHOST').corsDisabled).toBe(true);
    });

    it('uses nightmare namespace', () => {
      expect(getNodeBridgeConfig('LOCALHOST').apiNamespace).toBe('nightmare');
    });

    it('excludes child_process', () => {
      expect(getNodeBridgeConfig('LOCALHOST').allowedModules).not.toContain('child_process');
    });

    it('has exactly 7 allowed modules', () => {
      expect(getNodeBridgeConfig('LOCALHOST').allowedModules).toHaveLength(7);
    });

    it('allows fs, path, os, http, https, crypto, url', () => {
      const config = getNodeBridgeConfig('LOCALHOST');
      expect(config.allowedModules).toContain('fs');
      expect(config.allowedModules).toContain('path');
      expect(config.allowedModules).toContain('os');
      expect(config.allowedModules).toContain('http');
      expect(config.allowedModules).toContain('https');
      expect(config.allowedModules).toContain('crypto');
      expect(config.allowedModules).toContain('url');
    });
  });

  describe('WEB zone', () => {
    it('disables node', () => {
      expect(getNodeBridgeConfig('WEB').nodeEnabled).toBe(false);
    });

    it('enables CORS (corsDisabled=false)', () => {
      expect(getNodeBridgeConfig('WEB').corsDisabled).toBe(false);
    });

    it('uses nightmare namespace', () => {
      expect(getNodeBridgeConfig('WEB').apiNamespace).toBe('nightmare');
    });

    it('allows no modules', () => {
      expect(getNodeBridgeConfig('WEB').allowedModules).toHaveLength(0);
    });
  });

  describe('all zones share nightmare namespace', () => {
    it('LOCAL uses nightmare', () => {
      expect(getNodeBridgeConfig('LOCAL').apiNamespace).toBe('nightmare');
    });

    it('LOCALHOST uses nightmare', () => {
      expect(getNodeBridgeConfig('LOCALHOST').apiNamespace).toBe('nightmare');
    });

    it('WEB uses nightmare', () => {
      expect(getNodeBridgeConfig('WEB').apiNamespace).toBe('nightmare');
    });
  });
});
