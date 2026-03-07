import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityBannerLogic } from '../components/security-banner';
import type { BannerConfig } from '../services/security-zones';

let banner: SecurityBannerLogic;

beforeEach(() => {
  banner = new SecurityBannerLogic();
});

describe('SecurityBannerLogic', () => {
  it('shows banner for LOCAL zone', () => {
    const config = banner.getBannerState('tab1', 'LOCAL');
    expect(config).not.toBeNull();
    expect(config?.color).toBe('green');
  });

  it('shows banner for LOCALHOST zone', () => {
    const config = banner.getBannerState('tab1', 'LOCALHOST');
    expect(config?.color).toBe('blue');
  });

  it('shows banner for WEB zone', () => {
    const config = banner.getBannerState('tab1', 'WEB');
    expect(config?.color).toBe('red');
    expect(config?.dismissable).toBe(false);
  });

  it('LOCAL banner is dismissable', () => {
    const config = banner.getBannerState('tab1', 'LOCAL');
    expect(config?.dismissable).toBe(true);
  });

  it('dismisses LOCAL banner', () => {
    banner.dismiss('tab1');
    const config = banner.getBannerState('tab1', 'LOCAL');
    expect(config).toBeNull();
  });

  it('dismisses LOCALHOST banner', () => {
    banner.dismiss('tab1');
    const config = banner.getBannerState('tab1', 'LOCALHOST');
    expect(config).toBeNull();
  });

  it('WEB banner is NEVER dismissable', () => {
    banner.dismiss('tab1');
    const config = banner.getBannerState('tab1', 'WEB');
    expect(config).not.toBeNull();
    expect(config?.dismissable).toBe(false);
  });

  it('dismiss is per-tab', () => {
    banner.dismiss('tab1');
    expect(banner.getBannerState('tab1', 'LOCAL')).toBeNull();
    expect(banner.getBannerState('tab2', 'LOCAL')).not.toBeNull();
  });

  it('reset clears dismiss state for a tab', () => {
    banner.dismiss('tab1');
    banner.reset('tab1');
    expect(banner.getBannerState('tab1', 'LOCAL')).not.toBeNull();
  });
});
