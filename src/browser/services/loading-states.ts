export type LoadingStatus = 'idle' | 'loading' | 'complete' | 'error';

export interface LoadingState {
  readonly tabId: string;
  readonly status: LoadingStatus;
  readonly progress: number;
  readonly startedAt: number | null;
  readonly completedAt: number | null;
  readonly error: string | null;
}

const PROGRESS_MIN = 0;
const PROGRESS_MAX = 100;

function clampProgress(value: number): number {
  return Math.min(PROGRESS_MAX, Math.max(PROGRESS_MIN, value));
}

function createIdleState(tabId: string): LoadingState {
  return {
    tabId,
    status: 'idle',
    progress: PROGRESS_MIN,
    startedAt: null,
    completedAt: null,
    error: null,
  };
}

export class LoadingStateManager {
  private readonly states: Map<string, LoadingState> = new Map();

  getState(tabId: string): LoadingState {
    return this.states.get(tabId) ?? createIdleState(tabId);
  }

  startLoading(tabId: string): LoadingState {
    const state: LoadingState = {
      tabId,
      status: 'loading',
      progress: PROGRESS_MIN,
      startedAt: Date.now(),
      completedAt: null,
      error: null,
    };
    this.states.set(tabId, state);
    return state;
  }

  setProgress(tabId: string, progress: number): LoadingState {
    const current = this.getState(tabId);
    const state: LoadingState = {
      ...current,
      tabId,
      progress: clampProgress(progress),
    };
    this.states.set(tabId, state);
    return state;
  }

  setComplete(tabId: string): LoadingState {
    const current = this.getState(tabId);
    const state: LoadingState = {
      ...current,
      tabId,
      status: 'complete',
      progress: PROGRESS_MAX,
      completedAt: Date.now(),
    };
    this.states.set(tabId, state);
    return state;
  }

  setError(tabId: string, error: string): LoadingState {
    const current = this.getState(tabId);
    const state: LoadingState = {
      ...current,
      tabId,
      status: 'error',
      error,
      completedAt: Date.now(),
    };
    this.states.set(tabId, state);
    return state;
  }

  getLoadingTabs(): LoadingState[] {
    return [...this.states.values()].filter(
      (s) => s.status === 'loading',
    );
  }

  isAnyLoading(): boolean {
    for (const state of this.states.values()) {
      if (state.status === 'loading') {
        return true;
      }
    }
    return false;
  }

  resetState(tabId: string): void {
    this.states.delete(tabId);
  }

  getDuration(tabId: string): number | null {
    const state = this.states.get(tabId);
    if (state?.startedAt === null || state?.startedAt === undefined) {
      return null;
    }
    if (state.completedAt === null) {
      return null;
    }
    return state.completedAt - state.startedAt;
  }
}
