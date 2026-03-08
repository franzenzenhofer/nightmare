interface DragState {
  readonly tabId: string;
  readonly startIndex: number;
}

export class TabDragManager {
  private dragState: DragState | null = null;

  startDrag(tabId: string, startIndex: number): void {
    this.dragState = { tabId, startIndex };
  }

  endDrag(): void {
    this.dragState = null;
  }

  isDragging(): boolean {
    return this.dragState !== null;
  }

  getDragState(): DragState | null {
    return this.dragState;
  }

  reorder(tabIds: readonly string[], from: number, to: number): string[] {
    const result = [...tabIds];
    if (from === to) return result;
    const [moved] = result.splice(from, 1);
    if (moved !== undefined) {
      result.splice(to, 0, moved);
    }
    return result;
  }

  getDropIndex(xPosition: number, tabWidths: readonly number[]): number {
    if (tabWidths.length === 0) return 0;
    let accumulated = 0;
    for (let i = 0; i < tabWidths.length; i++) {
      const width = tabWidths[i];
      if (width === undefined) continue;
      accumulated += width;
      if (xPosition < accumulated) return i;
    }
    return tabWidths.length - 1;
  }

  validateDrop(from: number, to: number, totalTabs: number): boolean {
    if (from === to) return false;
    if (from < 0 || to < 0) return false;
    if (from >= totalTabs || to >= totalTabs) return false;
    return true;
  }
}
