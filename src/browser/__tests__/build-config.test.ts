import { describe, it, expect } from 'vitest';
import {
  createBuildConfig,
  validateBuildConfig,
  getBuildCommand,
} from '../services/build-config';
import type { BuildConfig, Platform } from '../services/build-config';

describe('BuildConfig', () => {
  describe('createBuildConfig', () => {
    it('returns a valid config with all defaults', () => {
      const config = createBuildConfig();
      expect(config.platforms).toEqual(['linux', 'osx', 'win']);
      expect(config.arch).toBe('x64');
      expect(config.version).toBe('latest');
      expect(config.srcDir).toBe('src/');
      expect(config.outDir).toBe('dist/');
      expect(config.appName).toBe('nightmare-browser');
      expect(config.iconLinux).toBe('assets/icon.png');
      expect(config.iconOsx).toBe('assets/icon.icns');
      expect(config.iconWin).toBe('assets/icon.ico');
    });

    it('allows overriding platforms', () => {
      const config = createBuildConfig({ platforms: ['osx'] });
      expect(config.platforms).toEqual(['osx']);
    });

    it('allows overriding arch', () => {
      const config = createBuildConfig({ arch: 'arm64' });
      expect(config.arch).toBe('arm64');
    });

    it('allows overriding version', () => {
      const config = createBuildConfig({ version: '0.88.0' });
      expect(config.version).toBe('0.88.0');
    });

    it('allows overriding srcDir', () => {
      const config = createBuildConfig({ srcDir: 'app/' });
      expect(config.srcDir).toBe('app/');
    });

    it('allows overriding outDir', () => {
      const config = createBuildConfig({ outDir: 'build/' });
      expect(config.outDir).toBe('build/');
    });

    it('allows overriding appName', () => {
      const config = createBuildConfig({ appName: 'my-browser' });
      expect(config.appName).toBe('my-browser');
    });

    it('allows overriding icon paths', () => {
      const config = createBuildConfig({
        iconLinux: 'icons/linux.png',
        iconOsx: 'icons/osx.icns',
        iconWin: 'icons/win.ico',
      });
      expect(config.iconLinux).toBe('icons/linux.png');
      expect(config.iconOsx).toBe('icons/osx.icns');
      expect(config.iconWin).toBe('icons/win.ico');
    });

    it('allows overriding multiple fields at once', () => {
      const config = createBuildConfig({
        platforms: ['win'],
        arch: 'arm64',
        appName: 'custom',
      });
      expect(config.platforms).toEqual(['win']);
      expect(config.arch).toBe('arm64');
      expect(config.appName).toBe('custom');
      expect(config.version).toBe('latest');
    });

    it('returns a new object each time', () => {
      const a = createBuildConfig();
      const b = createBuildConfig();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('validateBuildConfig', () => {
    it('returns valid for default config', () => {
      const result = validateBuildConfig(createBuildConfig());
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('rejects empty platforms array', () => {
      const config = createBuildConfig({ platforms: [] as unknown as readonly Platform[] });
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('platforms must contain at least one target');
    });

    it('rejects invalid platform value', () => {
      const config = createBuildConfig({
        platforms: ['android' as Platform],
      });
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid platform: android');
    });

    it('rejects invalid arch value', () => {
      const config: BuildConfig = { ...createBuildConfig(), arch: 'mips' };
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid arch: mips');
    });

    it('rejects empty appName', () => {
      const config: BuildConfig = { ...createBuildConfig(), appName: '' };
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('appName must not be empty');
    });

    it('rejects empty srcDir', () => {
      const config: BuildConfig = { ...createBuildConfig(), srcDir: '' };
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('srcDir must not be empty');
    });

    it('rejects empty outDir', () => {
      const config: BuildConfig = { ...createBuildConfig(), outDir: '' };
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('outDir must not be empty');
    });

    it('rejects empty version', () => {
      const config: BuildConfig = { ...createBuildConfig(), version: '' };
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('version must not be empty');
    });

    it('collects multiple errors at once', () => {
      const config: BuildConfig = {
        ...createBuildConfig(),
        appName: '',
        srcDir: '',
        version: '',
      };
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('validates single-platform configs', () => {
      const config = createBuildConfig({ platforms: ['linux'] });
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(true);
    });

    it('rejects duplicate platforms', () => {
      const config = createBuildConfig({
        platforms: ['linux', 'linux'] as unknown as readonly Platform[],
      });
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('platforms contains duplicates');
    });
  });

  describe('getBuildCommand', () => {
    it('returns correct command for default config', () => {
      const cmd = getBuildCommand(createBuildConfig());
      expect(cmd).toBe(
        'nw-builder --platforms linux,osx,win --arch x64 --version latest --buildDir dist/ src/'
      );
    });

    it('returns correct command for single platform', () => {
      const config = createBuildConfig({ platforms: ['osx'] });
      const cmd = getBuildCommand(config);
      expect(cmd).toContain('--platforms osx');
    });

    it('returns correct command with custom arch', () => {
      const config = createBuildConfig({ arch: 'arm64' });
      const cmd = getBuildCommand(config);
      expect(cmd).toContain('--arch arm64');
    });

    it('returns correct command with custom outDir', () => {
      const config = createBuildConfig({ outDir: 'build/' });
      const cmd = getBuildCommand(config);
      expect(cmd).toContain('--buildDir build/');
    });

    it('returns correct command with custom version', () => {
      const config = createBuildConfig({ version: '0.88.0' });
      const cmd = getBuildCommand(config);
      expect(cmd).toContain('--version 0.88.0');
    });

    it('ends with srcDir as the positional argument', () => {
      const config = createBuildConfig({ srcDir: 'app/' });
      const cmd = getBuildCommand(config);
      expect(cmd).toMatch(/app\/$/);
    });

    it('throws on invalid config', () => {
      const config: BuildConfig = { ...createBuildConfig(), appName: '' };
      expect(() => getBuildCommand(config)).toThrow(
        'invalid build config'
      );
    });
  });
});
