import { describe, it, expect } from 'vitest';
import {
  generateCspDirectives,
  buildCspHeader,
  validateDirectiveValue,
  applyOverrides,
  CSP_DIRECTIVE_NAMES,
} from '../services/csp';
import type { CspDirectives } from '../services/csp';

describe('generateCspDirectives', () => {
  describe('LOCAL zone', () => {
    it('allows unsafe-inline in script-src', () => {
      const directives = generateCspDirectives('LOCAL');
      expect(directives['script-src']).toContain("'unsafe-inline'");
    });

    it('allows unsafe-eval in script-src', () => {
      const directives = generateCspDirectives('LOCAL');
      expect(directives['script-src']).toContain("'unsafe-eval'");
    });

    it('allows unsafe-inline in style-src', () => {
      const directives = generateCspDirectives('LOCAL');
      expect(directives['style-src']).toContain("'unsafe-inline'");
    });

    it('sets default-src to wildcard', () => {
      const directives = generateCspDirectives('LOCAL');
      expect(directives['default-src']).toContain('*');
    });

    it('allows all image sources', () => {
      const directives = generateCspDirectives('LOCAL');
      expect(directives['img-src']).toContain('*');
    });

    it('allows all connect sources', () => {
      const directives = generateCspDirectives('LOCAL');
      expect(directives['connect-src']).toContain('*');
    });

    it('allows all frame sources', () => {
      const directives = generateCspDirectives('LOCAL');
      expect(directives['frame-src']).toContain('*');
    });

    it('includes file: in script-src', () => {
      const directives = generateCspDirectives('LOCAL');
      expect(directives['script-src']).toContain('file:');
    });

    it('includes data: in img-src', () => {
      const directives = generateCspDirectives('LOCAL');
      expect(directives['img-src']).toContain('data:');
    });

    it('includes blob: in connect-src', () => {
      const directives = generateCspDirectives('LOCAL');
      expect(directives['connect-src']).toContain('blob:');
    });
  });

  describe('LOCALHOST zone', () => {
    it('allows unsafe-inline in script-src', () => {
      const directives = generateCspDirectives('LOCALHOST');
      expect(directives['script-src']).toContain("'unsafe-inline'");
    });

    it('allows unsafe-eval in script-src', () => {
      const directives = generateCspDirectives('LOCALHOST');
      expect(directives['script-src']).toContain("'unsafe-eval'");
    });

    it('allows unsafe-inline in style-src', () => {
      const directives = generateCspDirectives('LOCALHOST');
      expect(directives['style-src']).toContain("'unsafe-inline'");
    });

    it('restricts default-src to self and localhost', () => {
      const directives = generateCspDirectives('LOCALHOST');
      expect(directives['default-src']).toContain("'self'");
      expect(directives['default-src']).toContain('http://localhost:*');
      expect(directives['default-src']).toContain('http://127.0.0.1:*');
    });

    it('allows localhost connect sources', () => {
      const directives = generateCspDirectives('LOCALHOST');
      expect(directives['connect-src']).toContain('http://localhost:*');
      expect(directives['connect-src']).toContain('ws://localhost:*');
    });

    it('allows websocket connections to localhost', () => {
      const directives = generateCspDirectives('LOCALHOST');
      expect(directives['connect-src']).toContain('ws://localhost:*');
      expect(directives['connect-src']).toContain('ws://127.0.0.1:*');
    });

    it('does not allow wildcard in default-src', () => {
      const directives = generateCspDirectives('LOCALHOST');
      expect(directives['default-src']).not.toContain('*');
    });

    it('allows data: in img-src', () => {
      const directives = generateCspDirectives('LOCALHOST');
      expect(directives['img-src']).toContain('data:');
    });

    it('allows blob: in connect-src', () => {
      const directives = generateCspDirectives('LOCALHOST');
      expect(directives['connect-src']).toContain('blob:');
    });
  });

  describe('WEB zone', () => {
    it('does not allow unsafe-inline in script-src', () => {
      const directives = generateCspDirectives('WEB');
      expect(directives['script-src']).not.toContain("'unsafe-inline'");
    });

    it('does not allow unsafe-eval in script-src', () => {
      const directives = generateCspDirectives('WEB');
      expect(directives['script-src']).not.toContain("'unsafe-eval'");
    });

    it('restricts default-src to self', () => {
      const directives = generateCspDirectives('WEB');
      expect(directives['default-src']).toEqual(["'self'"]);
    });

    it('restricts script-src to self', () => {
      const directives = generateCspDirectives('WEB');
      expect(directives['script-src']).toEqual(["'self'"]);
    });

    it('allows unsafe-inline in style-src for compatibility', () => {
      const directives = generateCspDirectives('WEB');
      expect(directives['style-src']).toContain("'self'");
      expect(directives['style-src']).toContain("'unsafe-inline'");
    });

    it('restricts img-src to self and data and https', () => {
      const directives = generateCspDirectives('WEB');
      expect(directives['img-src']).toContain("'self'");
      expect(directives['img-src']).toContain('data:');
      expect(directives['img-src']).toContain('https:');
    });

    it('restricts connect-src to self', () => {
      const directives = generateCspDirectives('WEB');
      expect(directives['connect-src']).toEqual(["'self'"]);
    });

    it('restricts frame-src to self', () => {
      const directives = generateCspDirectives('WEB');
      expect(directives['frame-src']).toEqual(["'self'"]);
    });

    it('does not allow wildcard in any directive', () => {
      const directives = generateCspDirectives('WEB');
      for (const key of CSP_DIRECTIVE_NAMES) {
        expect(directives[key]).not.toContain('*');
      }
    });

    it('does not allow file: protocol', () => {
      const directives = generateCspDirectives('WEB');
      for (const key of CSP_DIRECTIVE_NAMES) {
        expect(directives[key]).not.toContain('file:');
      }
    });
  });

  describe('returns all required directive keys', () => {
    it('includes all six directive keys for LOCAL', () => {
      const directives = generateCspDirectives('LOCAL');
      for (const key of CSP_DIRECTIVE_NAMES) {
        expect(directives[key]).toBeDefined();
        expect(directives[key].length).toBeGreaterThan(0);
      }
    });

    it('includes all six directive keys for LOCALHOST', () => {
      const directives = generateCspDirectives('LOCALHOST');
      for (const key of CSP_DIRECTIVE_NAMES) {
        expect(directives[key]).toBeDefined();
        expect(directives[key].length).toBeGreaterThan(0);
      }
    });

    it('includes all six directive keys for WEB', () => {
      const directives = generateCspDirectives('WEB');
      for (const key of CSP_DIRECTIVE_NAMES) {
        expect(directives[key]).toBeDefined();
        expect(directives[key].length).toBeGreaterThan(0);
      }
    });
  });
});

describe('buildCspHeader', () => {
  it('produces a string with semicolon-separated directives', () => {
    const directives = generateCspDirectives('WEB');
    const header = buildCspHeader(directives);
    expect(header).toContain(';');
  });

  it('includes all directive names in the header', () => {
    const directives = generateCspDirectives('WEB');
    const header = buildCspHeader(directives);
    for (const key of CSP_DIRECTIVE_NAMES) {
      expect(header).toContain(key);
    }
  });

  it('formats directive as name followed by values', () => {
    const directives = generateCspDirectives('WEB');
    const header = buildCspHeader(directives);
    expect(header).toContain("default-src 'self'");
  });

  it('joins multiple values with spaces', () => {
    const directives = generateCspDirectives('WEB');
    const header = buildCspHeader(directives);
    expect(header).toContain("style-src 'self' 'unsafe-inline'");
  });

  it('produces a non-empty string for LOCAL', () => {
    const header = buildCspHeader(generateCspDirectives('LOCAL'));
    expect(header.length).toBeGreaterThan(0);
  });

  it('produces a non-empty string for LOCALHOST', () => {
    const header = buildCspHeader(generateCspDirectives('LOCALHOST'));
    expect(header.length).toBeGreaterThan(0);
  });

  it('produces a parseable header (no trailing semicolons)', () => {
    const header = buildCspHeader(generateCspDirectives('WEB'));
    expect(header.endsWith(';')).toBe(false);
  });

  it('does not contain double spaces', () => {
    const header = buildCspHeader(generateCspDirectives('LOCAL'));
    expect(header).not.toContain('  ');
  });
});

describe('validateDirectiveValue', () => {
  it('accepts self keyword', () => {
    expect(validateDirectiveValue("'self'")).toBe(true);
  });

  it('accepts unsafe-inline keyword', () => {
    expect(validateDirectiveValue("'unsafe-inline'")).toBe(true);
  });

  it('accepts unsafe-eval keyword', () => {
    expect(validateDirectiveValue("'unsafe-eval'")).toBe(true);
  });

  it('accepts none keyword', () => {
    expect(validateDirectiveValue("'none'")).toBe(true);
  });

  it('accepts wildcard', () => {
    expect(validateDirectiveValue('*')).toBe(true);
  });

  it('accepts https: scheme', () => {
    expect(validateDirectiveValue('https:')).toBe(true);
  });

  it('accepts http: scheme', () => {
    expect(validateDirectiveValue('http:')).toBe(true);
  });

  it('accepts data: scheme', () => {
    expect(validateDirectiveValue('data:')).toBe(true);
  });

  it('accepts blob: scheme', () => {
    expect(validateDirectiveValue('blob:')).toBe(true);
  });

  it('accepts file: scheme', () => {
    expect(validateDirectiveValue('file:')).toBe(true);
  });

  it('accepts ws: scheme', () => {
    expect(validateDirectiveValue('ws:')).toBe(true);
  });

  it('accepts wss: scheme', () => {
    expect(validateDirectiveValue('wss:')).toBe(true);
  });

  it('accepts host with wildcard port', () => {
    expect(validateDirectiveValue('http://localhost:*')).toBe(true);
  });

  it('accepts host with specific port', () => {
    expect(validateDirectiveValue('http://localhost:3000')).toBe(true);
  });

  it('accepts domain source', () => {
    expect(validateDirectiveValue('https://example.com')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateDirectiveValue('')).toBe(false);
  });

  it('rejects strings with semicolons', () => {
    expect(validateDirectiveValue("'self'; script-src")).toBe(false);
  });

  it('rejects strings with newlines', () => {
    expect(validateDirectiveValue("'self'\n")).toBe(false);
  });
});

describe('applyOverrides', () => {
  it('replaces a single directive', () => {
    const base = generateCspDirectives('WEB');
    const result = applyOverrides(base, {
      'script-src': ["'self'", 'https://cdn.example.com'],
    });
    expect(result['script-src']).toEqual([
      "'self'",
      'https://cdn.example.com',
    ]);
  });

  it('does not modify other directives', () => {
    const base = generateCspDirectives('WEB');
    const result = applyOverrides(base, {
      'script-src': ["'self'", 'https://cdn.example.com'],
    });
    expect(result['default-src']).toEqual(base['default-src']);
    expect(result['style-src']).toEqual(base['style-src']);
    expect(result['img-src']).toEqual(base['img-src']);
    expect(result['connect-src']).toEqual(base['connect-src']);
    expect(result['frame-src']).toEqual(base['frame-src']);
  });

  it('can override multiple directives at once', () => {
    const base = generateCspDirectives('LOCAL');
    const result = applyOverrides(base, {
      'default-src': ["'self'"],
      'frame-src': ["'none'"],
    });
    expect(result['default-src']).toEqual(["'self'"]);
    expect(result['frame-src']).toEqual(["'none'"]);
  });

  it('does not mutate the original directives', () => {
    const base = generateCspDirectives('WEB');
    const originalDefaultSrc = [...base['default-src']];
    applyOverrides(base, { 'default-src': ['*'] });
    expect(base['default-src']).toEqual(originalDefaultSrc);
  });

  it('returns a valid CspDirectives object', () => {
    const base = generateCspDirectives('LOCALHOST');
    const result = applyOverrides(base, {});
    for (const key of CSP_DIRECTIVE_NAMES) {
      expect(result[key]).toBeDefined();
      expect(Array.isArray(result[key])).toBe(true);
    }
  });

  it('empty overrides returns equivalent directives', () => {
    const base = generateCspDirectives('LOCALHOST');
    const result = applyOverrides(base, {});
    for (const key of CSP_DIRECTIVE_NAMES) {
      expect(result[key]).toEqual(base[key]);
    }
  });
});

describe('CSP_DIRECTIVE_NAMES', () => {
  it('contains exactly six directive names', () => {
    expect(CSP_DIRECTIVE_NAMES).toHaveLength(6);
  });

  it('contains default-src', () => {
    expect(CSP_DIRECTIVE_NAMES).toContain('default-src');
  });

  it('contains script-src', () => {
    expect(CSP_DIRECTIVE_NAMES).toContain('script-src');
  });

  it('contains style-src', () => {
    expect(CSP_DIRECTIVE_NAMES).toContain('style-src');
  });

  it('contains img-src', () => {
    expect(CSP_DIRECTIVE_NAMES).toContain('img-src');
  });

  it('contains connect-src', () => {
    expect(CSP_DIRECTIVE_NAMES).toContain('connect-src');
  });

  it('contains frame-src', () => {
    expect(CSP_DIRECTIVE_NAMES).toContain('frame-src');
  });
});
