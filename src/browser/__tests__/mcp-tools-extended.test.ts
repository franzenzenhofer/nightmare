import { describe, it, expect, beforeEach } from 'vitest';
import { McpToolRegistry } from '../api/mcp/tools';
import { TabManager } from '../services/tab-manager';
import { ConsoleCapture } from '../api/console-capture';
import { EventBus } from '../api/event-bus';

let registry: McpToolRegistry;
let tabManager: TabManager;
beforeEach(() => {
  tabManager = new TabManager();
  registry = new McpToolRegistry({ tabManager, consoleCapture: new ConsoleCapture(), eventBus: new EventBus() });
});

describe('Extended MCP Tools', () => {
  it('lists all 25 tools', () => {
    const tools = registry.listTools();
    expect(tools).toHaveLength(25);
    const names = tools.map((t) => t.name);
    expect(names).toContain('nightmare_activate_tab');
    expect(names).toContain('nightmare_duplicate_tab');
    expect(names).toContain('nightmare_pin_tab');
    expect(names).toContain('nightmare_mute_tab');
    expect(names).toContain('nightmare_execute_js');
    expect(names).toContain('nightmare_screenshot');
    expect(names).toContain('nightmare_get_html');
    expect(names).toContain('nightmare_zoom');
    expect(names).toContain('nightmare_shutdown');
    expect(names).toContain('nightmare_relaunch');
    expect(names).toContain('nightmare_find_in_page');
    expect(names).toContain('nightmare_click');
    expect(names).toContain('nightmare_type_text');
    expect(names).toContain('nightmare_wait_for');
    expect(names).toContain('nightmare_query_dom');
  });

  describe('nightmare_activate_tab', () => {
    it('activates a tab', () => {
      const t1 = tabManager.createTab('https://a.com');
      tabManager.createTab('https://b.com');
      const result = registry.callTool('nightmare_activate_tab', { tabId: t1.id }) as Record<string, unknown>;
      expect(result.activated).toBe(true);
      expect(tabManager.getActiveTab()?.id).toBe(t1.id);
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_activate_tab', { tabId: 'nope' })).toThrow();
    });
  });

  describe('nightmare_duplicate_tab', () => {
    it('duplicates a tab', () => {
      const tab = tabManager.createTab('https://dup.com');
      const result = registry.callTool('nightmare_duplicate_tab', { tabId: tab.id }) as Record<string, unknown>;
      expect(result.url).toBe('https://dup.com');
      expect(tabManager.getTabCount()).toBe(2);
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_duplicate_tab', { tabId: 'nope' })).toThrow();
    });
  });

  describe('nightmare_pin_tab', () => {
    it('toggles pin state', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = registry.callTool('nightmare_pin_tab', { tabId: tab.id }) as Record<string, unknown>;
      expect(result.pinned).toBe(true);
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_pin_tab', { tabId: 'nope' })).toThrow();
    });
  });

  describe('nightmare_mute_tab', () => {
    it('toggles mute state', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = registry.callTool('nightmare_mute_tab', { tabId: tab.id }) as Record<string, unknown>;
      expect(result.muted).toBe(true);
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_mute_tab', { tabId: 'nope' })).toThrow();
    });
  });

  describe('nightmare_execute_js', () => {
    it('returns webview placeholder', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = registry.callTool('nightmare_execute_js', { tabId: tab.id, code: 'x' }) as Record<string, unknown>;
      expect(result.note).toBe('Requires webview context');
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_execute_js', { tabId: 'nope', code: 'x' })).toThrow();
    });
  });

  describe('nightmare_screenshot', () => {
    it('returns screenshot placeholder', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = registry.callTool('nightmare_screenshot', { tabId: tab.id }) as Record<string, unknown>;
      expect(result.format).toBe('png');
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_screenshot', { tabId: 'nope' })).toThrow();
    });
  });

  describe('nightmare_get_html', () => {
    it('returns html placeholder', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = registry.callTool('nightmare_get_html', { tabId: tab.id }) as Record<string, unknown>;
      expect(result.note).toBe('Requires webview context');
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_get_html', { tabId: 'nope' })).toThrow();
    });
  });

  describe('nightmare_zoom', () => {
    it('sets zoom level', () => {
      const tab = tabManager.createTab('https://x.com');
      const result = registry.callTool('nightmare_zoom', { tabId: tab.id, level: 1.5 }) as Record<string, unknown>;
      expect(result.zoom).toBe(1.5);
    });

    it('throws for non-existent tab', () => {
      expect(() => registry.callTool('nightmare_zoom', { tabId: 'nope', level: 1 })).toThrow();
    });
  });

  describe('nightmare_shutdown', () => {
    it('returns shutting_down', () => {
      const result = registry.callTool('nightmare_shutdown', {}) as Record<string, unknown>;
      expect(result.shutting_down).toBe(true);
    });
  });

  describe('nightmare_relaunch', () => {
    it('returns relaunching', () => {
      const result = registry.callTool('nightmare_relaunch', {}) as Record<string, unknown>;
      expect(result.relaunching).toBe(true);
    });
  });
});
