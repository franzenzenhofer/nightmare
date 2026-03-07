export interface ShortcutBinding {
  readonly key: string;
  readonly ctrl?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly action: string;
}

interface Modifiers {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

const DEFAULT_BINDINGS: readonly ShortcutBinding[] = [
  { key: 't', ctrl: true, action: 'new-tab' },
  { key: 'w', ctrl: true, action: 'close-tab' },
  { key: 'Tab', ctrl: true, shift: true, action: 'prev-tab' },
  { key: 'Tab', ctrl: true, action: 'next-tab' },
  { key: 'l', ctrl: true, action: 'focus-url' },
  { key: 'd', ctrl: true, action: 'bookmark-page' },
  { key: 'b', ctrl: true, action: 'toggle-bookmarks' },
  { key: 'h', ctrl: true, action: 'open-history' },
  { key: 'j', ctrl: true, action: 'open-downloads' },
  { key: 'f', ctrl: true, action: 'find-in-page' },
  { key: 'r', ctrl: true, shift: true, action: 'hard-reload' },
  { key: 'r', ctrl: true, action: 'reload' },
  { key: 'F5', action: 'reload' },
  { key: 'F11', action: 'fullscreen' },
  { key: 'F12', action: 'devtools' },
  { key: 'i', ctrl: true, shift: true, action: 'devtools' },
  { key: 'ArrowLeft', alt: true, action: 'go-back' },
  { key: 'ArrowRight', alt: true, action: 'go-forward' },
  { key: '+', ctrl: true, action: 'zoom-in' },
  { key: '-', ctrl: true, action: 'zoom-out' },
  { key: '0', ctrl: true, action: 'zoom-reset' },
] as const;

export class KeyboardShortcuts {
  private readonly bindings: readonly ShortcutBinding[];

  constructor() {
    this.bindings = DEFAULT_BINDINGS;
  }

  match(key: string, modifiers: Modifiers): string | null {
    const found = this.bindings.find((b) => this.bindingMatches(b, key, modifiers));
    return found?.action ?? null;
  }

  getBindings(): readonly ShortcutBinding[] {
    return this.bindings;
  }

  private bindingMatches(binding: ShortcutBinding, key: string, modifiers: Modifiers): boolean {
    if (binding.key !== key) return false;
    return (
      Boolean(binding.ctrl) === Boolean(modifiers.ctrl) &&
      Boolean(binding.shift) === Boolean(modifiers.shift) &&
      Boolean(binding.alt) === Boolean(modifiers.alt)
    );
  }
}
