import { describe, it, expect } from 'vitest';
import { parseViewSourceUrl, isViewSourceUrl, formatSourceHtml } from '../services/page-source';

describe('page-source', () => {
  describe('isViewSourceUrl', () => {
    it('detects view-source: URLs', () => {
      expect(isViewSourceUrl('view-source:https://example.com')).toBe(true);
    });

    it('rejects normal URLs', () => {
      expect(isViewSourceUrl('https://example.com')).toBe(false);
    });

    it('is case insensitive', () => {
      expect(isViewSourceUrl('VIEW-SOURCE:https://example.com')).toBe(true);
    });
  });

  describe('parseViewSourceUrl', () => {
    it('extracts the inner URL', () => {
      expect(parseViewSourceUrl('view-source:https://example.com')).toBe('https://example.com');
    });

    it('returns null for non view-source URLs', () => {
      expect(parseViewSourceUrl('https://example.com')).toBeNull();
    });

    it('handles view-source with path', () => {
      expect(parseViewSourceUrl('view-source:https://example.com/page?q=1')).toBe(
        'https://example.com/page?q=1',
      );
    });
  });

  describe('formatSourceHtml', () => {
    it('escapes HTML entities', () => {
      const result = formatSourceHtml('<div class="test">Hello & bye</div>');
      expect(result).toContain('&lt;div');
      expect(result).toContain('&amp;');
      expect(result).not.toContain('<div class');
    });

    it('wraps in pre tag', () => {
      const result = formatSourceHtml('<p>hi</p>');
      expect(result).toMatch(/^<pre.*>.*<\/pre>$/s);
    });

    it('adds line numbers', () => {
      const result = formatSourceHtml('<p>line1</p>\n<p>line2</p>');
      expect(result).toContain('1');
      expect(result).toContain('2');
    });

    it('handles empty input', () => {
      const result = formatSourceHtml('');
      expect(result).toContain('<pre');
    });
  });
});
