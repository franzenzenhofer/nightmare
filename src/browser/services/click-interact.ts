export type InteractionType = 'click' | 'type' | 'select' | 'focus' | 'scroll';
export type MouseButton = 'left' | 'right' | 'middle';

export interface ClickOptions {
  readonly button: MouseButton;
  readonly clickCount: number;
}

export interface TypeOptions {
  readonly clearFirst: boolean;
  readonly delay: number;
}

interface ClickRequest {
  readonly type: 'click';
  readonly selector: string;
  readonly options: ClickOptions;
}

interface TypeRequest {
  readonly type: 'type';
  readonly selector: string;
  readonly text: string;
  readonly options: TypeOptions;
}

interface SelectRequest {
  readonly type: 'select';
  readonly selector: string;
  readonly value: string;
}

interface FocusRequest {
  readonly type: 'focus';
  readonly selector: string;
}

interface ScrollRequest {
  readonly type: 'scroll';
  readonly selector: string;
  readonly scrollX: number;
  readonly scrollY: number;
}

export type InteractionRequest =
  | ClickRequest
  | TypeRequest
  | SelectRequest
  | FocusRequest
  | ScrollRequest;

export interface InteractionResult {
  readonly type: InteractionType;
  readonly selector: string;
  readonly success: boolean;
  readonly error?: string;
  readonly timestamp: number;
}

interface RecordInput {
  readonly type: InteractionType;
  readonly selector: string;
  readonly success: boolean;
  readonly error?: string;
}

const INVALID_SELECTOR_PATTERN = /[{}]|^\d/;
const MAX_HISTORY = 1000;
const MAX_CLICK_COUNT = 3;
const MAX_TYPE_DELAY = 1000;

function assertSelectorNotEmpty(selector: string): void {
  if (selector === '') {
    throw new Error('Selector must not be empty');
  }
}

export function buildClickRequest(
  selector: string,
  options?: Partial<ClickOptions>,
): ClickRequest {
  assertSelectorNotEmpty(selector);
  const clickCount = Math.max(1, Math.min(MAX_CLICK_COUNT, options?.clickCount ?? 1));
  return {
    type: 'click',
    selector,
    options: { button: options?.button ?? 'left', clickCount },
  };
}

export function buildTypeRequest(
  selector: string,
  text: string,
  options?: Partial<TypeOptions>,
): TypeRequest {
  assertSelectorNotEmpty(selector);
  const delay = Math.max(0, Math.min(MAX_TYPE_DELAY, options?.delay ?? 0));
  return {
    type: 'type',
    selector,
    text,
    options: { clearFirst: options?.clearFirst ?? false, delay },
  };
}

export function buildSelectRequest(
  selector: string,
  value: string,
): SelectRequest {
  assertSelectorNotEmpty(selector);
  return { type: 'select', selector, value };
}

export function buildFocusRequest(selector: string): FocusRequest {
  assertSelectorNotEmpty(selector);
  return { type: 'focus', selector };
}

export function buildScrollRequest(
  selector: string,
  scrollX = 0,
  scrollY = 0,
): ScrollRequest {
  assertSelectorNotEmpty(selector);
  return { type: 'scroll', selector, scrollX, scrollY };
}

export function validateSelector(selector: string): boolean {
  const trimmed = selector.trim();
  if (trimmed === '') return false;
  return !INVALID_SELECTOR_PATTERN.test(trimmed);
}

export class InteractionService {
  private readonly history: InteractionResult[] = [];

  recordInteraction(input: RecordInput): InteractionResult {
    const base = {
      type: input.type,
      selector: input.selector,
      success: input.success,
      timestamp: Date.now(),
    };
    const result: InteractionResult =
      input.error !== undefined
        ? { ...base, error: input.error }
        : base;
    this.history.push(result);
    if (this.history.length > MAX_HISTORY) {
      this.history.splice(0, this.history.length - MAX_HISTORY);
    }
    return result;
  }

  getHistory(): readonly InteractionResult[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history.length = 0;
  }

  getLastInteraction(): InteractionResult | undefined {
    return this.history[this.history.length - 1];
  }

  getStatsByType(): ReadonlyMap<InteractionType, number> {
    const counts = new Map<InteractionType, number>();
    for (const entry of this.history) {
      counts.set(entry.type, (counts.get(entry.type) ?? 0) + 1);
    }
    return counts;
  }
}
