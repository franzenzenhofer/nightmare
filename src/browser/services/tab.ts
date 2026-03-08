import type { SecurityZone } from './security-zones';
import { SecurityZones } from './security-zones';

export interface Tab {
  readonly id: string;
  url: string;
  title: string;
  favicon: string | null;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  zone: SecurityZone;
  readonly webviewId: string;
  readonly openerId: string | undefined;
  muted: boolean;
  pinned: boolean;
  readonly createdAt: number;
}

const securityZones = new SecurityZones();

export function createTab(url: string = 'nightmare://newtab', openerId?: string): Tab {
  const id = crypto.randomUUID();
  return {
    id,
    url,
    title: 'New Tab',
    favicon: null,
    loading: true,
    canGoBack: false,
    canGoForward: false,
    zone: securityZones.classify(url),
    webviewId: `webview-${id}`,
    openerId,
    muted: false,
    pinned: false,
    createdAt: Date.now(),
  };
}
