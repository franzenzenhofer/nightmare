import { describe, it, expect } from 'vitest';
import {
  UI_ACTIONS,
  getApiCoverage,
  getMissingApiActions,
} from '../services/api-verification';
import type { UiAction } from '../services/api-verification';
import { ROUTE_METADATA } from '../services/openapi-routes';

describe('UI_ACTIONS', () => {
  it('contains exactly 25 browser UI actions', () => {
    expect(UI_ACTIONS).toHaveLength(25);
  });

  it('has no duplicate entries', () => {
    const unique = new Set(UI_ACTIONS);
    expect(unique.size).toBe(UI_ACTIONS.length);
  });

  it('includes all expected actions', () => {
    const expected: readonly UiAction[] = [
      'create_tab', 'close_tab', 'navigate', 'go_back', 'go_forward',
      'reload', 'activate_tab', 'duplicate_tab', 'pin_tab', 'mute_tab',
      'zoom', 'find_in_page', 'execute_js', 'screenshot', 'get_html',
      'click', 'type_text', 'wait_for', 'query_dom', 'get_console',
      'get_state', 'shutdown', 'relaunch', 'add_bookmark', 'search_history',
    ];
    for (const action of expected) {
      expect(UI_ACTIONS).toContain(action);
    }
  });

  it('is readonly', () => {
    const actions: readonly string[] = UI_ACTIONS;
    expect(Array.isArray(actions)).toBe(true);
  });
});

describe('getApiCoverage', () => {
  it('returns one entry per UI action', () => {
    const coverage = getApiCoverage();
    expect(coverage).toHaveLength(UI_ACTIONS.length);
  });

  it('every entry has the correct mcpName format', () => {
    const coverage = getApiCoverage();
    for (const entry of coverage) {
      expect(entry.mcpName).toBe(`nightmare_${entry.action}`);
    }
  });

  it('covered entries have a non-null route string', () => {
    const coverage = getApiCoverage();
    const covered = coverage.filter((e) => e.covered);
    for (const entry of covered) {
      expect(entry.route).not.toBeNull();
      expect(entry.route).toMatch(/^(GET|POST|DELETE|PUT|PATCH) \//);
    }
  });

  it('uncovered entries have a null route', () => {
    const coverage = getApiCoverage();
    const uncovered = coverage.filter((e) => !e.covered);
    for (const entry of uncovered) {
      expect(entry.route).toBeNull();
    }
  });

  it('returns entries matching ApiCoverageEntry shape', () => {
    const coverage = getApiCoverage();
    for (const entry of coverage) {
      expect(typeof entry.action).toBe('string');
      expect(typeof entry.covered).toBe('boolean');
      expect(typeof entry.mcpName).toBe('string');
      expect(entry.route === null || typeof entry.route === 'string').toBe(true);
    }
  });

  it('maps each action to its corresponding ROUTE_METADATA entry', () => {
    const coverage = getApiCoverage();
    for (const entry of coverage) {
      const meta = ROUTE_METADATA.find((r) => r.mcpName === entry.mcpName);
      if (meta !== undefined) {
        expect(entry.covered).toBe(true);
        expect(entry.route).toBe(`${meta.method} ${meta.path}`);
      } else {
        expect(entry.covered).toBe(false);
        expect(entry.route).toBeNull();
      }
    }
  });
});

describe('getMissingApiActions', () => {
  it('returns an empty array when all UI actions have API routes', () => {
    const missing = getMissingApiActions();
    expect(missing).toEqual([]);
  });

  it('return type is readonly array of UiAction', () => {
    const missing: readonly UiAction[] = getMissingApiActions();
    expect(Array.isArray(missing)).toBe(true);
  });
});

describe('100% API coverage verification', () => {
  it('every UI action has a matching route in ROUTE_METADATA', () => {
    for (const action of UI_ACTIONS) {
      const mcpName = `nightmare_${action}`;
      const match = ROUTE_METADATA.find((r) => r.mcpName === mcpName);
      expect(match).toBeDefined();
    }
  });

  it('coverage count equals total UI actions', () => {
    const coverage = getApiCoverage();
    const coveredCount = coverage.filter((e) => e.covered).length;
    expect(coveredCount).toBe(UI_ACTIONS.length);
  });
});
