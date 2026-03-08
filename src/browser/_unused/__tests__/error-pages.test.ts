import { describe, it, expect } from 'vitest';
import {
  getErrorPageHtml,
  ERROR_TYPES,
  type ErrorType,
} from '../services/error-pages';

describe('getErrorPageHtml', () => {
  it('generates HTML for connection-failed', () => {
    const html = getErrorPageHtml('connection-failed', 'https://example.com');
    expect(html).toContain('Connection Failed');
    expect(html).toContain('https://example.com');
    expect(html).toContain('<html');
  });

  it('generates HTML for not-found', () => {
    const html = getErrorPageHtml('not-found', 'https://missing.com');
    expect(html).toContain('Not Found');
    expect(html).toContain('https://missing.com');
  });

  it('generates HTML for ssl-error', () => {
    const html = getErrorPageHtml('ssl-error', 'https://expired.com');
    expect(html).toContain('Security Error');
    expect(html).toContain('https://expired.com');
  });

  it('generates HTML for timeout', () => {
    const html = getErrorPageHtml('timeout', 'https://slow.com');
    expect(html).toContain('Timed Out');
  });

  it('generates HTML for dns-failed', () => {
    const html = getErrorPageHtml('dns-failed', 'https://nohost.xyz');
    expect(html).toContain('DNS');
    expect(html).toContain('https://nohost.xyz');
  });

  it('generates HTML for crash', () => {
    const html = getErrorPageHtml('crash', 'https://broken.com');
    expect(html).toContain('Crashed');
  });

  it('escapes HTML in URLs', () => {
    const html = getErrorPageHtml('not-found', 'https://evil.com/<script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('includes nightmare branding', () => {
    const html = getErrorPageHtml('connection-failed', 'https://x.com');
    expect(html).toContain('Nightmare');
  });
});

describe('ERROR_TYPES', () => {
  it('has all 6 error types', () => {
    const types: ErrorType[] = [
      'connection-failed', 'not-found', 'ssl-error', 'timeout', 'dns-failed', 'crash',
    ];
    expect(ERROR_TYPES).toHaveLength(6);
    for (const t of types) {
      expect(ERROR_TYPES).toContain(t);
    }
  });
});
