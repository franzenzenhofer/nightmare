import { describe, it, expect } from 'vitest';
import { SecurityZones } from '../services/security-zones';

const zones = new SecurityZones();

describe('SecurityZones', () => {
  describe('classify', () => {
    // LOCAL zone
    it('classifies file:// as LOCAL', () => {
      expect(zones.classify('file:///home/user/app/index.html')).toBe('LOCAL');
    });

    it('classifies file:// Windows path as LOCAL', () => {
      expect(zones.classify('file:///C:/Users/app/index.html')).toBe('LOCAL');
    });

    it('classifies nightmare:// as LOCAL', () => {
      expect(zones.classify('nightmare://newtab')).toBe('LOCAL');
    });

    it('classifies nightmare://settings as LOCAL', () => {
      expect(zones.classify('nightmare://settings')).toBe('LOCAL');
    });

    it('classifies nightmare://about as LOCAL', () => {
      expect(zones.classify('nightmare://about')).toBe('LOCAL');
    });

    // LOCALHOST zone
    it('classifies http://localhost as LOCALHOST', () => {
      expect(zones.classify('http://localhost:3000')).toBe('LOCALHOST');
    });

    it('classifies http://localhost without port as LOCALHOST', () => {
      expect(zones.classify('http://localhost')).toBe('LOCALHOST');
    });

    it('classifies 127.0.0.1 as LOCALHOST', () => {
      expect(zones.classify('http://127.0.0.1:8080/api')).toBe('LOCALHOST');
    });

    it('classifies 0.0.0.0 as LOCALHOST', () => {
      expect(zones.classify('http://0.0.0.0:5000')).toBe('LOCALHOST');
    });

    it('classifies [::1] as LOCALHOST', () => {
      expect(zones.classify('http://[::1]:3000')).toBe('LOCALHOST');
    });

    it('classifies subdomain.localhost as LOCALHOST', () => {
      expect(zones.classify('http://myapp.localhost:3000')).toBe('LOCALHOST');
    });

    it('classifies 192.168.x.x as LOCALHOST', () => {
      expect(zones.classify('http://192.168.1.100:8080')).toBe('LOCALHOST');
    });

    it('classifies 192.168.0.1 as LOCALHOST', () => {
      expect(zones.classify('http://192.168.0.1')).toBe('LOCALHOST');
    });

    it('classifies 10.x.x.x as LOCALHOST', () => {
      expect(zones.classify('http://10.0.0.5:3000')).toBe('LOCALHOST');
    });

    it('classifies 10.255.255.255 as LOCALHOST', () => {
      expect(zones.classify('http://10.255.255.255')).toBe('LOCALHOST');
    });

    it('classifies 172.16.x.x as LOCALHOST', () => {
      expect(zones.classify('http://172.16.0.1:8080')).toBe('LOCALHOST');
    });

    it('classifies 172.31.255.255 as LOCALHOST', () => {
      expect(zones.classify('http://172.31.255.255')).toBe('LOCALHOST');
    });

    it('classifies https://localhost as LOCALHOST', () => {
      expect(zones.classify('https://localhost:8443')).toBe('LOCALHOST');
    });

    // WEB zone
    it('classifies https://google.com as WEB', () => {
      expect(zones.classify('https://google.com')).toBe('WEB');
    });

    it('classifies http://example.com as WEB', () => {
      expect(zones.classify('http://example.com')).toBe('WEB');
    });

    it('classifies https://192.169.0.1 as WEB (non-private IP)', () => {
      expect(zones.classify('https://192.169.0.1')).toBe('WEB');
    });

    it('classifies https://172.32.0.1 as WEB (outside private range)', () => {
      expect(zones.classify('https://172.32.0.1')).toBe('WEB');
    });

    it('classifies https://172.15.0.1 as WEB (below private range)', () => {
      expect(zones.classify('https://172.15.0.1')).toBe('WEB');
    });

    it('classifies https://11.0.0.1 as WEB (not 10.x.x.x)', () => {
      expect(zones.classify('https://11.0.0.1')).toBe('WEB');
    });

    it('classifies http://my-server.com as WEB', () => {
      expect(zones.classify('http://my-server.com:3000')).toBe('WEB');
    });

    // Edge cases
    it('classifies malformed URL as LOCAL (safe fallback)', () => {
      expect(zones.classify('not-a-url')).toBe('LOCAL');
    });

    it('classifies bare path as LOCAL', () => {
      expect(zones.classify('/home/user/app.html')).toBe('LOCAL');
    });

    it('classifies empty string as LOCAL', () => {
      expect(zones.classify('')).toBe('LOCAL');
    });

    it('classifies about:blank as LOCAL', () => {
      expect(zones.classify('about:blank')).toBe('LOCAL');
    });
  });

  describe('getBanner', () => {
    it('returns red dismissable banner for LOCAL', () => {
      const banner = zones.getBanner('LOCAL');
      expect(banner.color).toBe('red');
      expect(banner.dismissable).toBe(true);
      expect(banner.type).toBe('info');
    });

    it('returns red dismissable banner for LOCALHOST', () => {
      const banner = zones.getBanner('LOCALHOST');
      expect(banner.color).toBe('red');
      expect(banner.dismissable).toBe(true);
      expect(banner.type).toBe('info');
    });

    it('returns red non-dismissable banner for WEB', () => {
      const banner = zones.getBanner('WEB');
      expect(banner.color).toBe('red');
      expect(banner.dismissable).toBe(false);
      expect(banner.type).toBe('warning');
    });

    it('WEB banner message mentions security disabled', () => {
      const banner = zones.getBanner('WEB');
      expect(banner.message).toContain('security disabled');
    });

    it('LOCAL banner has icon', () => {
      const banner = zones.getBanner('LOCAL');
      expect(banner.icon.length).toBeGreaterThan(0);
    });

    it('LOCALHOST banner has icon', () => {
      const banner = zones.getBanner('LOCALHOST');
      expect(banner.icon.length).toBeGreaterThan(0);
    });

    it('WEB banner has icon', () => {
      const banner = zones.getBanner('WEB');
      expect(banner.icon.length).toBeGreaterThan(0);
    });
  });

  describe('shouldEnableNode', () => {
    it('enables Node for LOCAL', () => {
      expect(zones.shouldEnableNode('LOCAL')).toBe(true);
    });

    it('enables Node for LOCALHOST', () => {
      expect(zones.shouldEnableNode('LOCALHOST')).toBe(true);
    });

    it('disables Node for WEB', () => {
      expect(zones.shouldEnableNode('WEB')).toBe(false);
    });
  });
});
