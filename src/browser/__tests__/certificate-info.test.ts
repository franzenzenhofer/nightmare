import { describe, it, expect, beforeEach } from 'vitest';
import { CertificateStore } from '../services/certificate-info';

describe('CertificateStore', () => {
  let store: CertificateStore;

  beforeEach(() => {
    store = new CertificateStore();
  });

  describe('setCertificate', () => {
    it('stores certificate info for a tab', () => {
      store.setCertificate('tab-1', {
        subject: 'example.com',
        issuer: "Let's Encrypt Authority X3",
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        protocol: 'TLS 1.3',
        keyExchange: 'X25519',
        cipher: 'AES_256_GCM',
        isValid: true,
      });
      const cert = store.getCertificate('tab-1');
      expect(cert?.subject).toBe('example.com');
      expect(cert?.isValid).toBe(true);
    });
  });

  describe('getCertificate', () => {
    it('returns undefined for unknown tab', () => {
      expect(store.getCertificate('unknown')).toBeUndefined();
    });
  });

  describe('removeCertificate', () => {
    it('removes stored cert for tab', () => {
      store.setCertificate('tab-1', {
        subject: 'example.com',
        issuer: 'CA',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        protocol: 'TLS 1.3',
        keyExchange: 'X25519',
        cipher: 'AES_256_GCM',
        isValid: true,
      });
      store.removeCertificate('tab-1');
      expect(store.getCertificate('tab-1')).toBeUndefined();
    });
  });

  describe('isSecure', () => {
    it('returns true for valid cert', () => {
      store.setCertificate('tab-1', {
        subject: 'example.com',
        issuer: 'CA',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        protocol: 'TLS 1.3',
        keyExchange: 'X25519',
        cipher: 'AES_256_GCM',
        isValid: true,
      });
      expect(store.isSecure('tab-1')).toBe(true);
    });

    it('returns false for invalid cert', () => {
      store.setCertificate('tab-1', {
        subject: 'example.com',
        issuer: 'CA',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        protocol: 'TLS 1.2',
        keyExchange: 'RSA',
        cipher: 'AES_128_CBC',
        isValid: false,
      });
      expect(store.isSecure('tab-1')).toBe(false);
    });

    it('returns false for no cert', () => {
      expect(store.isSecure('tab-1')).toBe(false);
    });
  });

  describe('getSecurityLevel', () => {
    it('returns secure for valid TLS 1.3', () => {
      store.setCertificate('tab-1', {
        subject: 'e.com',
        issuer: 'CA',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        protocol: 'TLS 1.3',
        keyExchange: 'X25519',
        cipher: 'AES_256_GCM',
        isValid: true,
      });
      expect(store.getSecurityLevel('tab-1')).toBe('secure');
    });

    it('returns warning for TLS 1.2', () => {
      store.setCertificate('tab-1', {
        subject: 'e.com',
        issuer: 'CA',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        protocol: 'TLS 1.2',
        keyExchange: 'RSA',
        cipher: 'AES_128_CBC',
        isValid: true,
      });
      expect(store.getSecurityLevel('tab-1')).toBe('warning');
    });

    it('returns insecure for invalid cert', () => {
      store.setCertificate('tab-1', {
        subject: 'e.com',
        issuer: 'CA',
        validFrom: '2024-01-01',
        validTo: '2025-01-01',
        protocol: 'TLS 1.2',
        keyExchange: 'RSA',
        cipher: 'AES_128_CBC',
        isValid: false,
      });
      expect(store.getSecurityLevel('tab-1')).toBe('insecure');
    });

    it('returns none for no cert', () => {
      expect(store.getSecurityLevel('tab-1')).toBe('none');
    });
  });

  describe('clearAll', () => {
    it('removes all certificates', () => {
      store.setCertificate('tab-1', {
        subject: 'a.com', issuer: 'CA', validFrom: '2024-01-01',
        validTo: '2025-01-01', protocol: 'TLS 1.3', keyExchange: 'X25519',
        cipher: 'AES_256_GCM', isValid: true,
      });
      store.setCertificate('tab-2', {
        subject: 'b.com', issuer: 'CA', validFrom: '2024-01-01',
        validTo: '2025-01-01', protocol: 'TLS 1.3', keyExchange: 'X25519',
        cipher: 'AES_256_GCM', isValid: true,
      });
      store.clearAll();
      expect(store.getCertificate('tab-1')).toBeUndefined();
      expect(store.getCertificate('tab-2')).toBeUndefined();
    });
  });
});
