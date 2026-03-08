import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export class JsonStorage<T> {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  load(defaultValue: T): T {
    try {
      const raw = readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  save(data: T): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
