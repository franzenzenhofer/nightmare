import type { SecurityZone } from '../services/security-zones';

export interface BridgeConfig {
  readonly nodeEnabled: boolean;
  readonly corsDisabled: boolean;
  readonly apiNamespace: string;
  readonly allowedModules: readonly string[];
}

const LOCAL_MODULES: readonly string[] = [
  'fs', 'path', 'os', 'child_process', 'http', 'https', 'crypto', 'url',
] as const;

const LOCALHOST_MODULES: readonly string[] = [
  'fs', 'path', 'os', 'http', 'https', 'crypto', 'url',
] as const;

const CONFIGS: Record<SecurityZone, BridgeConfig> = {
  LOCAL: {
    nodeEnabled: true,
    corsDisabled: true,
    apiNamespace: 'nightmare',
    allowedModules: LOCAL_MODULES,
  },
  LOCALHOST: {
    nodeEnabled: true,
    corsDisabled: true,
    apiNamespace: 'nightmare',
    allowedModules: LOCALHOST_MODULES,
  },
  WEB: {
    nodeEnabled: false,
    corsDisabled: false,
    apiNamespace: 'nightmare',
    allowedModules: [],
  },
} as const;

export function getNodeBridgeConfig(zone: SecurityZone): BridgeConfig {
  return CONFIGS[zone];
}
