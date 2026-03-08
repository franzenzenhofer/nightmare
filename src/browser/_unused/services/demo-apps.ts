import type { SecurityZone } from './security-zones';

export interface DemoApp {
  readonly name: string;
  readonly description: string;
  readonly path: string;
  readonly requiredZone: SecurityZone;
  readonly features: readonly string[];
}

const VALID_ZONES: readonly SecurityZone[] = ['LOCAL', 'LOCALHOST', 'WEB'];

export const DEMO_APPS: readonly DemoApp[] = [
  {
    name: 'File Explorer',
    description: 'Browse local files with full filesystem access',
    path: 'demos/file-explorer',
    requiredZone: 'LOCAL',
    features: ['fs', 'path'],
  },
  {
    name: 'Terminal',
    description: 'Run shell commands with child process access',
    path: 'demos/terminal',
    requiredZone: 'LOCAL',
    features: ['child_process'],
  },
  {
    name: 'API Tester',
    description: 'Make HTTP requests without CORS restrictions',
    path: 'demos/api-tester',
    requiredZone: 'LOCALHOST',
    features: ['fetch', 'cors-free'],
  },
  {
    name: 'Code Editor',
    description: 'Edit local files with syntax highlighting',
    path: 'demos/code-editor',
    requiredZone: 'LOCAL',
    features: ['fs', 'path', 'syntax-highlight'],
  },
  {
    name: 'System Monitor',
    description: 'Show CPU and memory usage in real time',
    path: 'demos/system-monitor',
    requiredZone: 'LOCAL',
    features: ['os', 'process'],
  },
  {
    name: 'Web Scraper',
    description: 'Scrape websites with full DOM parsing',
    path: 'demos/web-scraper',
    requiredZone: 'WEB',
    features: ['fetch', 'dom-parse'],
  },
] as const;

export function getDemosByZone(zone: SecurityZone): readonly DemoApp[] {
  return DEMO_APPS.filter((app) => app.requiredZone === zone);
}

export function validateDemoConfig(demo: DemoApp): boolean {
  if (demo.name.length === 0) return false;
  if (demo.description.length === 0) return false;
  if (demo.path.length === 0) return false;
  if (!demo.path.startsWith('demos/')) return false;
  if (!VALID_ZONES.includes(demo.requiredZone)) return false;
  if (demo.features.length === 0) return false;
  return true;
}
