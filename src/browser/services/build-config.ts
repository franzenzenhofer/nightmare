export type Platform = 'linux' | 'osx' | 'win';

const VALID_PLATFORMS: readonly Platform[] = ['linux', 'osx', 'win'];
const VALID_ARCHS: readonly string[] = ['x64', 'arm64', 'ia32'];

export interface BuildConfig {
  readonly platforms: readonly Platform[];
  readonly arch: string;
  readonly version: string;
  readonly srcDir: string;
  readonly outDir: string;
  readonly appName: string;
  readonly iconLinux: string;
  readonly iconOsx: string;
  readonly iconWin: string;
}

export interface BuildConfigOptions {
  readonly platforms?: readonly Platform[];
  readonly arch?: string;
  readonly version?: string;
  readonly srcDir?: string;
  readonly outDir?: string;
  readonly appName?: string;
  readonly iconLinux?: string;
  readonly iconOsx?: string;
  readonly iconWin?: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const DEFAULTS: BuildConfig = {
  platforms: ['linux', 'osx', 'win'],
  arch: 'x64',
  version: 'latest',
  srcDir: 'src/',
  outDir: 'dist/',
  appName: 'nightmare-browser',
  iconLinux: 'assets/icon.png',
  iconOsx: 'assets/icon.icns',
  iconWin: 'assets/icon.ico',
};

export function createBuildConfig(options?: BuildConfigOptions): BuildConfig {
  return {
    platforms: options?.platforms ? [...options.platforms] : [...DEFAULTS.platforms],
    arch: options?.arch ?? DEFAULTS.arch,
    version: options?.version ?? DEFAULTS.version,
    srcDir: options?.srcDir ?? DEFAULTS.srcDir,
    outDir: options?.outDir ?? DEFAULTS.outDir,
    appName: options?.appName ?? DEFAULTS.appName,
    iconLinux: options?.iconLinux ?? DEFAULTS.iconLinux,
    iconOsx: options?.iconOsx ?? DEFAULTS.iconOsx,
    iconWin: options?.iconWin ?? DEFAULTS.iconWin,
  };
}

export function validateBuildConfig(config: BuildConfig): ValidationResult {
  const errors: string[] = [];

  if (config.platforms.length === 0) {
    errors.push('platforms must contain at least one target');
  }

  for (const p of config.platforms) {
    if (!VALID_PLATFORMS.includes(p)) {
      errors.push(`invalid platform: ${p}`);
    }
  }

  if (new Set(config.platforms).size !== config.platforms.length) {
    errors.push('platforms contains duplicates');
  }

  if (!VALID_ARCHS.includes(config.arch)) {
    errors.push(`invalid arch: ${config.arch}`);
  }

  if (config.version === '') {
    errors.push('version must not be empty');
  }

  if (config.appName === '') {
    errors.push('appName must not be empty');
  }

  if (config.srcDir === '') {
    errors.push('srcDir must not be empty');
  }

  if (config.outDir === '') {
    errors.push('outDir must not be empty');
  }

  return { valid: errors.length === 0, errors };
}

export function getBuildCommand(config: BuildConfig): string {
  const validation = validateBuildConfig(config);
  if (!validation.valid) {
    throw new Error(`invalid build config: ${validation.errors.join(', ')}`);
  }

  const parts = [
    'nw-builder',
    `--platforms ${config.platforms.join(',')}`,
    `--arch ${config.arch}`,
    `--version ${config.version}`,
    `--buildDir ${config.outDir}`,
    config.srcDir,
  ];

  return parts.join(' ');
}
