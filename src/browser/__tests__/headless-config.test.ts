import { describe, it, expect } from 'vitest';
import { parseCliArgs, HeadlessConfig, getStartupJson } from '../services/headless-config';

describe('parseCliArgs', () => {
  it('returns default config with no args', () => {
    const config = parseCliArgs([]);
    expect(config.headless).toBe(false);
    expect(config.apiPort).toBe(6660);
    expect(config.devtools).toBe(false);
  });

  it('detects --headless flag', () => {
    const config = parseCliArgs(['--headless']);
    expect(config.headless).toBe(true);
  });

  it('detects --devtools flag', () => {
    const config = parseCliArgs(['--devtools']);
    expect(config.devtools).toBe(true);
  });

  it('parses --api-port with value', () => {
    const config = parseCliArgs(['--api-port', '8080']);
    expect(config.apiPort).toBe(8080);
  });

  it('parses --api-port=value format', () => {
    const config = parseCliArgs(['--api-port=9999']);
    expect(config.apiPort).toBe(9999);
  });

  it('uses NIGHTMARE_API_PORT env var as fallback', () => {
    const config = parseCliArgs([], { NIGHTMARE_API_PORT: '7777' });
    expect(config.apiPort).toBe(7777);
  });

  it('cli flag overrides env var', () => {
    const config = parseCliArgs(['--api-port', '5555'], { NIGHTMARE_API_PORT: '7777' });
    expect(config.apiPort).toBe(5555);
  });

  it('handles multiple flags', () => {
    const config = parseCliArgs(['--headless', '--devtools', '--api-port', '4444']);
    expect(config.headless).toBe(true);
    expect(config.devtools).toBe(true);
    expect(config.apiPort).toBe(4444);
  });

  it('ignores unknown flags', () => {
    const config = parseCliArgs(['--unknown', '--headless']);
    expect(config.headless).toBe(true);
  });
});

describe('getStartupJson', () => {
  it('produces valid JSON startup message', () => {
    const config: HeadlessConfig = { headless: true, apiPort: 6660, devtools: false };
    const json = getStartupJson(config);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed['ready']).toBe(true);
    expect(parsed['api']).toBe('http://localhost:6660');
    expect(parsed['headless']).toBe(true);
  });

  it('includes mcp endpoint', () => {
    const config: HeadlessConfig = { headless: false, apiPort: 8080, devtools: true };
    const json = getStartupJson(config);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    expect(parsed['mcp']).toBe('http://localhost:8080/mcp');
  });
});
