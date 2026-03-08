import { describe, it, expect } from 'vitest';
import { getMimeType, decodeFilePath } from '../services/file-server';

describe('getMimeType', () => {
  it('returns text/html for .html', () => {
    expect(getMimeType('.html')).toBe('text/html');
  });

  it('returns text/html for .htm', () => {
    expect(getMimeType('.htm')).toBe('text/html');
  });

  it('returns text/css for .css', () => {
    expect(getMimeType('.css')).toBe('text/css');
  });

  it('returns application/javascript for .js', () => {
    expect(getMimeType('.js')).toBe('application/javascript');
  });

  it('returns application/json for .json', () => {
    expect(getMimeType('.json')).toBe('application/json');
  });

  it('returns image/png for .png', () => {
    expect(getMimeType('.png')).toBe('image/png');
  });

  it('returns image/jpeg for .jpg', () => {
    expect(getMimeType('.jpg')).toBe('image/jpeg');
  });

  it('returns image/jpeg for .jpeg', () => {
    expect(getMimeType('.jpeg')).toBe('image/jpeg');
  });

  it('returns image/gif for .gif', () => {
    expect(getMimeType('.gif')).toBe('image/gif');
  });

  it('returns image/svg+xml for .svg', () => {
    expect(getMimeType('.svg')).toBe('image/svg+xml');
  });

  it('returns image/x-icon for .ico', () => {
    expect(getMimeType('.ico')).toBe('image/x-icon');
  });

  it('returns font/woff for .woff', () => {
    expect(getMimeType('.woff')).toBe('font/woff');
  });

  it('returns font/woff2 for .woff2', () => {
    expect(getMimeType('.woff2')).toBe('font/woff2');
  });

  it('returns font/ttf for .ttf', () => {
    expect(getMimeType('.ttf')).toBe('font/ttf');
  });

  it('returns audio/mpeg for .mp3', () => {
    expect(getMimeType('.mp3')).toBe('audio/mpeg');
  });

  it('returns video/mp4 for .mp4', () => {
    expect(getMimeType('.mp4')).toBe('video/mp4');
  });

  it('returns application/wasm for .wasm', () => {
    expect(getMimeType('.wasm')).toBe('application/wasm');
  });

  it('returns application/xml for .xml', () => {
    expect(getMimeType('.xml')).toBe('application/xml');
  });

  it('returns text/plain for .txt', () => {
    expect(getMimeType('.txt')).toBe('text/plain');
  });

  it('returns text/plain for .md', () => {
    expect(getMimeType('.md')).toBe('text/plain');
  });

  it('returns text/plain for .ts', () => {
    expect(getMimeType('.ts')).toBe('text/plain');
  });

  it('returns text/plain for .tsx', () => {
    expect(getMimeType('.tsx')).toBe('text/plain');
  });

  it('returns application/octet-stream for unknown extension', () => {
    expect(getMimeType('.xyz')).toBe('application/octet-stream');
  });

  it('returns application/octet-stream for empty extension', () => {
    expect(getMimeType('')).toBe('application/octet-stream');
  });
});

describe('local file types can be served', () => {
  it('serves markdown files with text/plain', () => {
    expect(getMimeType('.md')).toBe('text/plain');
  });

  it('serves local PNG images', () => {
    expect(getMimeType('.png')).toBe('image/png');
  });

  it('serves local JPG images', () => {
    expect(getMimeType('.jpg')).toBe('image/jpeg');
  });

  it('serves local GIF images', () => {
    expect(getMimeType('.gif')).toBe('image/gif');
  });

  it('serves local SVG images', () => {
    expect(getMimeType('.svg')).toBe('image/svg+xml');
  });

  it('serves local ICO favicons', () => {
    expect(getMimeType('.ico')).toBe('image/x-icon');
  });

  it('serves local HTML files', () => {
    expect(getMimeType('.html')).toBe('text/html');
  });

  it('serves local CSS stylesheets', () => {
    expect(getMimeType('.css')).toBe('text/css');
  });

  it('serves local JavaScript files', () => {
    expect(getMimeType('.js')).toBe('application/javascript');
  });

  it('serves local JSON data files', () => {
    expect(getMimeType('.json')).toBe('application/json');
  });

  it('serves local plain text files', () => {
    expect(getMimeType('.txt')).toBe('text/plain');
  });

  it('serves local TypeScript source files', () => {
    expect(getMimeType('.ts')).toBe('text/plain');
  });

  it('serves local video files', () => {
    expect(getMimeType('.mp4')).toBe('video/mp4');
  });

  it('serves local audio files', () => {
    expect(getMimeType('.mp3')).toBe('audio/mpeg');
  });

  it('serves local font files (woff2)', () => {
    expect(getMimeType('.woff2')).toBe('font/woff2');
  });

  it('serves local WebAssembly modules', () => {
    expect(getMimeType('.wasm')).toBe('application/wasm');
  });

  it('serves unknown file types as binary', () => {
    expect(getMimeType('.bin')).toBe('application/octet-stream');
    expect(getMimeType('.dat')).toBe('application/octet-stream');
  });

  it('decodes file path for local md file', () => {
    expect(decodeFilePath('%2FUsers%2Ffoo%2FREADME.md')).toBe('/Users/foo/README.md');
  });

  it('decodes file path for local image', () => {
    expect(decodeFilePath('%2FUsers%2Fphotos%2Fimage.png')).toBe('/Users/photos/image.png');
  });
});

describe('decodeFilePath', () => {
  it('decodes simple encoded path', () => {
    expect(decodeFilePath('%2FUsers%2Ffoo%2Fbar.html')).toBe('/Users/foo/bar.html');
  });

  it('decodes path with spaces', () => {
    expect(decodeFilePath('%2FUsers%2Ffoo%2Fmy%20file.html')).toBe('/Users/foo/my file.html');
  });

  it('decodes path with unicode characters', () => {
    expect(decodeFilePath('%2Ftmp%2F%C3%BCbung.html')).toBe('/tmp/übung.html');
  });

  it('handles already-decoded path', () => {
    expect(decodeFilePath('/tmp/test.html')).toBe('/tmp/test.html');
  });

  it('decodes path with special characters', () => {
    expect(decodeFilePath('%2Ftmp%2Ffile%23name.html')).toBe('/tmp/file#name.html');
  });
});
