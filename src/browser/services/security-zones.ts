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
          color: 'red',
          icon: '[!]',
          message: 'LOCAL — Node.js ENABLED. Full filesystem access. No sandbox.',
          dismissable: true,
        };
      case 'LOCALHOST':
        return {
          type: 'info',
          color: 'red',
          icon: '[!]',
          message: 'LOCALHOST — Node.js ENABLED. No CORS. No sandbox.',
          dismissable: true,
        };
      case 'WEB':
        return {
          type: 'warning',
          color: 'red',
          icon: '[!!!]',
          message: 'OPEN WEB — No Node.js. ALL security disabled. Passwords and data NOT protected.',
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
