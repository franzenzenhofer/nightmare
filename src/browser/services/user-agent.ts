export interface UserAgentPreset {
  readonly name: string;
  readonly value: string;
}

const DEFAULT_UA = 'Mozilla/5.0 (Nightmare/1.0) NW.js Chrome/120 Safari/537.36 Nightmare/1.0';

const PRESETS: readonly UserAgentPreset[] = [
  { name: 'Chrome Desktop', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
  { name: 'Chrome Mobile', value: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36' },
  { name: 'Firefox Desktop', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0' },
  { name: 'Safari Desktop', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.2 Safari/605.1.15' },
  { name: 'Safari Mobile', value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' },
  { name: 'Googlebot', value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
];

export class UserAgentManager {
  private readonly overrides = new Map<string, string>();

  getDefault(): string {
    return DEFAULT_UA;
  }

  get(tabId: string): string {
    return this.overrides.get(tabId) ?? DEFAULT_UA;
  }

  set(tabId: string, userAgent: string): void {
    this.overrides.set(tabId, userAgent);
  }

  reset(tabId: string): void {
    this.overrides.delete(tabId);
  }

  listPresets(): readonly UserAgentPreset[] {
    return PRESETS;
  }

  setFromPreset(tabId: string, presetName: string): void {
    const preset = PRESETS.find((p) => p.name === presetName);
    if (!preset) throw new Error(`Unknown preset: ${presetName}`);
    this.overrides.set(tabId, preset.value);
  }

  getOverrides(): ReadonlyMap<string, string> {
    return this.overrides;
  }
}
