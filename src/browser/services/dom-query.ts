export type QueryType = 'single' | 'all' | 'text' | 'attr';

export interface ElementInfo {
  readonly tagName: string;
  readonly textContent: string;
  readonly attributes: ReadonlyMap<string, string>;
  readonly visible: boolean;
}

export interface QueryResult {
  readonly selector: string;
  readonly matchCount: number;
  readonly elements: readonly ElementInfo[];
}

export interface QueryRequest {
  readonly selector: string;
  readonly type: QueryType;
  readonly attributeName?: string;
}

export interface RawElementData {
  readonly tagName: string;
  readonly textContent: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly visible: boolean;
}

const INVALID_SELECTOR_PATTERN = /[{}]|^\d/;

export function buildQueryRequest(
  selector: string,
  type: QueryType,
  attributeName?: string,
): QueryRequest {
  if (selector === '') {
    throw new Error('Selector must not be empty');
  }
  return attributeName !== undefined
    ? { selector, type, attributeName }
    : { selector, type };
}

export function validateSelector(selector: string): boolean {
  const trimmed = selector.trim();
  if (trimmed === '') {
    return false;
  }
  return !INVALID_SELECTOR_PATTERN.test(trimmed);
}

export function createElementInfo(raw: RawElementData): ElementInfo {
  const attrs = new Map<string, string>(Object.entries(raw.attributes));
  return {
    tagName: raw.tagName.toUpperCase(),
    textContent: raw.textContent,
    attributes: attrs,
    visible: raw.visible,
  };
}

export function filterByVisibility(
  elements: readonly ElementInfo[],
  visible: boolean,
): readonly ElementInfo[] {
  return elements.filter((e) => e.visible === visible);
}

export function filterByTagName(
  elements: readonly ElementInfo[],
  tagName: string,
): readonly ElementInfo[] {
  const upper = tagName.toUpperCase();
  return elements.filter((e) => e.tagName === upper);
}

export function filterByAttribute(
  elements: readonly ElementInfo[],
  name: string,
  value?: string,
): readonly ElementInfo[] {
  return elements.filter((e) => {
    const attrVal = e.attributes.get(name);
    if (attrVal === undefined) {
      return false;
    }
    return value === undefined ? true : attrVal === value;
  });
}

export class DomQueryService {
  createResult(
    selector: string,
    elements: readonly ElementInfo[],
  ): QueryResult {
    return {
      selector,
      matchCount: elements.length,
      elements: [...elements],
    };
  }

  createResultFromRaw(
    selector: string,
    rawElements: readonly RawElementData[],
  ): QueryResult {
    const elements = rawElements.map(createElementInfo);
    return this.createResult(selector, elements);
  }
}
