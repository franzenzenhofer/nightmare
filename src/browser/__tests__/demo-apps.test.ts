import { describe, it, expect } from 'vitest';
import {
  DEMO_APPS,
  getDemosByZone,
  validateDemoConfig,
} from '../services/demo-apps';
import type { DemoApp } from '../services/demo-apps';

describe('DemoApp interface shape', () => {
  it('each demo app has name, description, path, requiredZone, features', () => {
    for (const app of DEMO_APPS) {
      expect(typeof app.name).toBe('string');
      expect(typeof app.description).toBe('string');
      expect(typeof app.path).toBe('string');
      expect(['LOCAL', 'LOCALHOST', 'WEB']).toContain(app.requiredZone);
      expect(Array.isArray(app.features)).toBe(true);
      expect(app.features.length).toBeGreaterThan(0);
    }
  });
});

describe('DEMO_APPS constant', () => {
  it('contains exactly 6 demo apps', () => {
    expect(DEMO_APPS).toHaveLength(6);
  });

  it('includes File Explorer with LOCAL zone and fs feature', () => {
    const app = DEMO_APPS.find((a) => a.name === 'File Explorer');
    expect(app).toBeDefined();
    expect(app?.requiredZone).toBe('LOCAL');
    expect(app?.features).toContain('fs');
    expect(app?.features).toContain('path');
  });

  it('includes Terminal with LOCAL zone and child_process feature', () => {
    const app = DEMO_APPS.find((a) => a.name === 'Terminal');
    expect(app).toBeDefined();
    expect(app?.requiredZone).toBe('LOCAL');
    expect(app?.features).toContain('child_process');
  });

  it('includes API Tester with LOCALHOST zone', () => {
    const app = DEMO_APPS.find((a) => a.name === 'API Tester');
    expect(app).toBeDefined();
    expect(app?.requiredZone).toBe('LOCALHOST');
    expect(app?.features).toContain('fetch');
    expect(app?.features).toContain('cors-free');
  });

  it('includes Code Editor with LOCAL zone', () => {
    const app = DEMO_APPS.find((a) => a.name === 'Code Editor');
    expect(app).toBeDefined();
    expect(app?.requiredZone).toBe('LOCAL');
    expect(app?.features).toContain('fs');
    expect(app?.features).toContain('path');
    expect(app?.features).toContain('syntax-highlight');
  });

  it('includes System Monitor with LOCAL zone', () => {
    const app = DEMO_APPS.find((a) => a.name === 'System Monitor');
    expect(app).toBeDefined();
    expect(app?.requiredZone).toBe('LOCAL');
    expect(app?.features).toContain('os');
    expect(app?.features).toContain('process');
  });

  it('includes Web Scraper with WEB zone', () => {
    const app = DEMO_APPS.find((a) => a.name === 'Web Scraper');
    expect(app).toBeDefined();
    expect(app?.requiredZone).toBe('WEB');
    expect(app?.features).toContain('fetch');
    expect(app?.features).toContain('dom-parse');
  });

  it('every app has a non-empty description', () => {
    for (const app of DEMO_APPS) {
      expect(app.description.length).toBeGreaterThan(0);
    }
  });

  it('every app has a path starting with demos/', () => {
    for (const app of DEMO_APPS) {
      expect(app.path.startsWith('demos/')).toBe(true);
    }
  });

  it('all app names are unique', () => {
    const names = DEMO_APPS.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('all app paths are unique', () => {
    const paths = DEMO_APPS.map((a) => a.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('getDemosByZone', () => {
  it('returns only LOCAL zone demos', () => {
    const locals = getDemosByZone('LOCAL');
    expect(locals.length).toBeGreaterThan(0);
    for (const app of locals) {
      expect(app.requiredZone).toBe('LOCAL');
    }
  });

  it('returns only LOCALHOST zone demos', () => {
    const localhosts = getDemosByZone('LOCALHOST');
    expect(localhosts.length).toBeGreaterThan(0);
    for (const app of localhosts) {
      expect(app.requiredZone).toBe('LOCALHOST');
    }
  });

  it('returns only WEB zone demos', () => {
    const webs = getDemosByZone('WEB');
    expect(webs.length).toBeGreaterThan(0);
    for (const app of webs) {
      expect(app.requiredZone).toBe('WEB');
    }
  });

  it('returns 4 LOCAL demos', () => {
    expect(getDemosByZone('LOCAL')).toHaveLength(4);
  });

  it('returns 1 LOCALHOST demo', () => {
    expect(getDemosByZone('LOCALHOST')).toHaveLength(1);
  });

  it('returns 1 WEB demo', () => {
    expect(getDemosByZone('WEB')).toHaveLength(1);
  });

  it('total across all zones equals DEMO_APPS length', () => {
    const total =
      getDemosByZone('LOCAL').length +
      getDemosByZone('LOCALHOST').length +
      getDemosByZone('WEB').length;
    expect(total).toBe(DEMO_APPS.length);
  });

  it('returns a new array (not the original reference)', () => {
    const first = getDemosByZone('LOCAL');
    const second = getDemosByZone('LOCAL');
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});

describe('validateDemoConfig', () => {
  const validDemo: DemoApp = {
    name: 'Test App',
    description: 'A test application',
    path: 'demos/test-app',
    requiredZone: 'LOCAL',
    features: ['fs'],
  };

  it('returns true for a valid demo config', () => {
    expect(validateDemoConfig(validDemo)).toBe(true);
  });

  it('returns false when name is empty', () => {
    expect(
      validateDemoConfig({ ...validDemo, name: '' }),
    ).toBe(false);
  });

  it('returns false when path is empty', () => {
    expect(
      validateDemoConfig({ ...validDemo, path: '' }),
    ).toBe(false);
  });

  it('returns false when path does not start with demos/', () => {
    expect(
      validateDemoConfig({ ...validDemo, path: 'src/something' }),
    ).toBe(false);
  });

  it('returns false when zone is invalid', () => {
    expect(
      validateDemoConfig({
        ...validDemo,
        requiredZone: 'INVALID' as DemoApp['requiredZone'],
      }),
    ).toBe(false);
  });

  it('returns true for LOCAL zone', () => {
    expect(
      validateDemoConfig({ ...validDemo, requiredZone: 'LOCAL' }),
    ).toBe(true);
  });

  it('returns true for LOCALHOST zone', () => {
    expect(
      validateDemoConfig({ ...validDemo, requiredZone: 'LOCALHOST' }),
    ).toBe(true);
  });

  it('returns true for WEB zone', () => {
    expect(
      validateDemoConfig({ ...validDemo, requiredZone: 'WEB' }),
    ).toBe(true);
  });

  it('returns false when features array is empty', () => {
    expect(
      validateDemoConfig({ ...validDemo, features: [] }),
    ).toBe(false);
  });

  it('returns false when description is empty', () => {
    expect(
      validateDemoConfig({ ...validDemo, description: '' }),
    ).toBe(false);
  });

  it('validates all built-in DEMO_APPS pass', () => {
    for (const app of DEMO_APPS) {
      expect(validateDemoConfig(app)).toBe(true);
    }
  });
});
