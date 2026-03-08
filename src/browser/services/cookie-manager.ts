import { join } from 'path';
import { JsonStorage } from './storage';

export interface Cookie {
  readonly name: string;
  readonly value: string;
  readonly domain: string;
  readonly path: string;
  readonly expires: number | null;
  readonly httpOnly: boolean;
  readonly secure: boolean;
}

export interface SetCookieOptions {
  readonly name: string;
  readonly value: string;
  readonly domain: string;
  readonly path?: string | undefined;
  readonly expires?: number | undefined;
  readonly httpOnly?: boolean | undefined;
  readonly secure?: boolean | undefined;
}

export class CookieManager {
  private readonly storage: JsonStorage<Cookie[]>;

  constructor(storageDir: string) {
    this.storage = new JsonStorage(join(storageDir, 'cookies.json'));
  }

  set(options: SetCookieOptions): Cookie {
    const cookie = buildCookie(options);
    const cookies = this.load().filter(
      (c) => !isSameCookie(c, cookie),
    );
    cookies.push(cookie);
    this.save(cookies);
    return cookie;
  }

  get(name: string, domain: string): Cookie | null {
    return this.load().find(
      (c) => c.name === name && c.domain === domain,
    ) ?? null;
  }

  delete(name: string, domain: string): void {
    const cookies = this.load().filter(
      (c) => !(c.name === name && c.domain === domain),
    );
    this.save(cookies);
  }

  getByDomain(domain: string): Cookie[] {
    return this.load().filter((c) => c.domain === domain);
  }

  clearAll(): void {
    this.save([]);
  }

  clearDomain(domain: string): void {
    this.save(this.load().filter((c) => c.domain !== domain));
  }

  searchByName(pattern: string): Cookie[] {
    const lower = pattern.toLowerCase();
    return this.load().filter(
      (c) => c.name.toLowerCase().includes(lower),
    );
  }

  getAllDomains(): string[] {
    const domains = new Set(this.load().map((c) => c.domain));
    return [...domains];
  }

  private load(): Cookie[] {
    return this.storage.load([]);
  }

  private save(cookies: Cookie[]): void {
    this.storage.save(cookies);
  }
}

function buildCookie(options: SetCookieOptions): Cookie {
  return {
    name: options.name,
    value: options.value,
    domain: options.domain,
    path: options.path ?? '/',
    expires: options.expires ?? null,
    httpOnly: options.httpOnly ?? false,
    secure: options.secure ?? false,
  };
}

function isSameCookie(a: Cookie, b: Cookie): boolean {
  return a.name === b.name
    && a.domain === b.domain
    && a.path === b.path;
}
