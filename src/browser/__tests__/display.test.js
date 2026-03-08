import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join, basename } from 'path';
import { Script, createContext } from 'vm';

function loadDisplay(apiPort, samplesDir, pagesDir) {
  const code = readFileSync(join(__dirname, '..', 'js', 'display.js'), 'utf8');
  const sandbox = {
    API_PORT: apiPort,
    samplesDir: samplesDir,
    pagesDir: pagesDir,
    path: { basename },
  };
  createContext(sandbox);
  const script = new Script(code);
  script.runInContext(sandbox);
  return sandbox;
}

describe('localFileUrl', () => {
  it('creates file URL with encoded path', () => {
    const mod = loadDisplay(6660, '/samples', '/pages');
    expect(mod.localFileUrl('/Users/foo/bar.html')).toBe(
      'http://127.0.0.1:6660/file/%2FUsers%2Ffoo%2Fbar.html'
    );
  });

  it('encodes special characters', () => {
    const mod = loadDisplay(6660, '/samples', '/pages');
    expect(mod.localFileUrl('/path with spaces/file.html')).toBe(
      'http://127.0.0.1:6660/file/%2Fpath%20with%20spaces%2Ffile.html'
    );
  });
});

describe('proxyUrl', () => {
  it('creates proxy URL with encoded target', () => {
    const mod = loadDisplay(6660, '/samples', '/pages');
    expect(mod.proxyUrl('https://example.com')).toBe(
      'http://127.0.0.1:6660/proxy/https%3A%2F%2Fexample.com'
    );
  });
});

describe('toDisplayUrl', () => {
  it('shows original URL for proxy URLs', () => {
    const mod = loadDisplay(6660, '/samples', '/pages');
    expect(mod.toDisplayUrl('http://127.0.0.1:6660/proxy/https%3A%2F%2Fexample.com')).toBe(
      'https://example.com'
    );
  });

  it('shows nightmare://name for samples dir files', () => {
    const mod = loadDisplay(6660, '/project/samples', '/src/pages');
    expect(mod.toDisplayUrl('http://127.0.0.1:6660/file/%2Fproject%2Fsamples%2Fhello.html')).toBe(
      'nightmare://home'
    );
  });

  it('shows nightmare://name for pages dir files', () => {
    const mod = loadDisplay(6660, '/project/samples', '/src/pages');
    expect(mod.toDisplayUrl('http://127.0.0.1:6660/file/%2Fsrc%2Fpages%2Fsettings.html')).toBe(
      'nightmare://settings'
    );
  });

  it('shows nightmare://path for arbitrary files', () => {
    const mod = loadDisplay(6660, '/project/samples', '/src/pages');
    expect(mod.toDisplayUrl('http://127.0.0.1:6660/file/%2FUsers%2Ffoo%2Fbar.html')).toBe(
      'nightmare:///Users/foo/bar.html'
    );
  });

  it('passes through external URLs unchanged', () => {
    const mod = loadDisplay(6660, '/samples', '/pages');
    expect(mod.toDisplayUrl('https://example.com')).toBe('https://example.com');
  });

  it('passes through localhost URLs unchanged', () => {
    const mod = loadDisplay(6660, '/samples', '/pages');
    expect(mod.toDisplayUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });
});

describe('serveMimeType', () => {
  it('returns correct MIME for HTML', () => {
    const mod = loadDisplay(6660, '/s', '/p');
    expect(mod.serveMimeType('.html')).toBe('text/html');
    expect(mod.serveMimeType('.htm')).toBe('text/html');
  });

  it('returns correct MIME for CSS', () => {
    const mod = loadDisplay(6660, '/s', '/p');
    expect(mod.serveMimeType('.css')).toBe('text/css');
  });

  it('returns correct MIME for JavaScript', () => {
    const mod = loadDisplay(6660, '/s', '/p');
    expect(mod.serveMimeType('.js')).toBe('application/javascript');
  });

  it('returns correct MIME for JSON', () => {
    const mod = loadDisplay(6660, '/s', '/p');
    expect(mod.serveMimeType('.json')).toBe('application/json');
  });

  it('returns correct MIME for images', () => {
    const mod = loadDisplay(6660, '/s', '/p');
    expect(mod.serveMimeType('.png')).toBe('image/png');
    expect(mod.serveMimeType('.jpg')).toBe('image/jpeg');
    expect(mod.serveMimeType('.jpeg')).toBe('image/jpeg');
    expect(mod.serveMimeType('.gif')).toBe('image/gif');
    expect(mod.serveMimeType('.svg')).toBe('image/svg+xml');
    expect(mod.serveMimeType('.ico')).toBe('image/x-icon');
  });

  it('returns correct MIME for fonts', () => {
    const mod = loadDisplay(6660, '/s', '/p');
    expect(mod.serveMimeType('.woff')).toBe('font/woff');
    expect(mod.serveMimeType('.woff2')).toBe('font/woff2');
    expect(mod.serveMimeType('.ttf')).toBe('font/ttf');
  });

  it('returns correct MIME for media', () => {
    const mod = loadDisplay(6660, '/s', '/p');
    expect(mod.serveMimeType('.mp3')).toBe('audio/mpeg');
    expect(mod.serveMimeType('.mp4')).toBe('video/mp4');
  });

  it('returns octet-stream for unknown extensions', () => {
    const mod = loadDisplay(6660, '/s', '/p');
    expect(mod.serveMimeType('.xyz')).toBe('application/octet-stream');
    expect(mod.serveMimeType('.unknown')).toBe('application/octet-stream');
  });
});

describe('tabToJson', () => {
  it('returns tab data with displayUrl', () => {
    const mod = loadDisplay(6660, '/project/samples', '/src/pages');
    const tab = {
      id: 'tab-1',
      url: 'http://127.0.0.1:6660/file/%2Fproject%2Fsamples%2Fhello.html',
      title: 'Home',
      zone: 'LOCAL',
    };
    const json = mod.tabToJson(tab);
    expect(json.id).toBe('tab-1');
    expect(json.displayUrl).toBe('nightmare://home');
    expect(json.title).toBe('Home');
    expect(json.zone).toBe('LOCAL');
  });
});
