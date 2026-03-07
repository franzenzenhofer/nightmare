import { describe, it, expect, beforeEach } from 'vitest';
import { ConsoleCapture } from '../api/console-capture';
import type { ConsoleEntry } from '../api/console-capture';

let capture: ConsoleCapture;

beforeEach(() => {
  capture = new ConsoleCapture();
});

describe('ConsoleCapture', () => {
  it('captures a log entry', () => {
    capture.add('tab1', 'log', ['hello world']);
    const entries = capture.getEntries('tab1');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.level).toBe('log');
    expect(entries[0]?.args).toEqual(['hello world']);
  });

  it('captures entries with timestamp and tabId', () => {
    capture.add('tab1', 'log', ['test']);
    const entry = capture.getEntries('tab1')[0];
    expect(entry?.tabId).toBe('tab1');
    expect(entry?.timestamp).toBeGreaterThan(0);
  });

  it('captures different log levels', () => {
    capture.add('t1', 'log', ['info']);
    capture.add('t1', 'warn', ['warning']);
    capture.add('t1', 'error', ['err']);
    const entries = capture.getEntries('t1');
    expect(entries).toHaveLength(3);
    expect(entries[0]?.level).toBe('log');
    expect(entries[1]?.level).toBe('warn');
    expect(entries[2]?.level).toBe('error');
  });

  it('separates entries by tab', () => {
    capture.add('tab1', 'log', ['a']);
    capture.add('tab2', 'log', ['b']);
    expect(capture.getEntries('tab1')).toHaveLength(1);
    expect(capture.getEntries('tab2')).toHaveLength(1);
  });

  it('returns empty array for unknown tab', () => {
    expect(capture.getEntries('unknown')).toHaveLength(0);
  });

  it('returns all entries across tabs', () => {
    capture.add('tab1', 'log', ['a']);
    capture.add('tab2', 'log', ['b']);
    expect(capture.getAllEntries()).toHaveLength(2);
  });

  it('enforces per-tab ring buffer limit', () => {
    const small = new ConsoleCapture(3);
    small.add('t1', 'log', ['1']);
    small.add('t1', 'log', ['2']);
    small.add('t1', 'log', ['3']);
    small.add('t1', 'log', ['4']);
    small.add('t1', 'log', ['5']);
    const entries = small.getEntries('t1');
    expect(entries).toHaveLength(3);
    expect(entries[0]?.args).toEqual(['3']);
  });

  it('clears entries for a specific tab', () => {
    capture.add('tab1', 'log', ['a']);
    capture.add('tab2', 'log', ['b']);
    capture.clear('tab1');
    expect(capture.getEntries('tab1')).toHaveLength(0);
    expect(capture.getEntries('tab2')).toHaveLength(1);
  });

  it('clears all entries', () => {
    capture.add('tab1', 'log', ['a']);
    capture.add('tab2', 'log', ['b']);
    capture.clearAll();
    expect(capture.getAllEntries()).toHaveLength(0);
  });

  it('filters entries by level', () => {
    capture.add('t1', 'log', ['info']);
    capture.add('t1', 'error', ['bad']);
    capture.add('t1', 'warn', ['hmm']);
    const errors = capture.getEntries('t1', 'error');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.level).toBe('error');
  });
});
