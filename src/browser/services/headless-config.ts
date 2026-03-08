export interface HeadlessConfig {
  readonly headless: boolean;
  readonly apiPort: number;
  readonly devtools: boolean;
}

const DEFAULT_API_PORT = 6660;

export function parseCliArgs(
  args: readonly string[],
  env: Record<string, string | undefined> = {},
): HeadlessConfig {
  let headless = false;
  let devtools = false;
  let apiPort: number | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--headless') headless = true;
    if (arg === '--devtools') devtools = true;
    if (arg === '--api-port' && args[i + 1] !== undefined) {
      apiPort = Number(args[i + 1]);
      i += 1;
    }
    if (arg?.startsWith('--api-port=') === true) {
      apiPort = Number(arg.slice('--api-port='.length));
    }
  }

  if (apiPort === null) {
    const envPort = env['NIGHTMARE_API_PORT'];
    apiPort = envPort !== undefined ? Number(envPort) : DEFAULT_API_PORT;
  }

  return { headless, apiPort, devtools };
}

export function getStartupJson(config: HeadlessConfig): string {
  return JSON.stringify({
    ready: true,
    api: `http://localhost:${String(config.apiPort)}`,
    mcp: `http://localhost:${String(config.apiPort)}/mcp`,
    headless: config.headless,
  });
}
