import type { SecurityZone } from '../services/security-zones';

export interface StatusBarState {
  readonly zoneLabel: string;
  readonly zoneColor: 'green' | 'blue' | 'red';
  readonly tabCount: number;
  readonly nodeEnabled: boolean;
}

const ZONE_CONFIG: Record<SecurityZone, Pick<StatusBarState, 'zoneColor' | 'nodeEnabled'>> = {
  LOCAL: { zoneColor: 'green', nodeEnabled: true },
  LOCALHOST: { zoneColor: 'blue', nodeEnabled: true },
  WEB: { zoneColor: 'red', nodeEnabled: false },
};

export function getStatusBarState(
  tabCount: number,
  activeZone: SecurityZone | undefined,
): StatusBarState {
  if (activeZone === undefined) {
    return { zoneLabel: '', zoneColor: 'green', tabCount, nodeEnabled: false };
  }

  const config = ZONE_CONFIG[activeZone];
  return {
    zoneLabel: activeZone,
    zoneColor: config.zoneColor,
    tabCount,
    nodeEnabled: config.nodeEnabled,
  };
}
