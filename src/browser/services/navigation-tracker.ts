export type BackAction =
  | { readonly type: 'in-page' }
  | { readonly type: 'cross-tab'; readonly openerId: string }
  | { readonly type: 'none' };

export type ForwardAction =
  | { readonly type: 'in-page' }
  | { readonly type: 'none' };

interface TabNavState {
  depth: number;
  forwardDepth: number;
  readonly openerId: string | null;
}

const NONE_ACTION: BackAction = { type: 'none' } as const;
const IN_PAGE_BACK: BackAction = { type: 'in-page' } as const;
const IN_PAGE_FORWARD: ForwardAction = { type: 'in-page' } as const;
const NONE_FORWARD: ForwardAction = { type: 'none' } as const;

export class NavigationTracker {
  private readonly states = new Map<string, TabNavState>();

  trackTab(tabId: string, openerId?: string): void {
    this.states.set(tabId, {
      depth: 0,
      forwardDepth: 0,
      openerId: openerId ?? null,
    });
  }

  recordNavigation(tabId: string): void {
    const state = this.states.get(tabId);
    if (!state) return;
    state.depth++;
    state.forwardDepth = 0;
  }

  recordBack(tabId: string): void {
    const state = this.states.get(tabId);
    if (!state || state.depth <= 0) return;
    state.depth--;
    state.forwardDepth++;
  }

  recordForward(tabId: string): void {
    const state = this.states.get(tabId);
    if (!state || state.forwardDepth <= 0) return;
    state.depth++;
    state.forwardDepth--;
  }

  resetNavigation(tabId: string): void {
    const state = this.states.get(tabId);
    if (!state) return;
    state.depth = 0;
    state.forwardDepth = 0;
  }

  removeTab(tabId: string): void {
    this.states.delete(tabId);
  }

  getBackAction(tabId: string): BackAction {
    const state = this.states.get(tabId);
    if (!state) return NONE_ACTION;
    if (state.depth > 0) return IN_PAGE_BACK;
    if (state.openerId !== null && this.states.has(state.openerId)) {
      return { type: 'cross-tab', openerId: state.openerId };
    }
    return NONE_ACTION;
  }

  getForwardAction(tabId: string): ForwardAction {
    const state = this.states.get(tabId);
    if (!state || state.forwardDepth <= 0) return NONE_FORWARD;
    return IN_PAGE_FORWARD;
  }

  canGoBack(tabId: string): boolean {
    return this.getBackAction(tabId).type !== 'none';
  }

  canGoForward(tabId: string): boolean {
    return this.getForwardAction(tabId).type !== 'none';
  }
}
