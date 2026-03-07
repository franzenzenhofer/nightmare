import { join } from 'path';
import { homedir } from 'os';
import { JsonStorage } from './storage';

export interface Settings {
  homePage: string;
  searchEngine: string;
  downloadsPath: string;
  theme: string;
  bookmarksBarVisible: boolean;
  apiPort: number;
}

const DEFAULT_SETTINGS: Settings = {
  homePage: 'nightmare://newtab',
  searchEngine: 'google',
  downloadsPath: join(homedir(), 'Downloads'),
  theme: 'dark',
  bookmarksBarVisible: true,
  apiPort: 6660,
};

export class SettingsManager {
  private readonly storage: JsonStorage<Partial<Settings>>;

  constructor(storageDir: string) {
    this.storage = new JsonStorage(join(storageDir, 'settings.json'));
  }

  get<K extends keyof Settings>(key: K): Settings[K] {
    const saved = this.storage.load({});
    const value = saved[key];
    if (value !== undefined) return value as Settings[K];
    return DEFAULT_SETTINGS[key];
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    const saved = this.storage.load({});
    saved[key] = value;
    this.storage.save(saved);
  }

  getAll(): Settings {
    const saved = this.storage.load({});
    return { ...DEFAULT_SETTINGS, ...saved };
  }
}
