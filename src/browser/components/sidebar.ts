export type SidebarPanel = 'bookmarks' | 'history' | 'downloads';

export interface SidebarState {
  readonly isOpen: boolean;
  readonly activePanel: SidebarPanel;
}

export class SidebarLogic {
  private isOpen = false;
  private activePanel: SidebarPanel = 'bookmarks';

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  open(panel: SidebarPanel): void {
    this.isOpen = true;
    this.activePanel = panel;
  }

  close(): void {
    this.isOpen = false;
  }

  switchPanel(panel: SidebarPanel): void {
    this.activePanel = panel;
  }

  getState(): SidebarState {
    return {
      isOpen: this.isOpen,
      activePanel: this.activePanel,
    };
  }
}
