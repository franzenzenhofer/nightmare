import type { SecurityZone, BannerConfig } from '../services/security-zones';
import { SecurityZones } from '../services/security-zones';

export class SecurityBannerLogic {
  private readonly dismissed = new Set<string>();
  private readonly zones = new SecurityZones();

  getBannerState(tabId: string, zone: SecurityZone): BannerConfig | null {
    const config = this.zones.getBanner(zone);

    if (config.dismissable && this.dismissed.has(tabId)) {
      return null;
    }

    return config;
  }

  dismiss(tabId: string): void {
    this.dismissed.add(tabId);
  }

  reset(tabId: string): void {
    this.dismissed.delete(tabId);
  }
}
