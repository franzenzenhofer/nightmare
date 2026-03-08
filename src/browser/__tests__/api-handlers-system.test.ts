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

describe('System & Webview API Handlers', () => {
  describe('POST /api/tabs/:id/zoom', () => {
    it('sets zoom level', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/zoom`, { level: 1.5 });
      expect(result?.status).toBe(200);
      expect((result?.body as Record<string, unknown>).zoom).toBe(1.5);
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/zoom', { level: 1 });
      expect(result?.status).toBe(404);
    });
  });

  describe('POST /api/shutdown', () => {
    it('returns shutting_down', () => {
      const result = router.handle('POST', '/api/shutdown');
      expect(result?.status).toBe(200);
      expect((result?.body as Record<string, unknown>).shutting_down).toBe(true);
    });
  });

  describe('POST /api/relaunch', () => {
    it('returns relaunching', () => {
      const result = router.handle('POST', '/api/relaunch');
      expect(result?.status).toBe(200);
      expect((result?.body as Record<string, unknown>).relaunching).toBe(true);
    });
  });

  describe('POST /api/tabs/:id/find', () => {
    it('returns find placeholder', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/find`, { query: 'test' });
      expect(result?.status).toBe(200);
      const body = result?.body as Record<string, unknown>;
      expect(body.query).toBe('test');
      expect(body.note).toBe('Requires webview context');
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/find', { query: 'x' });
      expect(result?.status).toBe(404);
    });
  });

  describe('POST /api/tabs/:id/click', () => {
    it('returns click placeholder', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/click`, { selector: '#btn' });
      expect(result?.status).toBe(200);
      const body = result?.body as Record<string, unknown>;
      expect(body.clicked).toBe('#btn');
      expect(body.note).toBe('Requires webview context');
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/click', { selector: '#x' });
      expect(result?.status).toBe(404);
    });
  });

  describe('POST /api/tabs/:id/type', () => {
    it('returns type placeholder', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/type`, { selector: '#inp', text: 'hello' });
      expect(result?.status).toBe(200);
      const body = result?.body as Record<string, unknown>;
      expect(body.typed).toBe('hello');
      expect(body.selector).toBe('#inp');
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/type', { selector: '#x', text: 'y' });
      expect(result?.status).toBe(404);
    });
  });

  describe('POST /api/tabs/:id/wait-for', () => {
    it('returns wait-for placeholder', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('POST', `/api/tabs/${tab.id}/wait-for`, { selector: '.loaded', timeout: 3000 });
      expect(result?.status).toBe(200);
      const body = result?.body as Record<string, unknown>;
      expect(body.selector).toBe('.loaded');
      expect(body.timeout).toBe(3000);
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('POST', '/api/tabs/nope/wait-for', { selector: '.x' });
      expect(result?.status).toBe(404);
    });
  });

  describe('GET /api/tabs/:id/query', () => {
    it('returns query placeholder', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = router.handle('GET', `/api/tabs/${tab.id}/query`, { selector: 'h1', action: 'text' });
      expect(result?.status).toBe(200);
      const body = result?.body as Record<string, unknown>;
      expect(body.selector).toBe('h1');
      expect(body.action).toBe('text');
    });

    it('returns 404 for non-existent tab', () => {
      const result = router.handle('GET', '/api/tabs/nope/query', { selector: 'h1' });
      expect(result?.status).toBe(404);
    });
  });
});
