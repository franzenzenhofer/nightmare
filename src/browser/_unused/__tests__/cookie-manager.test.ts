import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CookieManager } from '../services/cookie-manager';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let tempDir: string;
let cm: CookieManager;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'nightmare-cookies-'));
  cm = new CookieManager(tempDir);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('CookieManager', () => {
  describe('set', () => {
    it('creates a cookie with required fields', () => {
      const cookie = cm.set({
        name: 'session',
        value: 'abc123',
        domain: 'example.com',
      });
      expect(cookie.name).toBe('session');
      expect(cookie.value).toBe('abc123');
      expect(cookie.domain).toBe('example.com');
      expect(cookie.path).toBe('/');
      expect(cookie.httpOnly).toBe(false);
      expect(cookie.secure).toBe(false);
      expect(cookie.expires).toBeNull();
    });

    it('creates a cookie with all optional fields', () => {
      const expires = Date.now() + 86400000;
      const cookie = cm.set({
        name: 'token',
        value: 'xyz',
        domain: 'api.example.com',
        path: '/v1',
        expires,
        httpOnly: true,
        secure: true,
      });
      expect(cookie.path).toBe('/v1');
      expect(cookie.expires).toBe(expires);
      expect(cookie.httpOnly).toBe(true);
      expect(cookie.secure).toBe(true);
    });

    it('overwrites cookie with same name and domain', () => {
      cm.set({ name: 'a', value: 'old', domain: 'x.com' });
      cm.set({ name: 'a', value: 'new', domain: 'x.com' });
      const cookies = cm.getByDomain('x.com');
      expect(cookies).toHaveLength(1);
      expect(cookies[0]?.value).toBe('new');
    });

    it('keeps cookies separate across domains', () => {
      cm.set({ name: 'a', value: '1', domain: 'x.com' });
      cm.set({ name: 'a', value: '2', domain: 'y.com' });
      expect(cm.getByDomain('x.com')).toHaveLength(1);
      expect(cm.getByDomain('y.com')).toHaveLength(1);
    });

    it('overwrites only when name, domain, and path all match', () => {
      cm.set({ name: 'a', value: '1', domain: 'x.com', path: '/' });
      cm.set({ name: 'a', value: '2', domain: 'x.com', path: '/api' });
      expect(cm.getByDomain('x.com')).toHaveLength(2);
    });
  });

  describe('get', () => {
    it('returns a cookie by name and domain', () => {
      cm.set({ name: 'token', value: 'abc', domain: 'site.com' });
      const cookie = cm.get('token', 'site.com');
      expect(cookie).not.toBeNull();
      expect(cookie?.value).toBe('abc');
    });

    it('returns null for non-existent cookie', () => {
      expect(cm.get('nope', 'site.com')).toBeNull();
    });

    it('returns null for wrong domain', () => {
      cm.set({ name: 'token', value: 'abc', domain: 'site.com' });
      expect(cm.get('token', 'other.com')).toBeNull();
    });
  });

  describe('delete', () => {
    it('removes a cookie by name and domain', () => {
      cm.set({ name: 'session', value: 'x', domain: 'a.com' });
      cm.delete('session', 'a.com');
      expect(cm.get('session', 'a.com')).toBeNull();
    });

    it('does not affect other domains', () => {
      cm.set({ name: 'session', value: 'x', domain: 'a.com' });
      cm.set({ name: 'session', value: 'y', domain: 'b.com' });
      cm.delete('session', 'a.com');
      expect(cm.get('session', 'b.com')).not.toBeNull();
    });

    it('does nothing for non-existent cookie', () => {
      cm.set({ name: 'a', value: 'x', domain: 'a.com' });
      cm.delete('nonexistent', 'a.com');
      expect(cm.getByDomain('a.com')).toHaveLength(1);
    });
  });

  describe('getByDomain', () => {
    it('returns all cookies for a domain', () => {
      cm.set({ name: 'a', value: '1', domain: 'site.com' });
      cm.set({ name: 'b', value: '2', domain: 'site.com' });
      cm.set({ name: 'c', value: '3', domain: 'other.com' });
      const cookies = cm.getByDomain('site.com');
      expect(cookies).toHaveLength(2);
    });

    it('returns empty array for unknown domain', () => {
      expect(cm.getByDomain('unknown.com')).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('removes all cookies from all domains', () => {
      cm.set({ name: 'a', value: '1', domain: 'x.com' });
      cm.set({ name: 'b', value: '2', domain: 'y.com' });
      cm.clearAll();
      expect(cm.getByDomain('x.com')).toHaveLength(0);
      expect(cm.getByDomain('y.com')).toHaveLength(0);
    });
  });

  describe('clearDomain', () => {
    it('removes all cookies for a specific domain', () => {
      cm.set({ name: 'a', value: '1', domain: 'x.com' });
      cm.set({ name: 'b', value: '2', domain: 'x.com' });
      cm.set({ name: 'c', value: '3', domain: 'y.com' });
      cm.clearDomain('x.com');
      expect(cm.getByDomain('x.com')).toHaveLength(0);
      expect(cm.getByDomain('y.com')).toHaveLength(1);
    });
  });

  describe('searchByName', () => {
    it('finds cookies matching a name pattern', () => {
      cm.set({ name: 'session_token', value: '1', domain: 'a.com' });
      cm.set({ name: 'csrf_token', value: '2', domain: 'b.com' });
      cm.set({ name: 'user_id', value: '3', domain: 'c.com' });
      const results = cm.searchByName('token');
      expect(results).toHaveLength(2);
    });

    it('is case-insensitive', () => {
      cm.set({ name: 'SessionID', value: '1', domain: 'a.com' });
      const results = cm.searchByName('sessionid');
      expect(results).toHaveLength(1);
    });

    it('returns empty for no match', () => {
      cm.set({ name: 'a', value: '1', domain: 'x.com' });
      expect(cm.searchByName('zzzzz')).toHaveLength(0);
    });
  });

  describe('getAllDomains', () => {
    it('returns all domains that have cookies', () => {
      cm.set({ name: 'a', value: '1', domain: 'x.com' });
      cm.set({ name: 'b', value: '2', domain: 'y.com' });
      cm.set({ name: 'c', value: '3', domain: 'x.com' });
      const domains = cm.getAllDomains();
      expect(domains).toHaveLength(2);
      expect(domains).toContain('x.com');
      expect(domains).toContain('y.com');
    });

    it('returns empty when no cookies exist', () => {
      expect(cm.getAllDomains()).toHaveLength(0);
    });
  });

  describe('persistence', () => {
    it('persists cookies across instances', () => {
      cm.set({ name: 'persist', value: 'yes', domain: 'p.com' });
      const cm2 = new CookieManager(tempDir);
      const cookie = cm2.get('persist', 'p.com');
      expect(cookie).not.toBeNull();
      expect(cookie?.value).toBe('yes');
    });
  });
});
