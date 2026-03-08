import { describe, it, expect, beforeEach } from 'vitest';
import {
  type InteractionType,
  type ClickOptions,
  type TypeOptions,
  type InteractionRequest,
  type InteractionResult,
  InteractionService,
  buildClickRequest,
  buildTypeRequest,
  buildSelectRequest,
  buildFocusRequest,
  buildScrollRequest,
  validateSelector,
} from '../services/click-interact';

describe('Click/Type/Interact API', () => {
  let service: InteractionService;

  beforeEach(() => {
    service = new InteractionService();
  });

  describe('buildClickRequest', () => {
    it('creates a click request with default options', () => {
      const req = buildClickRequest('#btn');
      expect(req.type).toBe('click');
      expect(req.selector).toBe('#btn');
      expect(req.options.button).toBe('left');
      expect(req.options.clickCount).toBe(1);
    });

    it('creates a double-click request', () => {
      const req = buildClickRequest('.item', { clickCount: 2 });
      expect(req.options.clickCount).toBe(2);
    });

    it('creates a right-click request', () => {
      const req = buildClickRequest('.item', { button: 'right' });
      expect(req.options.button).toBe('right');
    });

    it('clamps click count to minimum 1', () => {
      const req = buildClickRequest('#btn', { clickCount: 0 });
      expect(req.options.clickCount).toBe(1);
    });

    it('clamps click count to maximum 3', () => {
      const req = buildClickRequest('#btn', { clickCount: 10 });
      expect(req.options.clickCount).toBe(3);
    });

    it('throws on empty selector', () => {
      expect(() => buildClickRequest('')).toThrow('Selector must not be empty');
    });
  });

  describe('buildTypeRequest', () => {
    it('creates a type request with text', () => {
      const req = buildTypeRequest('#input', 'hello');
      expect(req.type).toBe('type');
      expect(req.selector).toBe('#input');
      expect(req.text).toBe('hello');
      expect(req.options.clearFirst).toBe(false);
      expect(req.options.delay).toBe(0);
    });

    it('creates a type request with clear first', () => {
      const req = buildTypeRequest('#input', 'world', { clearFirst: true });
      expect(req.options.clearFirst).toBe(true);
    });

    it('creates a type request with delay', () => {
      const req = buildTypeRequest('#input', 'slow', { delay: 50 });
      expect(req.options.delay).toBe(50);
    });

    it('clamps delay to minimum 0', () => {
      const req = buildTypeRequest('#input', 'x', { delay: -10 });
      expect(req.options.delay).toBe(0);
    });

    it('clamps delay to maximum 1000', () => {
      const req = buildTypeRequest('#input', 'x', { delay: 5000 });
      expect(req.options.delay).toBe(1000);
    });

    it('throws on empty selector', () => {
      expect(() => buildTypeRequest('', 'text')).toThrow(
        'Selector must not be empty',
      );
    });
  });

  describe('buildSelectRequest', () => {
    it('creates a select request with value', () => {
      const req = buildSelectRequest('select#color', 'red');
      expect(req.type).toBe('select');
      expect(req.selector).toBe('select#color');
      expect(req.value).toBe('red');
    });

    it('throws on empty selector', () => {
      expect(() => buildSelectRequest('', 'val')).toThrow(
        'Selector must not be empty',
      );
    });
  });

  describe('buildFocusRequest', () => {
    it('creates a focus request', () => {
      const req = buildFocusRequest('#email');
      expect(req.type).toBe('focus');
      expect(req.selector).toBe('#email');
    });

    it('throws on empty selector', () => {
      expect(() => buildFocusRequest('')).toThrow(
        'Selector must not be empty',
      );
    });
  });

  describe('buildScrollRequest', () => {
    it('creates a scroll request with defaults', () => {
      const req = buildScrollRequest('#container');
      expect(req.type).toBe('scroll');
      expect(req.selector).toBe('#container');
      expect(req.scrollX).toBe(0);
      expect(req.scrollY).toBe(0);
    });

    it('creates a scroll request with coordinates', () => {
      const req = buildScrollRequest('#page', 100, 200);
      expect(req.scrollX).toBe(100);
      expect(req.scrollY).toBe(200);
    });

    it('throws on empty selector', () => {
      expect(() => buildScrollRequest('')).toThrow(
        'Selector must not be empty',
      );
    });
  });

  describe('validateSelector', () => {
    it('accepts valid CSS selectors', () => {
      expect(validateSelector('#id')).toBe(true);
      expect(validateSelector('.class')).toBe(true);
      expect(validateSelector('div > span')).toBe(true);
      expect(validateSelector('[data-testid="foo"]')).toBe(true);
    });

    it('rejects empty selectors', () => {
      expect(validateSelector('')).toBe(false);
      expect(validateSelector('   ')).toBe(false);
    });

    it('rejects selectors with curly braces', () => {
      expect(validateSelector('div{color}')).toBe(false);
    });

    it('rejects selectors starting with digits', () => {
      expect(validateSelector('123')).toBe(false);
    });
  });

  describe('InteractionService', () => {
    describe('recordInteraction', () => {
      it('records a successful interaction', () => {
        const result = service.recordInteraction({
          type: 'click',
          selector: '#btn',
          success: true,
        });
        expect(result.success).toBe(true);
        expect(result.selector).toBe('#btn');
        expect(result.type).toBe('click');
        expect(result.timestamp).toBeGreaterThan(0);
      });

      it('records a failed interaction with error', () => {
        const result = service.recordInteraction({
          type: 'type',
          selector: '#missing',
          success: false,
          error: 'Element not found',
        });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Element not found');
      });
    });

    describe('getHistory', () => {
      it('returns empty array initially', () => {
        expect(service.getHistory()).toEqual([]);
      });

      it('returns recorded interactions in order', () => {
        service.recordInteraction({
          type: 'click',
          selector: '#a',
          success: true,
        });
        service.recordInteraction({
          type: 'type',
          selector: '#b',
          success: true,
        });
        const history = service.getHistory();
        expect(history).toHaveLength(2);
        expect(history[0]?.selector).toBe('#a');
        expect(history[1]?.selector).toBe('#b');
      });

      it('limits history to max entries', () => {
        for (let i = 0; i < 1100; i++) {
          service.recordInteraction({
            type: 'click',
            selector: `#btn-${String(i)}`,
            success: true,
          });
        }
        expect(service.getHistory()).toHaveLength(1000);
      });
    });

    describe('clearHistory', () => {
      it('clears all recorded interactions', () => {
        service.recordInteraction({
          type: 'click',
          selector: '#x',
          success: true,
        });
        service.clearHistory();
        expect(service.getHistory()).toEqual([]);
      });
    });

    describe('getLastInteraction', () => {
      it('returns undefined when no interactions', () => {
        expect(service.getLastInteraction()).toBeUndefined();
      });

      it('returns the most recent interaction', () => {
        service.recordInteraction({
          type: 'click',
          selector: '#first',
          success: true,
        });
        service.recordInteraction({
          type: 'focus',
          selector: '#second',
          success: true,
        });
        expect(service.getLastInteraction()?.selector).toBe('#second');
      });
    });

    describe('getStatsByType', () => {
      it('returns zero counts initially', () => {
        const stats = service.getStatsByType();
        expect(stats.get('click')).toBeUndefined();
      });

      it('counts interactions by type', () => {
        service.recordInteraction({
          type: 'click',
          selector: '#a',
          success: true,
        });
        service.recordInteraction({
          type: 'click',
          selector: '#b',
          success: true,
        });
        service.recordInteraction({
          type: 'type',
          selector: '#c',
          success: true,
        });
        const stats = service.getStatsByType();
        expect(stats.get('click')).toBe(2);
        expect(stats.get('type')).toBe(1);
      });
    });
  });
});
