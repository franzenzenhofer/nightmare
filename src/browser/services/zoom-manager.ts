export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 5.0;
export const ZOOM_STEP = 0.1;
export const ZOOM_DEFAULT = 1.0;

function clamp(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

export class ZoomManager {
  private readonly levels: Map<string, number> = new Map();

  getZoom(tabId: string): number {
    return this.levels.get(tabId) ?? ZOOM_DEFAULT;
  }

  setZoom(tabId: string, level: number): number {
    const clamped = clamp(level);
    this.levels.set(tabId, clamped);
    return clamped;
  }

  zoomIn(tabId: string): number {
    const current = this.getZoom(tabId);
    return this.setZoom(tabId, current + ZOOM_STEP);
  }

  zoomOut(tabId: string): number {
    const current = this.getZoom(tabId);
    return this.setZoom(tabId, current - ZOOM_STEP);
  }

  resetZoom(tabId: string): number {
    return this.setZoom(tabId, ZOOM_DEFAULT);
  }

  removeTab(tabId: string): void {
    this.levels.delete(tabId);
  }

  getAllZoomLevels(): Map<string, number> {
    return new Map(this.levels);
  }
}
