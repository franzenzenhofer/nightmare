export interface DevToolsConfig {
  readonly devMode: boolean;
  readonly userOverride: boolean | null;
}

export function shouldAutoOpen(config: DevToolsConfig): boolean {
  if (config.userOverride !== null) return config.userOverride;
  return config.devMode;
}
