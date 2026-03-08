import { describe, it, expect, beforeEach } from 'vitest';
import { createApiRouter, param } from '../api/handlers';
import { TabManager } from '../services/tab-manager';
import { ConsoleCapture } from '../api/console-capture';
import { EventBus } from '../api/event-bus';

let tabManager: TabManager;
let consoleCapture: ConsoleCapture;
let eventBus: EventBus;
let router: ReturnType<typeof createApiRouter>;

beforeEach(() => {
  tabManager = new TabManager();
  consoleCapture = new ConsoleCapture();
  eventBus = new EventBus();
  router = createApiRouter({ tabManager, consoleCapture, eventBus });
});

describe('API Handlers', () => {
  describe('POST /api/tabs', () => {
    it('creates a new tab', () => {
      const result = router.handle('POST', '/api/tabs', { url: 'https://example.com' });
      expect(result?.status).toBe(201);
      expect((result?.body as Record<string, unknown>).url).toBe('https://example.com');
    });

    it('creates tab with default URL', () => {
      const result = router.handle('POST', '/api/tabs', {});
      expect(result?.status).toBe(201);
      expect((result?.body as Record<string, unknown>).url).toBe('nightmare://newtab');
    });
  });

  describe('GET /api/tabs', () => {
    it('lists all tabs', () => {
      tabManager.createTab('https://a.com');
      tabManager.createTab('https://b.com');
      const result = router.handle('GET', '/api/tabs');
      expect(result?.status).toBe(200);
      expect(result?.body).toHaveLength(2);
    });

    it('returns empty array when no tabs', () => {
      const result = router.handle('GET', '/api/tabs');
      expect(result?.status).toBe(200);
      expect(result?.body).toHaveLength(0);
    });
  });

  describe('GET /api/tabs/:id', () => {
    it('returns tab details', () => {
      const tab = tabManager.createTab('https://example.com');
      const result = router.handle('GET', `/api/tabs/${tab.id}`);
      expect(result?.status).toBe(200);
      expect((result?.body as Record<string, unknown>).id).toBe(tab.id);
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('GET', '/api/tabs/nonexistent');
      expect(result?.status).toBe(404);
    });
  });

  describe('DELETE /api/tabs/:id', () => {
    it('closes a tab', () => {
      const tab1 = tabManager.createTab('https://a.com');
      tabManager.createTab('https://b.com');
      const result = router.handle('DELETE', `/api/tabs/${tab1.id}`);
      expect(result?.status).toBe(204);
      expect(tabManager.getTabCount()).toBe(1);
    });
  });

  describe('POST /api/tabs/:id/navigate', () => {
    it('updates tab URL', () => {
      const tab = tabManager.createTab('https://old.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/navigate`, {
        url: 'https://new.com',
      });
      expect(result?.status).toBe(200);
      expect(tabManager.getTab(tab.id)?.url).toBe('https://new.com');
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/navigate', { url: 'https://x.com' });
      expect(result?.status).toBe(404);
    });
  });

  describe('POST /api/tabs/:id/reload', () => {
    it('reloads a tab', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/reload`);
      expect(result?.status).toBe(200);
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/reload');
      expect(result?.status).toBe(404);
    });
  });

  describe('POST /api/tabs/:id/back', () => {
    it('navigates back', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/back`);
      expect(result?.status).toBe(200);
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/back');
      expect(result?.status).toBe(404);
    });
  });

  describe('POST /api/tabs/:id/forward', () => {
    it('navigates forward', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/forward`);
      expect(result?.status).toBe(200);
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/forward');
      expect(result?.status).toBe(404);
    });
  });

  describe('GET /api/tabs/:id/console', () => {
    it('returns console entries for tab', () => {
      consoleCapture.add('tab1', 'log', ['hello']);
      const tab = tabManager.createTab();
      consoleCapture.add(tab.id, 'error', ['fail']);
      const result = router.handle('GET', `/api/tabs/${tab.id}/console`);
      expect(result?.status).toBe(200);
      expect(result?.body).toHaveLength(1);
    });
  });

  describe('POST /api/tabs (edge cases)', () => {
    it('creates tab with no body at all', () => {
      const result = router.handle('POST', '/api/tabs');
      expect(result?.status).toBe(201);
    });

    it('creates tab with non-string url', () => {
      const result = router.handle('POST', '/api/tabs', { url: 123 });
      expect(result?.status).toBe(201);
      expect((result?.body as Record<string, unknown>).url).toBe('nightmare://newtab');
    });
  });

  describe('POST /api/tabs/:id/navigate (edge cases)', () => {
    it('handles non-string url in body', () => {
      const tab = tabManager.createTab();
      const result = router.handle('POST', `/api/tabs/${tab.id}/navigate`, { url: 42 });
      expect(result?.status).toBe(200);
    });

    it('handles missing body', () => {
      const tab = tabManager.createTab();
      const result = router.handle('POST', `/api/tabs/${tab.id}/navigate`);
      expect(result?.status).toBe(200);
    });
  });

  describe('param helper', () => {
    it('returns param value when present', () => {
      expect(param({ id: 'abc' }, 'id')).toBe('abc');
    });

    it('returns empty string when param missing', () => {
      expect(param({}, 'id')).toBe('');
    });
  });

  describe('GET /api/state', () => {
    it('returns full browser state', () => {
      tabManager.createTab('https://a.com');
      const result = router.handle('GET', '/api/state');
      expect(result?.status).toBe(200);
      const body = result?.body as Record<string, unknown>;
      expect(body.tabs).toBeDefined();
      expect(body.activeTabId).toBeDefined();
    });
  });
});
