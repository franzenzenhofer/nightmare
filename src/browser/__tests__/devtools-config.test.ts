import { describe, it, expect } from 'vitest';
import { DevToolsConfig, shouldAutoOpen } from '../services/devtools-config';

describe('DevToolsConfig', () => {
  it('auto-opens in dev mode', () => {
    const config: DevToolsConfig = { devMode: true, userOverride: null };
    expect(shouldAutoOpen(config)).toBe(true);
  });

  it('does not auto-open in production', () => {
    const config: DevToolsConfig = { devMode: false, userOverride: null };
    expect(shouldAutoOpen(config)).toBe(false);
  });

  it('respects user override to force open', () => {
    const config: DevToolsConfig = { devMode: false, userOverride: true };
    expect(shouldAutoOpen(config)).toBe(true);
  });

  it('respects user override to force close', () => {
    const config: DevToolsConfig = { devMode: true, userOverride: false };
    expect(shouldAutoOpen(config)).toBe(false);
  });
});
