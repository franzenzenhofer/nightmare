import { describe, it, expect } from 'vitest';
import { resolveUrl } from '../services/navigation';

describe('resolveUrl', () => {
  it('converts port number to localhost URL', () => {
    expect(resolveUrl('3000')).toBe('http://localhost:3000');
  });

  it('converts 5-digit port to localhost URL', () => {
    expect(resolveUrl('8080')).toBe('http://localhost:8080');
  });

  it('converts 2-digit port to localhost URL', () => {
    expect(resolveUrl('80')).toBe('http://localhost:80');
  });

  it('does not convert single digit as port', () => {
    expect(resolveUrl('5')).not.toContain('localhost');
  });

  it('does not convert 6+ digits as port', () => {
    expect(resolveUrl('123456')).not.toContain('localhost');
  });

  it('adds https:// to domain-like input', () => {
    expect(resolveUrl('google.com')).toBe('https://google.com');
  });

  it('adds https:// to subdomain input', () => {
    expect(resolveUrl('docs.google.com')).toBe('https://docs.google.com');
  });

  it('keeps https:// URLs as-is', () => {
    expect(resolveUrl('https://example.com')).toBe('https://example.com');
  });

  it('keeps http:// URLs as-is', () => {
    expect(resolveUrl('http://example.com')).toBe('http://example.com');
  });

  it('keeps file:// URLs as-is', () => {
    expect(resolveUrl('file:///app/index.html')).toBe('file:///app/index.html');
  });

  it('converts nightmare://newtab to internal page path', () => {
    const result = resolveUrl('nightmare://newtab');
    expect(result).toContain('newtab.html');
    expect(result).toMatch(/^file:\/\//);
  });

  it('converts nightmare://settings to internal page path', () => {
    const result = resolveUrl('nightmare://settings');
    expect(result).toContain('settings.html');
  });

  it('converts search queries to google search', () => {
    const result = resolveUrl('how to cook pasta');
    expect(result).toContain('google.com/search?q=');
    expect(result).toContain('how%20to%20cook%20pasta');
  });

  it('converts absolute path to file:// URL', () => {
    const result = resolveUrl('/home/user/app.html');
    expect(result).toBe('file:///home/user/app.html');
  });

  it('converts relative path to file:// URL', () => {
    const result = resolveUrl('./app/index.html');
    expect(result).toMatch(/^file:\/\//);
    expect(result).toContain('app/index.html');
  });

  it('converts ~ path to file:// URL with home dir', () => {
    const result = resolveUrl('~/docs/app.html');
    expect(result).toMatch(/^file:\/\//);
    expect(result).toContain('docs/app.html');
    expect(result).not.toContain('~');
  });

  it('handles empty string as search', () => {
    const result = resolveUrl('');
    expect(result).toBe('nightmare://newtab');
  });
});
