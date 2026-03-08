export class TabMuteManager {
  private readonly mutedTabs: Set<string> = new Set();

  isMuted(tabId: string): boolean {
    return this.mutedTabs.has(tabId);
  }

  mute(tabId: string): void {
    this.mutedTabs.add(tabId);
  }

  unmute(tabId: string): void {
    this.mutedTabs.delete(tabId);
  }

  toggle(tabId: string): boolean {
    if (this.mutedTabs.has(tabId)) {
      this.mutedTabs.delete(tabId);
      return false;
    }
    this.mutedTabs.add(tabId);
    return true;
  }

  muteAll(tabIds: readonly string[]): void {
    for (const id of tabIds) {
      this.mutedTabs.add(id);
    }
  }

  unmuteAll(): void {
    this.mutedTabs.clear();
  }

  getMutedTabIds(): string[] {
    return [...this.mutedTabs];
  }

  hasAnyMuted(): boolean {
    return this.mutedTabs.size > 0;
  }

  removeTab(tabId: string): void {
    this.mutedTabs.delete(tabId);
  }
}
