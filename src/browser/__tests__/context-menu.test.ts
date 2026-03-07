import { describe, it, expect } from 'vitest';
import { ContextMenuLogic } from '../components/context-menu';
import type { MenuItem, MenuContext } from '../components/context-menu';

const logic = new ContextMenuLogic();

const findSeparators = (items: readonly MenuItem[]): readonly MenuItem[] =>
  items.filter((item) => item.separator === true);

const findById = (
  items: readonly MenuItem[],
  id: string,
): MenuItem | undefined => items.find((item) => item.id === id);

describe('ContextMenuLogic', () => {
  describe('page context', () => {
    it('returns correct items for page context', () => {
      const items = logic.getMenuItems('page');
      expect(items).toHaveLength(5);
    });

    it('includes Back, Forward, Reload, View Source, Inspect', () => {
      const items = logic.getMenuItems('page');
      expect(findById(items, 'back')?.label).toBe('Back');
      expect(findById(items, 'forward')?.label).toBe('Forward');
      expect(findById(items, 'reload')?.label).toBe('Reload');
      expect(findById(items, 'view-source')?.label).toBe('View Source');
      expect(findById(items, 'inspect')?.label).toBe('Inspect');
    });

    it('has a separator after Reload', () => {
      const items = logic.getMenuItems('page');
      const reloadIndex = items.findIndex((i) => i.id === 'reload');
      expect(items[reloadIndex]?.separator).toBe(true);
    });

    it('all items are enabled', () => {
      const items = logic.getMenuItems('page');
      expect(items.every((i) => i.enabled)).toBe(true);
    });
  });

  describe('link context', () => {
    it('returns correct items for link context', () => {
      const items = logic.getMenuItems('link');
      expect(items).toHaveLength(3);
    });

    it('includes Open in New Tab, Copy Link, Inspect', () => {
      const items = logic.getMenuItems('link');
      expect(findById(items, 'open-new-tab')?.label).toBe('Open in New Tab');
      expect(findById(items, 'copy-link')?.label).toBe('Copy Link');
      expect(findById(items, 'inspect')?.label).toBe('Inspect');
    });

    it('has a separator after Copy Link', () => {
      const items = logic.getMenuItems('link');
      const copyIndex = items.findIndex((i) => i.id === 'copy-link');
      expect(items[copyIndex]?.separator).toBe(true);
    });
  });

  describe('tab context', () => {
    it('returns correct items for tab context', () => {
      const items = logic.getMenuItems('tab');
      expect(items).toHaveLength(5);
    });

    it('includes all tab menu items', () => {
      const items = logic.getMenuItems('tab');
      expect(findById(items, 'new-tab')?.label).toBe('New Tab');
      expect(findById(items, 'duplicate')?.label).toBe('Duplicate');
      expect(findById(items, 'pin')?.label).toBe('Pin/Unpin');
      expect(findById(items, 'close-tab')?.label).toBe('Close Tab');
      expect(findById(items, 'close-others')?.label).toBe('Close Other Tabs');
    });

    it('has a separator after Pin/Unpin', () => {
      const items = logic.getMenuItems('tab');
      const pinIndex = items.findIndex((i) => i.id === 'pin');
      expect(items[pinIndex]?.separator).toBe(true);
    });
  });

  describe('image context', () => {
    it('returns correct items for image context', () => {
      const items = logic.getMenuItems('image');
      expect(items).toHaveLength(4);
    });

    it('includes all image menu items', () => {
      const items = logic.getMenuItems('image');
      expect(findById(items, 'open-image')?.label).toBe('Open Image');
      expect(findById(items, 'save-image')?.label).toBe('Save Image');
      expect(findById(items, 'copy-image-url')?.label).toBe('Copy Image URL');
      expect(findById(items, 'inspect')?.label).toBe('Inspect');
    });

    it('has a separator after Copy Image URL', () => {
      const items = logic.getMenuItems('image');
      const copyIndex = items.findIndex((i) => i.id === 'copy-image-url');
      expect(items[copyIndex]?.separator).toBe(true);
    });
  });

  describe('separators', () => {
    it('each context has exactly one separator', () => {
      const contexts: readonly MenuContext[] = [
        'page',
        'link',
        'tab',
        'image',
      ];
      for (const ctx of contexts) {
        const items = logic.getMenuItems(ctx);
        expect(findSeparators(items)).toHaveLength(1);
      }
    });
  });

  describe('item structure', () => {
    it('every item has id, label, and enabled fields', () => {
      const contexts: readonly MenuContext[] = [
        'page',
        'link',
        'tab',
        'image',
      ];
      for (const ctx of contexts) {
        const items = logic.getMenuItems(ctx);
        for (const item of items) {
          expect(typeof item.id).toBe('string');
          expect(typeof item.label).toBe('string');
          expect(typeof item.enabled).toBe('boolean');
        }
      }
    });
  });
});
