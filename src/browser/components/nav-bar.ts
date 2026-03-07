import type { Tab } from '../services/tab';
import type { SecurityZone } from '../services/security-zones';

export interface NavBarState {
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly isLoading: boolean;
  readonly zoneDot: 'green' | 'blue' | 'red';
  readonly url: string;
}

const ZONE_DOT_MAP: Record<SecurityZone, NavBarState['zoneDot']> = {
  LOCAL: 'green',
  LOCALHOST: 'blue',
  WEB: 'red',
} as const;

const DEFAULT_STATE: NavBarState = {
  canGoBack: false,
  canGoForward: false,
  isLoading: false,
  zoneDot: 'green',
  url: '',
} as const;

export function getNavBarState(tab: Tab | undefined): NavBarState {
  if (!tab) return DEFAULT_STATE;

  return {
    canGoBack: tab.canGoBack,
    canGoForward: tab.canGoForward,
    isLoading: tab.loading,
    zoneDot: ZONE_DOT_MAP[tab.zone],
    url: tab.url,
  };
}
