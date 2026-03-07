import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SettingsManager } from '../services/settings';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let tempDir: string;
let sm: SettingsManager;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'nightmare-settings-'));
  sm = new SettingsManager(tempDir);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('SettingsManager', () => {
  it('returns default home page', () => {
    expect(sm.get('homePage')).toBe('nightmare://newtab');
  });

  it('returns default search engine', () => {
    expect(sm.get('searchEngine')).toBe('google');
  });

  it('returns default downloads path', () => {
    expect(sm.get('downloadsPath')).toBeDefined();
  });

  it('returns default theme', () => {
    expect(sm.get('theme')).toBe('dark');
  });

  it('returns default bookmarksBarVisible', () => {
    expect(sm.get('bookmarksBarVisible')).toBe(true);
  });

  it('returns default apiPort', () => {
    expect(sm.get('apiPort')).toBe(6660);
  });

  it('sets and gets a value', () => {
    sm.set('homePage', 'https://custom.com');
    expect(sm.get('homePage')).toBe('https://custom.com');
  });

  it('persists settings across instances', () => {
    sm.set('theme', 'light');
    const sm2 = new SettingsManager(tempDir);
    expect(sm2.get('theme')).toBe('light');
  });

  it('returns all settings', () => {
    const all = sm.getAll();
    expect(all.homePage).toBe('nightmare://newtab');
    expect(all.searchEngine).toBe('google');
    expect(all.theme).toBe('dark');
  });

  it('merges with defaults for missing keys', () => {
    sm.set('homePage', 'custom');
    const sm2 = new SettingsManager(tempDir);
    expect(sm2.get('homePage')).toBe('custom');
    expect(sm2.get('theme')).toBe('dark');
  });
});
