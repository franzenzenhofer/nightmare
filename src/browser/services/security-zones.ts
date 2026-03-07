export type SecurityZone = 'LOCAL' | 'LOCALHOST' | 'WEB';

export interface BannerConfig {
  readonly type: 'info' | 'warning';
  readonly color: 'green' | 'blue' | 'red';
  readonly icon: string;
  readonly message: string;
  readonly dismissable: boolean;
}

export class SecurityZones {
  classify(url: string): SecurityZone {
    if (url === '') return 'LOCAL';

    try {
      const parsed = new URL(url);

      if (parsed.protocol === 'file:') return 'LOCAL';
      if (parsed.protocol === 'nightmare:') return 'LOCAL';
      if (parsed.protocol === 'about:') return 'LOCAL';

      if (this.isLocalhost(parsed.hostname)) return 'LOCALHOST';

      return 'WEB';
    } catch {
      return 'LOCAL';
    }
  }

  getBanner(zone: SecurityZone): BannerConfig {
    switch (zone) {
      case 'LOCAL':
        return {
          type: 'info',
          color: 'green',
          icon: '🟢',
          message: 'LOCAL FILE — Full Node.js access, no restrictions.',
          dismissable: true,
        };
      case 'LOCALHOST':
        return {
          type: 'info',
          color: 'blue',
          icon: 'ℹ️',
          message: 'LOCALHOST — Node.js enabled, no CORS restrictions.',
          dismissable: true,
        };
      case 'WEB':
        return {
          type: 'warning',
          color: 'red',
          icon: '⚠️',
          message:
            'OPEN WEB — You are browsing with ALL security disabled. Passwords, cookies, and data are NOT protected.',
          dismissable: false,
        };
    }
  }

  shouldEnableNode(zone: SecurityZone): boolean {
    return zone === 'LOCAL' || zone === 'LOCALHOST';
  }

  private isLocalhost(hostname: string): boolean {
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost') ||
      this.isPrivateIp(hostname)
    );
  }

  private isPrivateIp(hostname: string): boolean {
    return (
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  }
}
