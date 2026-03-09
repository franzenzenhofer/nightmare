 
import type { TabJson } from './types';
import type { Tab } from '../services/tab';
import { toDisplayUrl as tsToDisplayUrl } from '../services/navigation';
import { getMimeType } from '../services/file-server';

interface FsModule {
  existsSync(p: string): boolean;
}

interface PathModule {
  join(...parts: string[]): string;
  resolve(...parts: string[]): string;
}

interface OsModule {
  homedir(): string;
}

declare const require: (module: string) => FsModule | PathModule | OsModule;

const fs = require('fs') as FsModule;
const path = require('path') as PathModule;
const os = require('os') as OsModule;

export function localFileUrl(filePath: string, apiPort: number): string {
  return `http://127.0.0.1:${String(apiPort)}/file/${encodeURIComponent(filePath)}`;
}

export function proxyUrl(webUrl: string, apiPort: number): string {
  return `http://127.0.0.1:${String(apiPort)}/proxy/${encodeURIComponent(webUrl)}`;
}

export interface DisplayUrlDeps {
  readonly apiPort: number;
  readonly samplesDir: string;
  readonly pagesDir: string;
}

export function toDisplayUrl(
  internalUrl: string,
  config: DisplayUrlDeps,
): string {
  const proxyPrefix = `http://127.0.0.1:${String(config.apiPort)}/proxy/`;
  if (internalUrl.startsWith(proxyPrefix)) {
    return decodeURIComponent(internalUrl.slice(proxyPrefix.length));
  }
  return tsToDisplayUrl(internalUrl, config);
}

export { getMimeType };

interface ResolveUrlDeps {
  readonly apiPort: number;
  readonly samplesDir: string;
  readonly pagesDir: string;
  readonly homeUrl: string;
}

const IS_LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/;
const IS_PRIVATE_IP_RE =
  /^(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;

export function resolveUrl(
  input: string | undefined,
  deps: ResolveUrlDeps,
): string {
  if (!input) return resolveUrl(deps.homeUrl, deps);

  if (input.startsWith('nightmare:///')) {
    const absPath = input.slice('nightmare://'.length);
    return localFileUrl(absPath, deps.apiPort);
  }

  if (input.startsWith('nightmare://')) {
    const pageName = input.replace('nightmare://', '');
    if (pageName === 'home') {
      return localFileUrl(
        path.join(deps.samplesDir, 'hello.html'),
        deps.apiPort,
      );
    }
    if (pageName === 'about') {
      return localFileUrl(
        path.join(deps.pagesDir, 'about.html'),
        deps.apiPort,
      );
    }
    const samplePath = path.join(deps.samplesDir, `${pageName}.html`);
    if (fs.existsSync(samplePath)) {
      return localFileUrl(samplePath, deps.apiPort);
    }
    const pagePath = path.join(deps.pagesDir, `${pageName}.html`);
    if (fs.existsSync(pagePath)) {
      return localFileUrl(pagePath, deps.apiPort);
    }
    return localFileUrl(
      path.join(deps.pagesDir, 'newtab.html'),
      deps.apiPort,
    );
  }

  if (input.startsWith('file://')) return input;

  if (/^https?:\/\//.test(input)) {
    let parsedHost = '';
    try {
      parsedHost = new URL(input).hostname;
    } catch {
      // invalid URL
    }
    if (
      IS_LOCAL_HOST_RE.test(parsedHost) ||
      parsedHost.endsWith('.localhost') ||
      IS_PRIVATE_IP_RE.test(parsedHost)
    ) {
      return input;
    }
    return proxyUrl(input, deps.apiPort);
  }

  if (/^\d{2,5}$/.test(input)) return `http://localhost:${input}`;

  if (
    input.startsWith('/') ||
    input.startsWith('./') ||
    input.startsWith('~')
  ) {
    return localFileUrl(
      path.resolve(input.replace(/^~/, os.homedir())),
      deps.apiPort,
    );
  }

  if (input.includes('.') && !input.includes(' ') && !input.includes('/')) {
    return proxyUrl(`https://${input}`, deps.apiPort);
  }

  return proxyUrl(
    `https://www.google.com/search?q=${encodeURIComponent(input)}`,
    deps.apiPort,
  );
}

export function tabToJson(
  t: Partial<Tab> & { id: string },
  displayUrlFn: (url: string) => string,
): TabJson {
  const url = t.url ?? '';
  return {
    id: t.id,
    url,
    displayUrl: displayUrlFn(url),
    title: t.title ?? '',
    zone: t.zone ?? 'LOCAL',
  };
}
