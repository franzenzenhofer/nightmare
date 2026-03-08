import { describe, it, expect, beforeEach } from 'vitest';
import { McpToolRegistry } from '../api/mcp/tools';
import { TabManager } from '../services/tab-manager';
import { ConsoleCapture } from '../api/console-capture';
import { EventBus } from '../api/event-bus';

let registry: McpToolRegistry;
let tabManager: TabManager;

beforeEach(() => {
  tabManager = new TabManager();
  const consoleCapture = new ConsoleCapture();
  const eventBus = new EventBus();
  registry = new McpToolRegistry({ tabManager, consoleCapture, eventBus });
});

describe('Webview MCP Tools', () => {
  describe('nightmare_find_in_page', () => {
    it('returns find result with query', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = registry.callTool('nightmare_find_in_page', { tabId: tab.id, query: 'hello' }) as Record<string, unknown>;
      expect(result.query).toBe('hello');
      expect(result.note).toBe('Requires webview context');
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_find_in_page', { tabId: 'nope', query: 'x' })).toThrow();
    });
  });

  describe('nightmare_click', () => {
    it('returns click placeholder with selector', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = registry.callTool('nightmare_click', { tabId: tab.id, selector: '#btn' }) as Record<string, unknown>;
      expect(result.clicked).toBe('#btn');
      expect(result.note).toBe('Requires webview context');
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_click', { tabId: 'nope', selector: '#x' })).toThrow();
    });
  });

  describe('nightmare_type_text', () => {
    it('returns type placeholder with selector and text', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = registry.callTool('nightmare_type_text', {
        tabId: tab.id, selector: '#input', text: 'hello',
      }) as Record<string, unknown>;
      expect(result.typed).toBe('hello');
      expect(result.selector).toBe('#input');
      expect(result.note).toBe('Requires webview context');
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_type_text', { tabId: 'nope', selector: '#x', text: 'y' })).toThrow();
    });
  });

  describe('nightmare_wait_for', () => {
    it('returns wait-for placeholder with selector', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = registry.callTool('nightmare_wait_for', {
        tabId: tab.id, selector: '.loaded', timeout: 5000,
      }) as Record<string, unknown>;
      expect(result.selector).toBe('.loaded');
      expect(result.timeout).toBe(5000);
      expect(result.note).toBe('Requires webview context');
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_wait_for', { tabId: 'nope', selector: '.x' })).toThrow();
    });
  });

  describe('nightmare_query_dom', () => {
    it('returns query placeholder with selector', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = registry.callTool('nightmare_query_dom', {
        tabId: tab.id, selector: 'div.main', action: 'text',
      }) as Record<string, unknown>;
      expect(result.selector).toBe('div.main');
      expect(result.action).toBe('text');
      expect(result.note).toBe('Requires webview context');
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_query_dom', { tabId: 'nope', selector: 'div' })).toThrow();
    });
  });
});
