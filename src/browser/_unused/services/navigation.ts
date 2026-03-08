import { resolve, dirname, basename } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const PAGES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../pages');

const PORT_PATTERN = /^\d{2,5}$/;
const PROTOCOL_PATTERN = /^(https?|file|nightmare):\/\//;
const DOMAIN_PATTERN = /^[^\s]+\.[^\s]+$/;

export interface DisplayUrlConfig {
  readonly apiPort: number;
  readonly samplesDir: string;
  readonly pagesDir: string;
}

export function resolveUrl(input: string): string {
  const trimmed = input.trim();

  if (trimmed === '') return 'nightmare://newtab';

  if (trimmed.startsWith('nightmare:///')) {
    const absPath = trimmed.slice('nightmare://'.length);
    return `file://${absPath}`;
  }

  if (trimmed.startsWith('nightmare://')) {
    const page = trimmed.replace('nightmare://', '');
    return `file://${resolve(PAGES_DIR, `${page}.html`)}`;
  }

  if (PROTOCOL_PATTERN.test(trimmed)) return trimmed;

  if (PORT_PATTERN.test(trimmed)) {
    return `http://localhost:${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return `file://${trimmed}`;
  }

  if (trimmed.startsWith('~/')) {
    return `file://${resolve(homedir(), trimmed.slice(2))}`;
  }

  if (trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return `file://${resolve(trimmed)}`;
  }

  if (DOMAIN_PATTERN.test(trimmed) && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export function toDisplayUrl(internalUrl: string, config: DisplayUrlConfig): string {
  const prefix = `http://127.0.0.1:${String(config.apiPort)}/file/`;
  if (!internalUrl.startsWith(prefix)) return internalUrl;

  const filePath = decodeURIComponent(internalUrl.slice(prefix.length));

  if (filePath.startsWith(config.samplesDir)) {
    const name = basename(filePath, '.html');
    return `nightmare://${name === 'hello' ? 'home' : name}`;
  }

  if (filePath.startsWith(config.pagesDir)) {
    return `nightmare://${basename(filePath, '.html')}`;
  }

  return `nightmare://${filePath}`;
}
