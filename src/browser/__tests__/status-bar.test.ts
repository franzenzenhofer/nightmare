import { describe, it, expect } from 'vitest';
import { getStatusBarState } from '../components/status-bar';

describe('getStatusBarState', () => {
  it('returns correct state for LOCAL zone', () => {
    const state = getStatusBarState(3, 'LOCAL');
    expect(state.zoneLabel).toBe('LOCAL');
    expect(state.zoneColor).toBe('green');
    expect(state.tabCount).toBe(3);
    expect(state.nodeEnabled).toBe(true);
  });

  it('returns correct state for LOCALHOST zone', () => {
    const state = getStatusBarState(1, 'LOCALHOST');
    expect(state.zoneLabel).toBe('LOCALHOST');
    expect(state.zoneColor).toBe('blue');
    expect(state.nodeEnabled).toBe(true);
  });

  it('returns correct state for WEB zone', () => {
    const state = getStatusBarState(5, 'WEB');
    expect(state.zoneLabel).toBe('WEB');
    expect(state.zoneColor).toBe('red');
    expect(state.nodeEnabled).toBe(false);
  });

  it('returns defaults when zone is undefined', () => {
    const state = getStatusBarState(0, undefined);
    expect(state.zoneLabel).toBe('');
    expect(state.zoneColor).toBe('green');
    expect(state.tabCount).toBe(0);
    expect(state.nodeEnabled).toBe(false);
  });

  it('reflects tab count accurately', () => {
    expect(getStatusBarState(42, 'WEB').tabCount).toBe(42);
    expect(getStatusBarState(0, 'LOCAL').tabCount).toBe(0);
    expect(getStatusBarState(1, 'LOCALHOST').tabCount).toBe(1);
  });
});
