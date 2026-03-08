export const VIEWPORT_MIN_WIDTH = 100;
export const VIEWPORT_MIN_HEIGHT = 100;
export const VIEWPORT_MAX_WIDTH = 7680;
export const VIEWPORT_MAX_HEIGHT = 4320;
export const DEFAULT_DEVICE_PIXEL_RATIO = 1;

const VALID_PIXEL_RATIOS: ReadonlySet<number> = new Set([1, 2, 3]);

export interface ViewportPreset {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
}

export interface ViewportState {
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
  readonly isResponsiveMode: boolean;
}

export const DEVICE_PRESETS: readonly ViewportPreset[] = [
  { name: 'iPhone SE', width: 375, height: 667, devicePixelRatio: 2 },
  { name: 'iPhone 14 Pro', width: 393, height: 852, devicePixelRatio: 3 },
  { name: 'iPad', width: 768, height: 1024, devicePixelRatio: 2 },
  { name: 'iPad Pro', width: 1024, height: 1366, devicePixelRatio: 2 },
  { name: 'Galaxy S21', width: 360, height: 800, devicePixelRatio: 3 },
  { name: 'Desktop HD', width: 1920, height: 1080, devicePixelRatio: 1 },
  { name: 'Desktop 4K', width: 3840, height: 2160, devicePixelRatio: 1 },
];

function validateWidth(width: number): void {
  if (!Number.isInteger(width)) {
    throw new Error('Width must be an integer');
  }
  if (width < VIEWPORT_MIN_WIDTH || width > VIEWPORT_MAX_WIDTH) {
    throw new Error(`Width must be between ${String(VIEWPORT_MIN_WIDTH)} and ${String(VIEWPORT_MAX_WIDTH)}`);
  }
}

function validateHeight(height: number): void {
  if (!Number.isInteger(height)) {
    throw new Error('Height must be an integer');
  }
  if (height < VIEWPORT_MIN_HEIGHT || height > VIEWPORT_MAX_HEIGHT) {
    throw new Error(`Height must be between ${String(VIEWPORT_MIN_HEIGHT)} and ${String(VIEWPORT_MAX_HEIGHT)}`);
  }
}

function validatePixelRatio(ratio: number): void {
  if (!VALID_PIXEL_RATIOS.has(ratio)) {
    throw new Error('Device pixel ratio must be 1, 2, or 3');
  }
}

function findPreset(name: string): ViewportPreset {
  const preset = DEVICE_PRESETS.find((p) => p.name === name);
  if (preset === undefined) {
    throw new Error(`Unknown preset: ${name}`);
  }
  return preset;
}

export class ResponsiveMode {
  private readonly viewports: Map<string, ViewportState> = new Map();

  getViewport(tabId: string): ViewportState | null {
    return this.viewports.get(tabId) ?? null;
  }

  setViewport(tabId: string, width: number, height: number): ViewportState {
    validateWidth(width);
    validateHeight(height);
    const existing = this.viewports.get(tabId);
    const dpr = existing?.devicePixelRatio ?? DEFAULT_DEVICE_PIXEL_RATIO;
    const state: ViewportState = {
      width,
      height,
      devicePixelRatio: dpr,
      isResponsiveMode: true,
    };
    this.viewports.set(tabId, state);
    return state;
  }

  resetViewport(tabId: string): boolean {
    return this.viewports.delete(tabId);
  }

  setFromPreset(tabId: string, presetName: string): ViewportState {
    const preset = findPreset(presetName);
    const state: ViewportState = {
      width: preset.width,
      height: preset.height,
      devicePixelRatio: preset.devicePixelRatio,
      isResponsiveMode: true,
    };
    this.viewports.set(tabId, state);
    return state;
  }

  setDevicePixelRatio(tabId: string, ratio: number): ViewportState {
    const existing = this.viewports.get(tabId);
    if (existing === undefined) {
      throw new Error(`Tab ${tabId} is not in responsive mode`);
    }
    validatePixelRatio(ratio);
    const state: ViewportState = {
      width: existing.width,
      height: existing.height,
      devicePixelRatio: ratio,
      isResponsiveMode: true,
    };
    this.viewports.set(tabId, state);
    return state;
  }

  isResponsiveMode(tabId: string): boolean {
    return this.viewports.has(tabId);
  }

  listPresets(): ViewportPreset[] {
    return [...DEVICE_PRESETS];
  }

  removeTab(tabId: string): void {
    this.viewports.delete(tabId);
  }
}
