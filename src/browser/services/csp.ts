import type { SecurityZone } from './security-zones';

export interface CspDirectives {
  readonly 'default-src': readonly string[];
  readonly 'script-src': readonly string[];
  readonly 'style-src': readonly string[];
  readonly 'img-src': readonly string[];
  readonly 'connect-src': readonly string[];
  readonly 'frame-src': readonly string[];
}

export type CspDirectiveName = keyof CspDirectives;

export const CSP_DIRECTIVE_NAMES: readonly CspDirectiveName[] = [
  'default-src',
  'script-src',
  'style-src',
  'img-src',
  'connect-src',
  'frame-src',
] as const;

const VALID_VALUE_PATTERN =
  /^('self'|'unsafe-inline'|'unsafe-eval'|'none'|\*|[a-z][a-z0-9+.-]*:|https?:\/\/[^\s;]+)$/;

export function validateDirectiveValue(value: string): boolean {
  if (value === '') return false;
  if (value.includes(';')) return false;
  if (value.includes('\n')) return false;
  return VALID_VALUE_PATTERN.test(value);
}

function localDirectives(): CspDirectives {
  return {
    'default-src': ['*', "'unsafe-inline'", "'unsafe-eval'", 'data:', 'blob:', 'file:'],
    'script-src': ['*', "'unsafe-inline'", "'unsafe-eval'", 'file:', 'data:', 'blob:'],
    'style-src': ['*', "'unsafe-inline'", 'file:', 'data:'],
    'img-src': ['*', 'data:', 'blob:', 'file:'],
    'connect-src': ['*', 'data:', 'blob:', 'file:'],
    'frame-src': ['*', 'data:', 'blob:', 'file:'],
  };
}

function localhostDirectives(): CspDirectives {
  return {
    'default-src': ["'self'", 'http://localhost:*', 'http://127.0.0.1:*'],
    'script-src': [
      "'self'", "'unsafe-inline'", "'unsafe-eval'",
      'http://localhost:*', 'http://127.0.0.1:*',
    ],
    'style-src': ["'self'", "'unsafe-inline'", 'http://localhost:*', 'http://127.0.0.1:*'],
    'img-src': ["'self'", 'data:', 'http://localhost:*', 'http://127.0.0.1:*'],
    'connect-src': [
      "'self'", 'http://localhost:*', 'http://127.0.0.1:*',
      'ws://localhost:*', 'ws://127.0.0.1:*', 'blob:',
    ],
    'frame-src': ["'self'", 'http://localhost:*', 'http://127.0.0.1:*'],
  };
}

function webDirectives(): CspDirectives {
  return {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'"],
    'frame-src': ["'self'"],
  };
}

export function generateCspDirectives(zone: SecurityZone): CspDirectives {
  switch (zone) {
    case 'LOCAL': return localDirectives();
    case 'LOCALHOST': return localhostDirectives();
    case 'WEB': return webDirectives();
  }
}

export function buildCspHeader(directives: CspDirectives): string {
  return CSP_DIRECTIVE_NAMES
    .map((name) => `${name} ${directives[name].join(' ')}`)
    .join('; ');
}

export function applyOverrides(
  base: CspDirectives,
  overrides: Partial<{ readonly [K in CspDirectiveName]: readonly string[] }>,
): CspDirectives {
  const result: Record<string, readonly string[]> = {};
  for (const key of CSP_DIRECTIVE_NAMES) {
    const override = overrides[key];
    result[key] = override !== undefined ? [...override] : [...base[key]];
  }
  return result as unknown as CspDirectives;
}
