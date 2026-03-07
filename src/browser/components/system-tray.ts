type TrayState = 'idle' | 'active' | 'error';

interface TrayMenuItem {
  readonly label: string;
  readonly action: string;
}

const ICON_MAP: Record<TrayState, string> = {
  idle: 'tray-idle',
  active: 'tray-active',
  error: 'tray-error',
};

export class SystemTrayLogic {
  private state: TrayState = 'idle';

  getState(): TrayState {
    return this.state;
  }

  setIdle(): void {
    this.state = 'idle';
  }

  setLoading(): void {
    this.state = 'active';
  }

  setError(): void {
    this.state = 'error';
  }

  getIconName(): string {
    return ICON_MAP[this.state];
  }

  getMenuItems(tabCount: number): TrayMenuItem[] {
    return [
      { label: 'Show Nightmare', action: 'show' },
      { label: `${String(tabCount)} tabs open`, action: 'none' },
      { label: 'New Tab', action: 'new-tab' },
      { label: 'Quit', action: 'quit' },
    ];
  }
}
