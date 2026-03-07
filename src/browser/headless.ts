const DEFAULT_API_PORT = 6660;

interface CliArgs {
  readonly headless: boolean;
  readonly apiPort: number;
}

interface StartupConfig {
  readonly showWindow: boolean;
  readonly apiPort: number;
  readonly startApi: boolean;
}

export function parseCliArgs(
  argv: readonly string[],
  env: Record<string, string | undefined> = {},
): CliArgs {
  const headless = argv.includes('--headless');
  const portFlagIndex = argv.indexOf('--api-port');
  let apiPort = DEFAULT_API_PORT;

  if (portFlagIndex !== -1) {
    const portStr = argv[portFlagIndex + 1];
    if (portStr !== undefined) {
      apiPort = parseInt(portStr, 10);
    }
  } else if (env.NIGHTMARE_API_PORT !== undefined) {
    apiPort = parseInt(env.NIGHTMARE_API_PORT, 10);
  }

  return { headless, apiPort };
}

export function createHeadlessConfig(args: CliArgs): StartupConfig {
  return {
    showWindow: !args.headless,
    apiPort: args.apiPort,
    startApi: true,
  };
}
