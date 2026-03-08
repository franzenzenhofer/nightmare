import { describe, it, expect } from 'vitest';
import { parseCliArgs, createHeadlessConfig } from '../headless';

describe('parseCliArgs', () => {
  it('detects --headless flag', () => {
    const args = parseCliArgs(['node', 'nightmare', '--headless']);
    expect(args.headless).toBe(true);
  });

  it('defaults headless to false', () => {
    const args = parseCliArgs(['node', 'nightmare']);
    expect(args.headless).toBe(false);
  });

  it('parses --api-port', () => {
    const args = parseCliArgs(['node', 'nightmare', '--api-port', '7777']);
    expect(args.apiPort).toBe(7777);
  });

  it('defaults api port to 6660', () => {
    const args = parseCliArgs(['node', 'nightmare']);
    expect(args.apiPort).toBe(6660);
  });

  it('respects NIGHTMARE_API_PORT env var', () => {
    const args = parseCliArgs(['node', 'nightmare'], { NIGHTMARE_API_PORT: '8888' });
    expect(args.apiPort).toBe(8888);
  });

  it('cli flag overrides env var', () => {
    const args = parseCliArgs(['node', 'nightmare', '--api-port', '9999'], { NIGHTMARE_API_PORT: '8888' });
    expect(args.apiPort).toBe(9999);
  });

  it('handles --api-port as last arg without value', () => {
    const args = parseCliArgs(['node', 'nightmare', '--api-port']);
    expect(args.apiPort).toBe(6660);
  });
});

describe('createHeadlessConfig', () => {
  it('creates config for headless mode', () => {
    const config = createHeadlessConfig({ headless: true, apiPort: 6660 });
    expect(config.showWindow).toBe(false);
    expect(config.apiPort).toBe(6660);
    expect(config.startApi).toBe(true);
  });

  it('creates config for GUI mode', () => {
    const config = createHeadlessConfig({ headless: false, apiPort: 6660 });
    expect(config.showWindow).toBe(true);
    expect(config.apiPort).toBe(6660);
    expect(config.startApi).toBe(true);
  });
});
