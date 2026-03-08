import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, resolve, basename } from 'path';
import { homedir } from 'os';
import { Script, createContext } from 'vm';

function loadNavigation() {
  // Load display.js first (resolveUrl depends on localFileUrl, proxyUrl)
  const displayCode = readFileSync(join(__dirname, '..', 'js', 'display.js'), 'utf8');
  const navCode = readFileSync(join(__dirname, '..', 'js', 'navigation.js'), 'utf8');

  const sandbox = {
    API_PORT: 6660,
    samplesDir: join(__dirname, '..', '..', '..', 'samples'),
    pagesDir: join(__dirname, '..', '..', 'pages'),
    HOME_URL: 'nightmare://home',
    path: { join, resolve, basename },
    fs: { existsSync },
    os: { homedir },
    URL: globalThis.URL,
    encodeURIComponent: globalThis.encodeURIComponent,
    decodeURIComponent: globalThis.decodeURIComponent,
  };
  createContext(sandbox);
  new Script(displayCode).runInContext(sandbox);
  new Script(navCode).runInContext(sandbox);
  return sandbox;
}

describe('resolveUrl', () => {
  const mod = loadNavigation();
  const { resolveUrl } = mod;

  it('resolves empty input to home URL', () => {
    const result = resolveUrl('');
    expect(result).toContain('/file/');
    expect(result).toContain('hello.html');
  });

  it('resolves null to home URL', () => {
    const result = resolveUrl(null);
    expect(result).toContain('/file/');
  });

  it('resolves nightmare://home to samples/hello.html', () => {
    const result = resolveUrl('nightmare://home');
    expect(result).toContain('/file/');
    expect(result).toContain('hello.html');
  });

  it('resolves nightmare://about to pages/about.html', () => {
    const result = resolveUrl('nightmare://about');
    expect(result).toContain('/file/');
    expect(result).toContain('about.html');
  });

  it('resolves nightmare:///absolute/path to file URL', () => {
    const result = resolveUrl('nightmare:///Users/foo/bar.html');
    expect(result).toBe('http://127.0.0.1:6660/file/%2FUsers%2Ffoo%2Fbar.html');
  });

  it('passes through file:// URLs', () => {
    expect(resolveUrl('file:///tmp/test.html')).toBe('file:///tmp/test.html');
  });

  it('proxies external http URLs', () => {
    const result = resolveUrl('https://example.com');
    expect(result).toContain('/proxy/');
    expect(result).toContain('example.com');
  });

  it('does not proxy localhost URLs', () => {
    expect(resolveUrl('http://localhost:3000')).toBe('http://localhost:3000');
    expect(resolveUrl('http://127.0.0.1:8080')).toBe('http://127.0.0.1:8080');
  });

  it('does not proxy private IP URLs', () => {
    expect(resolveUrl('http://192.168.1.100:80')).toBe('http://192.168.1.100:80');
    expect(resolveUrl('http://10.0.0.1:80')).toBe('http://10.0.0.1:80');
  });

  it('resolves bare port numbers to localhost', () => {
    expect(resolveUrl('3000')).toBe('http://localhost:3000');
    expect(resolveUrl('8080')).toBe('http://localhost:8080');
  });

  it('resolves absolute file paths', () => {
    const result = resolveUrl('/tmp/test.html');
    expect(result).toContain('/file/');
    expect(result).toContain('test.html');
  });

  it('resolves domain-like strings via proxy', () => {
    const result = resolveUrl('example.com');
    expect(result).toContain('/proxy/');
    expect(result).toContain('https');
    expect(result).toContain('example.com');
  });

  it('resolves search queries via Google', () => {
    const result = resolveUrl('what is javascript');
    expect(result).toContain('/proxy/');
    expect(result).toContain('google.com');
    expect(result).toContain('search');
    expect(result).toContain('what');
  });
});
