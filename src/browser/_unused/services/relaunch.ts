export class RelaunchManager {
  private pending = false;
  private reason: string | null = null;
  private count = 0;

  requestRelaunch(reason?: string): void {
    this.pending = true;
    this.reason = reason ?? 'user-requested';
  }

  cancelRelaunch(): void {
    this.pending = false;
    this.reason = null;
  }

  confirmRelaunch(): boolean {
    if (!this.pending) return false;
    this.pending = false;
    this.reason = null;
    this.count += 1;
    return true;
  }

  isPending(): boolean {
    return this.pending;
  }

  getReason(): string | null {
    return this.reason;
  }

  getRelaunchCount(): number {
    return this.count;
  }
}
