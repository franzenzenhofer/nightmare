export interface KeyCombo {
  readonly key: string;
  readonly ctrl: boolean;
  readonly shift: boolean;
  readonly alt: boolean;
  readonly meta: boolean;
}

export interface ShortcutRegistration {
  readonly id: string;
  readonly combo: KeyCombo;
  readonly action: string;
  readonly enabled: boolean;
}

type ShortcutHandler = () => void;

interface InternalEntry {
  readonly registration: ShortcutRegistration;
  readonly handler: ShortcutHandler;
}

const KEY_ALIASES: ReadonlyMap<string, string> = new Map([
  ['ctrl', 'Ctrl'], ['CTRL', 'Ctrl'], ['shift', 'Shift'], ['SHIFT', 'Shift'],
  ['alt', 'Alt'], ['ALT', 'Alt'], ['meta', 'Meta'], ['META', 'Meta'],
  ['cmd', 'Meta'], ['Cmd', 'Meta'], ['CMD', 'Meta'],
  ['command', 'Meta'], ['Command', 'Meta'], ['COMMAND', 'Meta'],
  ['Left', 'ArrowLeft'], ['Right', 'ArrowRight'],
  ['Up', 'ArrowUp'], ['Down', 'ArrowDown'],
]);

export function normalizeKeyName(name: string): string {
  return KEY_ALIASES.get(name) ?? name;
}

export function parseKeyCombo(combo: string): KeyCombo {
  if (combo === '') throw new Error('Key combo string must not be empty');
  const parts = combo.split('+').map(normalizeKeyName);
  let ctrl = false;
  let shift = false;
  let alt = false;
  let meta = false;
  let key = '';

  for (const part of parts) {
    if (part === 'Ctrl') { ctrl = true; continue; }
    if (part === 'Shift') { shift = true; continue; }
    if (part === 'Alt') { alt = true; continue; }
    if (part === 'Meta') { meta = true; continue; }
    key = part;
  }
  return { key, ctrl, shift, alt, meta };
}

function combosMatch(a: KeyCombo, b: KeyCombo): boolean {
  return a.key === b.key
    && a.ctrl === b.ctrl
    && a.shift === b.shift
    && a.alt === b.alt
    && a.meta === b.meta;
}

let nextId = 0;
function generateId(): string {
  nextId += 1;
  return `shortcut-${String(nextId)}`;
}

export class KeyboardShortcuts {
  private readonly entries: Map<string, InternalEntry> = new Map();
  private globalEnabled = true;

  register(comboStr: string, action: string, handler: ShortcutHandler): ShortcutRegistration {
    const combo = parseKeyCombo(comboStr);
    if (this.findByCombo(combo) !== undefined) {
      throw new Error(`Shortcut conflict: ${comboStr} is already registered`);
    }
    const id = generateId();
    const registration: ShortcutRegistration = { id, combo, action, enabled: true };
    this.entries.set(id, { registration, handler });
    return registration;
  }

  unregister(id: string): boolean {
    return this.entries.delete(id);
  }

  handleKeyEvent(event: KeyCombo): boolean {
    if (!this.globalEnabled) return false;
    for (const entry of this.entries.values()) {
      if (!entry.registration.enabled) continue;
      if (combosMatch(entry.registration.combo, event)) {
        entry.handler();
        return true;
      }
    }
    return false;
  }

  disableShortcut(id: string): boolean {
    return this.setShortcutEnabled(id, false);
  }

  enableShortcut(id: string): boolean {
    return this.setShortcutEnabled(id, true);
  }

  disableAll(): void {
    this.globalEnabled = false;
  }

  enableAll(): void {
    this.globalEnabled = true;
  }

  isEnabled(): boolean {
    return this.globalEnabled;
  }

  getAll(): readonly ShortcutRegistration[] {
    return [...this.entries.values()].map((e) => e.registration);
  }

  hasConflict(comboStr: string): boolean {
    const combo = parseKeyCombo(comboStr);
    return this.findByCombo(combo) !== undefined;
  }

  private findByCombo(combo: KeyCombo): InternalEntry | undefined {
    for (const entry of this.entries.values()) {
      if (combosMatch(entry.registration.combo, combo)) return entry;
    }
    return undefined;
  }

  private setShortcutEnabled(id: string, enabled: boolean): boolean {
    const entry = this.entries.get(id);
    if (entry === undefined) return false;
    const updated: InternalEntry = {
      registration: { ...entry.registration, enabled },
      handler: entry.handler,
    };
    this.entries.set(id, updated);
    return true;
  }
}
