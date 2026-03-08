import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Script, createContext } from 'vm';

// Load zones.js in a V8 sandbox context to test it as NW.js would load it
// This is the standard way to test global-scope scripts — vm.Script is safe
// and specifically designed for this purpose (not arbitrary user input).

function loadZones(apiPort) {
  const code = readFileSync(join(__dirname, '..', 'js', 'zones.js'), 'utf8');
  const sandbox = { API_PORT: apiPort, URL: globalThis.URL };
  createContext(sandbox);
  const script = new Script(code);
  script.runInContext(sandbox);
  return sandbox;
}

describe('classifyZone', () => {
  let classifyZone;

  beforeAll(() => {
    const mod = loadZones(6660);
    classifyZone = mod.classifyZone;
  });

  it('classifies proxy URLs as WEB', () => {
    expect(classifyZone('http://127.0.0.1:6660/proxy/https%3A%2F%2Fexample.com')).toBe('WEB');
  });

  it('classifies file:// URLs as LOCAL', () => {
    expect(classifyZone('file:///Users/foo/bar.html')).toBe('LOCAL');
  });

  it('classifies nightmare:// URLs as LOCAL', () => {
    expect(classifyZone('nightmare://home')).toBe('LOCAL');
  });

  it('classifies localhost as LOCALHOST', () => {
    expect(classifyZone('http://localhost:3000')).toBe('LOCALHOST');
  });

  it('classifies 127.0.0.1 as LOCALHOST', () => {
    expect(classifyZone('http://127.0.0.1:8080')).toBe('LOCALHOST');
  });

  it('classifies [::1] as LOCALHOST', () => {
    expect(classifyZone('http://[::1]:3000')).toBe('LOCALHOST');
  });

  it('classifies 0.0.0.0 as LOCALHOST', () => {
    expect(classifyZone('http://0.0.0.0:5000')).toBe('LOCALHOST');
  });

  it('classifies .localhost subdomains as LOCALHOST', () => {
    expect(classifyZone('http://app.localhost:3000')).toBe('LOCALHOST');
  });

  it('classifies 192.168.x.x as LOCALHOST', () => {
    expect(classifyZone('http://192.168.1.100:80')).toBe('LOCALHOST');
  });

  it('classifies 10.x.x.x as LOCALHOST', () => {
    expect(classifyZone('http://10.0.0.1:80')).toBe('LOCALHOST');
  });

  it('classifies 172.16-31.x.x as LOCALHOST', () => {
    expect(classifyZone('http://172.16.0.1:80')).toBe('LOCALHOST');
    expect(classifyZone('http://172.31.255.255:80')).toBe('LOCALHOST');
  });

  it('classifies 172.32.x.x as WEB (out of range)', () => {
    expect(classifyZone('http://172.32.0.1:80')).toBe('WEB');
  });

  it('classifies external URLs as WEB', () => {
    expect(classifyZone('https://example.com')).toBe('WEB');
    expect(classifyZone('https://www.google.com')).toBe('WEB');
    expect(classifyZone('http://evil.site')).toBe('WEB');
  });

  it('classifies malformed URLs as LOCAL', () => {
    expect(classifyZone('not-a-url')).toBe('LOCAL');
    expect(classifyZone('')).toBe('LOCAL');
  });
});

describe('ZONE constants', () => {
  it('defines colors for all zones', () => {
    const mod = loadZones(6660);
    expect(mod.ZONE_COLORS.LOCAL).toBe('#4ade80');
    expect(mod.ZONE_COLORS.LOCALHOST).toBe('#60a5fa');
    expect(mod.ZONE_COLORS.WEB).toBe('#ff3333');
  });

  it('defines CSS classes for all zones', () => {
    const mod = loadZones(6660);
    expect(mod.ZONE_CSS.LOCAL).toBe('local');
    expect(mod.ZONE_CSS.LOCALHOST).toBe('localhost');
    expect(mod.ZONE_CSS.WEB).toBe('web');
  });

  it('defines messages for all zones', () => {
    const mod = loadZones(6660);
    expect(mod.ZONE_MSG.LOCAL).toContain('LOCAL FILE');
    expect(mod.ZONE_MSG.LOCALHOST).toContain('LOCALHOST');
    expect(mod.ZONE_MSG.WEB).toContain('NODE.JS ACCESS');
  });
});
