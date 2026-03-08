import { ROUTE_METADATA } from './openapi-routes';

export const UI_ACTIONS = [
  'create_tab',
  'close_tab',
  'navigate',
  'go_back',
  'go_forward',
  'reload',
  'activate_tab',
  'duplicate_tab',
  'pin_tab',
  'mute_tab',
  'zoom',
  'find_in_page',
  'execute_js',
  'screenshot',
  'get_html',
  'click',
  'type_text',
  'wait_for',
  'query_dom',
  'get_console',
  'get_state',
  'shutdown',
  'relaunch',
  'add_bookmark',
  'search_history',
] as const;

export type UiAction = (typeof UI_ACTIONS)[number];

export interface ApiCoverageEntry {
  readonly action: UiAction;
  readonly covered: boolean;
  readonly mcpName: string;
  readonly route: string | null;
}

function toMcpName(action: UiAction): string {
  return `nightmare_${action}`;
}

export function getApiCoverage(): readonly ApiCoverageEntry[] {
  return UI_ACTIONS.map((action): ApiCoverageEntry => {
    const mcpName = toMcpName(action);
    const match = ROUTE_METADATA.find((r) => r.mcpName === mcpName);
    return {
      action,
      covered: match !== undefined,
      mcpName,
      route: match !== undefined ? `${match.method} ${match.path}` : null,
    };
  });
}

export function getMissingApiActions(): readonly UiAction[] {
  return getApiCoverage()
    .filter((entry) => !entry.covered)
    .map((entry) => entry.action);
}

export function getCoveragePercentage(): number {
  const coverage = getApiCoverage();
  const covered = coverage.filter((e) => e.covered).length;
  return Math.round((covered / coverage.length) * 100);
}
