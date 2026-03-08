import { join } from 'path';
import { JsonStorage } from './storage';

export interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: number;
  visitCount: number;
  sequence: number;
}

let globalSequence = 0;

export class HistoryManager {
  private readonly storage: JsonStorage<HistoryEntry[]>;
  private readonly maxEntries: number;

  constructor(storageDir: string, maxEntries: number = 10000) {
    this.maxEntries = maxEntries;
    this.storage = new JsonStorage(join(storageDir, 'history.json'));
    const entries = this.load();
    const maxSeq = entries.reduce((max, e) => Math.max(max, e.sequence), 0);
    if (maxSeq > globalSequence) {
      globalSequence = maxSeq;
    }
  }

  addVisit(url: string, title: string): void {
    const entries = this.load();
    globalSequence += 1;
    const existing = entries.find((e) => e.url === url);

    if (existing) {
      existing.title = title;
      existing.visitedAt = Date.now();
      existing.visitCount += 1;
      existing.sequence = globalSequence;
    } else {
      entries.push({ url, title, visitedAt: Date.now(), visitCount: 1, sequence: globalSequence });
    }

    this.save(this.trimEntries(entries));
  }

  search(query: string): HistoryEntry[] {
    const lower = query.toLowerCase();
    return this.load().filter(
      (e) => e.url.toLowerCase().includes(lower) || e.title.toLowerCase().includes(lower),
    );
  }

  getRecent(limit: number): HistoryEntry[] {
    return this.load()
      .sort((a, b) => b.sequence - a.sequence)
      .slice(0, limit);
  }

  getMostVisited(limit: number): HistoryEntry[] {
    return this.load()
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit);
  }

  clearAll(): void {
    this.save([]);
  }

  clearRange(from: number, to: number): void {
    const entries = this.load().filter((e) => e.visitedAt < from || e.visitedAt >= to);
    this.save(entries);
  }

  private load(): HistoryEntry[] {
    return this.storage.load([]);
  }

  private save(entries: HistoryEntry[]): void {
    this.storage.save(entries);
  }

  private trimEntries(entries: HistoryEntry[]): HistoryEntry[] {
    if (entries.length <= this.maxEntries) return entries;
    return entries.sort((a, b) => b.sequence - a.sequence).slice(0, this.maxEntries);
  }
}
