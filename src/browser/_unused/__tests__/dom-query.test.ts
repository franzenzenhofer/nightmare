import { describe, it, expect, beforeEach } from 'vitest';
import {
  DomQueryService,
  buildQueryRequest,
  validateSelector,
  createElementInfo,
  filterByVisibility,
  filterByTagName,
  filterByAttribute,
} from '../services/dom-query';
import type {
  QueryType,
  QueryResult,
  ElementInfo,
  QueryRequest,
  RawElementData,
} from '../services/dom-query';

describe('buildQueryRequest', () => {
  it('builds a single query request from a CSS selector', () => {
    const req = buildQueryRequest('#main', 'single');
    expect(req.selector).toBe('#main');
    expect(req.type).toBe('single');
  });

  it('builds an all query request', () => {
    const req = buildQueryRequest('.item', 'all');
    expect(req.type).toBe('all');
  });

  it('builds a text query request', () => {
    const req = buildQueryRequest('h1', 'text');
    expect(req.type).toBe('text');
  });

  it('builds an attr query request with attributeName', () => {
    const req = buildQueryRequest('a', 'attr', 'href');
    expect(req.type).toBe('attr');
    expect(req.attributeName).toBe('href');
  });

  it('throws for empty selector', () => {
    expect(() => buildQueryRequest('', 'single')).toThrow(
      'Selector must not be empty',
    );
  });
});

describe('validateSelector', () => {
  it('accepts a simple tag selector', () => {
    expect(validateSelector('div')).toBe(true);
  });

  it('accepts an ID selector', () => {
    expect(validateSelector('#main')).toBe(true);
  });

  it('accepts a class selector', () => {
    expect(validateSelector('.container')).toBe(true);
  });

  it('accepts an attribute selector', () => {
    expect(validateSelector('[data-id]')).toBe(true);
  });

  it('accepts a compound selector', () => {
    expect(validateSelector('div.main > p.text')).toBe(true);
  });

  it('accepts pseudo-class selectors', () => {
    expect(validateSelector('a:hover')).toBe(true);
  });

  it('accepts comma-separated selectors', () => {
    expect(validateSelector('h1, h2, h3')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateSelector('')).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(validateSelector('   ')).toBe(false);
  });

  it('rejects string with only special chars that are invalid', () => {
    expect(validateSelector('{')).toBe(false);
  });

  it('rejects curly braces', () => {
    expect(validateSelector('div { color: red }')).toBe(false);
  });

  it('rejects selectors starting with a number', () => {
    expect(validateSelector('123abc')).toBe(false);
  });
});

describe('createElementInfo', () => {
  it('creates element info from raw data', () => {
    const raw: RawElementData = {
      tagName: 'DIV',
      textContent: 'Hello',
      attributes: { class: 'main', id: 'root' },
      visible: true,
    };
    const info = createElementInfo(raw);
    expect(info.tagName).toBe('DIV');
    expect(info.textContent).toBe('Hello');
    expect(info.visible).toBe(true);
    expect(info.attributes.get('class')).toBe('main');
    expect(info.attributes.get('id')).toBe('root');
  });

  it('handles empty attributes', () => {
    const raw: RawElementData = {
      tagName: 'SPAN',
      textContent: '',
      attributes: {},
      visible: false,
    };
    const info = createElementInfo(raw);
    expect(info.attributes.size).toBe(0);
    expect(info.visible).toBe(false);
  });

  it('normalizes tag name to uppercase', () => {
    const raw: RawElementData = {
      tagName: 'div',
      textContent: '',
      attributes: {},
      visible: true,
    };
    const info = createElementInfo(raw);
    expect(info.tagName).toBe('DIV');
  });
});

describe('DomQueryService', () => {
  let service: DomQueryService;

  beforeEach(() => {
    service = new DomQueryService();
  });

  describe('createResult', () => {
    it('creates a query result from elements', () => {
      const elements: readonly ElementInfo[] = [
        {
          tagName: 'DIV',
          textContent: 'Hello',
          attributes: new Map([['class', 'main']]),
          visible: true,
        },
        {
          tagName: 'SPAN',
          textContent: 'World',
          attributes: new Map(),
          visible: false,
        },
      ];
      const result = service.createResult('#app', elements);
      expect(result.selector).toBe('#app');
      expect(result.matchCount).toBe(2);
      expect(result.elements).toHaveLength(2);
    });

    it('creates empty result when no elements match', () => {
      const result = service.createResult('.missing', []);
      expect(result.matchCount).toBe(0);
      expect(result.elements).toEqual([]);
    });

    it('preserves element order', () => {
      const first: ElementInfo = {
        tagName: 'H1',
        textContent: 'First',
        attributes: new Map(),
        visible: true,
      };
      const second: ElementInfo = {
        tagName: 'H2',
        textContent: 'Second',
        attributes: new Map(),
        visible: true,
      };
      const result = service.createResult('h1, h2', [first, second]);
      expect(result.elements[0]?.tagName).toBe('H1');
      expect(result.elements[1]?.tagName).toBe('H2');
    });
  });

  describe('createResultFromRaw', () => {
    it('creates a query result from raw element data', () => {
      const rawElements: readonly RawElementData[] = [
        {
          tagName: 'A',
          textContent: 'Click me',
          attributes: { href: 'https://example.com' },
          visible: true,
        },
      ];
      const result = service.createResultFromRaw('a', rawElements);
      expect(result.selector).toBe('a');
      expect(result.matchCount).toBe(1);
      expect(result.elements[0]?.tagName).toBe('A');
      expect(result.elements[0]?.attributes.get('href')).toBe(
        'https://example.com',
      );
    });

    it('handles multiple raw elements', () => {
      const rawElements: readonly RawElementData[] = [
        {
          tagName: 'LI',
          textContent: 'Item 1',
          attributes: {},
          visible: true,
        },
        {
          tagName: 'LI',
          textContent: 'Item 2',
          attributes: {},
          visible: true,
        },
        {
          tagName: 'LI',
          textContent: 'Item 3',
          attributes: {},
          visible: false,
        },
      ];
      const result = service.createResultFromRaw('li', rawElements);
      expect(result.matchCount).toBe(3);
    });
  });
});

describe('filterByVisibility', () => {
  const elements: readonly ElementInfo[] = [
    {
      tagName: 'DIV',
      textContent: 'Visible',
      attributes: new Map(),
      visible: true,
    },
    {
      tagName: 'SPAN',
      textContent: 'Hidden',
      attributes: new Map(),
      visible: false,
    },
    {
      tagName: 'P',
      textContent: 'Also visible',
      attributes: new Map(),
      visible: true,
    },
  ];

  it('filters to only visible elements', () => {
    const visible = filterByVisibility(elements, true);
    expect(visible).toHaveLength(2);
    expect(visible.every((e) => e.visible)).toBe(true);
  });

  it('filters to only hidden elements', () => {
    const hidden = filterByVisibility(elements, false);
    expect(hidden).toHaveLength(1);
    expect(hidden[0]?.textContent).toBe('Hidden');
  });

  it('returns empty array when no elements match', () => {
    const allVisible: readonly ElementInfo[] = [
      {
        tagName: 'DIV',
        textContent: '',
        attributes: new Map(),
        visible: true,
      },
    ];
    expect(filterByVisibility(allVisible, false)).toEqual([]);
  });
});

describe('filterByTagName', () => {
  const elements: readonly ElementInfo[] = [
    {
      tagName: 'DIV',
      textContent: 'A',
      attributes: new Map(),
      visible: true,
    },
    {
      tagName: 'SPAN',
      textContent: 'B',
      attributes: new Map(),
      visible: true,
    },
    {
      tagName: 'DIV',
      textContent: 'C',
      attributes: new Map(),
      visible: true,
    },
  ];

  it('filters by exact tag name', () => {
    const divs = filterByTagName(elements, 'DIV');
    expect(divs).toHaveLength(2);
  });

  it('is case-insensitive', () => {
    const divs = filterByTagName(elements, 'div');
    expect(divs).toHaveLength(2);
  });

  it('returns empty array for non-matching tag', () => {
    expect(filterByTagName(elements, 'P')).toEqual([]);
  });
});

describe('filterByAttribute', () => {
  const elements: readonly ElementInfo[] = [
    {
      tagName: 'A',
      textContent: 'Link 1',
      attributes: new Map([['href', 'https://a.com']]),
      visible: true,
    },
    {
      tagName: 'A',
      textContent: 'Link 2',
      attributes: new Map([['href', 'https://b.com']]),
      visible: true,
    },
    {
      tagName: 'A',
      textContent: 'Link 3',
      attributes: new Map([['class', 'nav']]),
      visible: true,
    },
  ];

  it('filters elements that have a specific attribute', () => {
    const withHref = filterByAttribute(elements, 'href');
    expect(withHref).toHaveLength(2);
  });

  it('filters elements by attribute name and value', () => {
    const exact = filterByAttribute(elements, 'href', 'https://a.com');
    expect(exact).toHaveLength(1);
    expect(exact[0]?.textContent).toBe('Link 1');
  });

  it('returns empty when no elements have the attribute', () => {
    expect(filterByAttribute(elements, 'data-id')).toEqual([]);
  });

  it('returns empty when attribute value does not match', () => {
    expect(filterByAttribute(elements, 'href', 'https://c.com')).toEqual([]);
  });
});
