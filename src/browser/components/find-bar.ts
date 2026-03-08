export interface FindState {
  readonly query: string;
  readonly currentMatch: number;
  readonly totalMatches: number;
  readonly isOpen: boolean;
}

export class FindBarLogic {
  private query = '';
  private currentMatch = 0;
  private totalMatches = 0;
  private isOpen = false;

  open(): void {
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
    this.query = '';
    this.currentMatch = 0;
    this.totalMatches = 0;
  }

  setQuery(query: string): void {
    this.query = query;
    this.currentMatch = 0;
    this.totalMatches = 0;
  }

  setMatches(total: number): void {
    this.totalMatches = total;
    if (total === 0) {
      this.currentMatch = 0;
    }
  }

  nextMatch(): void {
    if (this.totalMatches === 0) return;
    this.currentMatch = (this.currentMatch + 1) % this.totalMatches;
  }

  prevMatch(): void {
    if (this.totalMatches === 0) return;
    this.currentMatch =
      (this.currentMatch - 1 + this.totalMatches) % this.totalMatches;
  }

  getState(): FindState {
    return {
      query: this.query,
      currentMatch: this.currentMatch,
      totalMatches: this.totalMatches,
      isOpen: this.isOpen,
    };
  }
}
