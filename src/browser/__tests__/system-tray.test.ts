import { describe, it, expect, beforeEach } from 'vitest';
import { SystemTrayLogic } from '../components/system-tray';

let tray: SystemTrayLogic;

beforeEach(() => {
  tray = new SystemTrayLogic();
});

describe('SystemTrayLogic', () => {
  it('starts in idle state', () => {
    expect(tray.getState()).toBe('idle');
  });

  it('transitions to active state', () => {
    tray.setLoading();
    expect(tray.getState()).toBe('active');
  });

  it('transitions to error state', () => {
    tray.setError();
    expect(tray.getState()).toBe('error');
  });

  it('returns to idle state', () => {
    tray.setLoading();
    tray.setIdle();
    expect(tray.getState()).toBe('idle');
  });

  it('returns correct icon name for idle', () => {
    expect(tray.getIconName()).toBe('tray-idle');
  });

  it('returns correct icon name for active', () => {
    tray.setLoading();
    expect(tray.getIconName()).toBe('tray-active');
  });

  it('returns correct icon name for error', () => {
    tray.setError();
    expect(tray.getIconName()).toBe('tray-error');
  });

  it('generates tray menu items', () => {
    const items = tray.getMenuItems(3);
    expect(items.length).toBeGreaterThan(0);
    const labels = items.map((i) => i.label);
    expect(labels).toContain('Show Nightmare');
    expect(labels).toContain('Quit');
  });

  it('includes tab count in menu', () => {
    const items = tray.getMenuItems(5);
    const tabItem = items.find((i) => i.label.includes('5'));
    expect(tabItem).toBeDefined();
  });
});
