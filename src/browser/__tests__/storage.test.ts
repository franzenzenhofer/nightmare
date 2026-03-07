import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JsonStorage } from '../services/storage';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let tempDir: string;
let storage: JsonStorage<{ name: string; value: number }[]>;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'nightmare-test-'));
  storage = new JsonStorage(join(tempDir, 'test.json'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe('JsonStorage', () => {
  it('returns default value when file does not exist', () => {
    const result = storage.load([]);
    expect(result).toEqual([]);
  });

  it('saves and loads data', () => {
    const data = [{ name: 'test', value: 42 }];
    storage.save(data);
    const loaded = storage.load([]);
    expect(loaded).toEqual(data);
  });

  it('overwrites existing data on save', () => {
    storage.save([{ name: 'old', value: 1 }]);
    storage.save([{ name: 'new', value: 2 }]);
    const loaded = storage.load([]);
    expect(loaded).toEqual([{ name: 'new', value: 2 }]);
  });

  it('returns default value for corrupted JSON', () => {
    const fs = require('fs');
    fs.writeFileSync(join(tempDir, 'test.json'), 'not-json{{{');
    const result = storage.load([]);
    expect(result).toEqual([]);
  });

  it('creates parent directories if needed', () => {
    const nested = new JsonStorage<string[]>(join(tempDir, 'a', 'b', 'data.json'));
    nested.save(['hello']);
    expect(nested.load([])).toEqual(['hello']);
  });

  it('handles empty array', () => {
    storage.save([]);
    expect(storage.load([{ name: 'default', value: 0 }])).toEqual([]);
  });

  it('preserves data types', () => {
    const data = [{ name: 'test', value: 3.14 }];
    storage.save(data);
    expect(storage.load([])).toEqual(data);
  });
});
