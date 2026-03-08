import { describe, it, expect } from 'vitest';
import {
  ICON_SIZES,
  createIconConfigs,
  getIconPath,
  NIGHTMARE_ICON_SVG,
} from '../services/icon-config';
import type { IconConfig } from '../services/icon-config';

describe('ICON_SIZES', () => {
  it('contains exactly 7 sizes', () => {
    expect(ICON_SIZES).toHaveLength(7);
  });

  it('contains the correct sizes in ascending order', () => {
    expect(ICON_SIZES).toEqual([16, 32, 48, 64, 128, 256, 512]);
  });

  it('is readonly and cannot be mutated', () => {
    const sizes: readonly number[] = ICON_SIZES;
    expect(Object.isFrozen(sizes)).toBe(true);
  });
});

describe('createIconConfigs', () => {
  it('returns one config per icon size', () => {
    const configs = createIconConfigs('dist/icons');
    expect(configs).toHaveLength(ICON_SIZES.length);
  });

  it('generates png configs for each size', () => {
    const configs = createIconConfigs('dist/icons');
    for (const config of configs) {
      expect(config.format).toBe('png');
    }
  });

  it('sets correct size for each config', () => {
    const configs = createIconConfigs('dist/icons');
    const configSizes = configs.map((c: IconConfig) => c.size);
    expect(configSizes).toEqual([...ICON_SIZES]);
  });

  it('generates correct output paths', () => {
    const configs = createIconConfigs('dist/icons');
    expect(configs[0]?.outputPath).toBe('dist/icons/icon-16.png');
    expect(configs[6]?.outputPath).toBe('dist/icons/icon-512.png');
  });

  it('uses custom base path', () => {
    const configs = createIconConfigs('/app/assets');
    expect(configs[0]?.outputPath).toBe('/app/assets/icon-16.png');
  });

  it('returns readonly configs', () => {
    const configs = createIconConfigs('dist/icons');
    expect(Object.isFrozen(configs)).toBe(true);
    for (const config of configs) {
      expect(Object.isFrozen(config)).toBe(true);
    }
  });

  it('supports ico format override', () => {
    const configs = createIconConfigs('dist/icons', 'ico');
    for (const config of configs) {
      expect(config.format).toBe('ico');
      expect(config.outputPath).toMatch(/\.ico$/);
    }
  });

  it('supports icns format override', () => {
    const configs = createIconConfigs('dist/icons', 'icns');
    for (const config of configs) {
      expect(config.format).toBe('icns');
      expect(config.outputPath).toMatch(/\.icns$/);
    }
  });
});

describe('getIconPath', () => {
  it('returns path for size 16', () => {
    expect(getIconPath(16, 'assets')).toBe('assets/icon-16.png');
  });

  it('returns path for size 512', () => {
    expect(getIconPath(512, 'assets')).toBe('assets/icon-512.png');
  });

  it('returns path for size 128 with custom base', () => {
    expect(getIconPath(128, '/usr/share/icons')).toBe(
      '/usr/share/icons/icon-128.png',
    );
  });

  it('uses png format by default', () => {
    expect(getIconPath(64, 'icons')).toBe('icons/icon-64.png');
  });

  it('supports ico format', () => {
    expect(getIconPath(256, 'icons', 'ico')).toBe('icons/icon-256.ico');
  });

  it('supports icns format', () => {
    expect(getIconPath(32, 'icons', 'icns')).toBe('icons/icon-32.icns');
  });

  it('throws for invalid size', () => {
    expect(() => getIconPath(100, 'icons')).toThrow('Invalid icon size: 100');
  });

  it('throws for zero size', () => {
    expect(() => getIconPath(0, 'icons')).toThrow('Invalid icon size: 0');
  });

  it('throws for negative size', () => {
    expect(() => getIconPath(-16, 'icons')).toThrow('Invalid icon size: -16');
  });
});

describe('NIGHTMARE_ICON_SVG', () => {
  it('is a non-empty string', () => {
    expect(typeof NIGHTMARE_ICON_SVG).toBe('string');
    expect(NIGHTMARE_ICON_SVG.length).toBeGreaterThan(0);
  });

  it('starts with valid SVG opening tag', () => {
    expect(NIGHTMARE_ICON_SVG.trimStart()).toMatch(/^<svg\s/);
  });

  it('ends with closing SVG tag', () => {
    expect(NIGHTMARE_ICON_SVG.trimEnd()).toMatch(/<\/svg>$/);
  });

  it('has 512x512 viewBox', () => {
    expect(NIGHTMARE_ICON_SVG).toContain('viewBox="0 0 512 512"');
  });

  it('contains xmlns attribute', () => {
    expect(NIGHTMARE_ICON_SVG).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('uses the nightmare red color', () => {
    expect(NIGHTMARE_ICON_SVG).toContain('#ff4444');
  });

  it('uses a dark background color', () => {
    expect(NIGHTMARE_ICON_SVG).toContain('#1a1a2e');
  });

  it('contains rect elements for glitch effect', () => {
    expect(NIGHTMARE_ICON_SVG).toContain('<rect');
  });

  it('is valid XML (no unclosed tags)', () => {
    const openTags = NIGHTMARE_ICON_SVG.match(/<(\w+)[\s>]/g) ?? [];
    const closeTags = NIGHTMARE_ICON_SVG.match(/<\/(\w+)>/g) ?? [];
    const selfClosing =
      NIGHTMARE_ICON_SVG.match(/<\w+[^>]*\/>/g) ?? [];
    const netOpen = openTags.length - selfClosing.length;
    expect(netOpen).toBe(closeTags.length);
  });
});
