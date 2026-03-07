import { resolve, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const PAGES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../pages');

const PORT_PATTERN = /^\d{2,5}$/;
const PROTOCOL_PATTERN = /^(https?|file|nightmare):\/\//;
const DOMAIN_PATTERN = /^[^\s]+\.[^\s]+$/;

export function resolveUrl(input: string): string {
  const trimmed = input.trim();

  if (trimmed === '') return 'nightmare://newtab';

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
