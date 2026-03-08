import { describe, it, expect, beforeEach } from 'vitest';
import { createApiRouter } from '../api/handlers';
import { TabManager } from '../services/tab-manager';
import { ConsoleCapture } from '../api/console-capture';
import { EventBus } from '../api/event-bus';

let tabManager: TabManager;
let router: ReturnType<typeof createApiRouter>;

beforeEach(() => {
  tabManager = new TabManager();
  const consoleCapture = new ConsoleCapture();
  const eventBus = new EventBus();
  router = createApiRouter({ tabManager, consoleCapture, eventBus });
});

describe('Extended API Handlers', () => {
  describe('POST /api/tabs/:id/activate', () => {
    it('activates a tab', () => {
      const t1 = tabManager.createTab('https://a.com');
      tabManager.createTab('https://b.com');
      const result = router.handle('POST', `/api/tabs/${t1.id}/activate`);
      expect(result?.status).toBe(200);
      expect((result?.body as Record<string, unknown>).activated).toBe(true);
      expect(tabManager.getActiveTab()?.id).toBe(t1.id);
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/activate');
      expect(result?.status).toBe(404);
    });
  });

  describe('POST /api/tabs/:id/duplicate', () => {
    it('duplicates a tab', () => {
      const tab = tabManager.createTab('https://dup.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/duplicate`);
      expect(result?.status).toBe(201);
      expect(tabManager.getTabCount()).toBe(2);
      expect((result?.body as Record<string, unknown>).url).toBe('https://dup.com');
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/duplicate');
      expect(result?.status).toBe(404);
    });
  });

  describe('POST /api/tabs/:id/pin', () => {
    it('toggles pin state', () => {
      const tab = tabManager.createTab('https://pin.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/pin`);
      expect(result?.status).toBe(200);
      expect((result?.body as Record<string, unknown>).pinned).toBe(true);
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/pin');
      expect(result?.status).toBe(404);
    });
  });

  describe('POST /api/tabs/:id/mute', () => {
    it('toggles mute state', () => {
      const tab = tabManager.createTab('https://mute.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/mute`);
      expect(result?.status).toBe(200);
      expect((result?.body as Record<string, unknown>).muted).toBe(true);
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/mute');
      expect(result?.status).toBe(404);
    });
  });

  describe('POST /api/tabs/:id/execute', () => {
    it('returns webview placeholder', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/execute`, { code: 'alert(1)' });
      expect(result?.status).toBe(200);
      expect((result?.body as Record<string, unknown>).note).toBe('Requires webview context');
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/execute', { code: 'x' });
      expect(result?.status).toBe(404);
    });
  });

  describe('GET /api/tabs/:id/screenshot', () => {
    it('returns screenshot placeholder', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('GET', `/api/tabs/${tab.id}/screenshot`);
      expect(result?.status).toBe(200);
      const body = result?.body as Record<string, unknown>;
      expect(body.format).toBe('png');
      expect(body.note).toBe('Requires webview context');
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('GET', '/api/tabs/nope/screenshot');
      expect(result?.status).toBe(404);
    });
  });

  describe('GET /api/tabs/:id/html', () => {
    it('returns html placeholder', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('GET', `/api/tabs/${tab.id}/html`);
      expect(result?.status).toBe(200);
      expect((result?.body as Record<string, unknown>).note).toBe('Requires webview context');
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('GET', '/api/tabs/nope/html');
      expect(result?.status).toBe(404);
    });
  });
});
