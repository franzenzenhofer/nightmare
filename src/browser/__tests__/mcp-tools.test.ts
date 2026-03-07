import { describe, it, expect, beforeEach } from 'vitest';
import { McpToolRegistry } from '../api/mcp/tools';
import { TabManager } from '../services/tab-manager';
import { ConsoleCapture } from '../api/console-capture';
import { EventBus } from '../api/event-bus';
import type { BookmarkManager } from '../services/bookmarks';
import type { HistoryManager } from '../services/history';

let registry: McpToolRegistry;
let tabManager: TabManager;
let consoleCapture: ConsoleCapture;

beforeEach(() => {
  tabManager = new TabManager();
  consoleCapture = new ConsoleCapture();
  const eventBus = new EventBus();
  registry = new McpToolRegistry({
    tabManager,
    consoleCapture,
    eventBus,
  });
});

describe('McpToolRegistry', () => {
  it('lists all available tools', () => {
    const tools = registry.listTools();
    expect(tools.length).toBeGreaterThan(0);
    const names = tools.map((t) => t.name);
    expect(names).toContain('nightmare_create_tab');
    expect(names).toContain('nightmare_list_tabs');
    expect(names).toContain('nightmare_navigate');
    expect(names).toContain('nightmare_close_tab');
    expect(names).toContain('nightmare_get_tab');
    expect(names).toContain('nightmare_get_console');
    expect(names).toContain('nightmare_get_state');
  });

  it('each tool has name, description, and inputSchema', () => {
    const tools = registry.listTools();
    for (const tool of tools) {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
    }
  });

  describe('nightmare_create_tab', () => {
    it('creates a tab with url', async () => {
      const result = await registry.callTool('nightmare_create_tab', { url: 'https://test.com' });
      expect(result.id).toBeDefined();
      expect(result.url).toBe('https://test.com');
      expect(tabManager.getTabCount()).toBe(1);
    });

    it('creates a tab with default url', async () => {
      const result = await registry.callTool('nightmare_create_tab', {});
      expect(result.url).toBe('nightmare://newtab');
    });
  });

  describe('nightmare_list_tabs', () => {
    it('returns all tabs', async () => {
      tabManager.createTab('https://a.com');
      tabManager.createTab('https://b.com');
      const result = await registry.callTool('nightmare_list_tabs', {});
      expect(result).toHaveLength(2);
    });
  });

  describe('nightmare_get_tab', () => {
    it('returns tab by id', async () => {
      const tab = tabManager.createTab('https://x.com');
      const result = await registry.callTool('nightmare_get_tab', { tabId: tab.id });
      expect(result.url).toBe('https://x.com');
    });

    it('throws for non-existent tab', async () => {
      await expect(
        registry.callTool('nightmare_get_tab', { tabId: 'nope' }),
      ).rejects.toThrow();
    });
  });

  describe('nightmare_close_tab', () => {
    it('closes a tab', async () => {
      const t1 = tabManager.createTab('https://a.com');
      tabManager.createTab('https://b.com');
      await registry.callTool('nightmare_close_tab', { tabId: t1.id });
      expect(tabManager.getTabCount()).toBe(1);
    });
  });

  describe('nightmare_navigate', () => {
    it('navigates a tab to new url', async () => {
      const tab = tabManager.createTab('https://old.com');
      await registry.callTool('nightmare_navigate', { tabId: tab.id, url: 'https://new.com' });
      expect(tabManager.getTab(tab.id)?.url).toBe('https://new.com');
    });

    it('throws for non-existent tab', async () => {
      await expect(
        registry.callTool('nightmare_navigate', { tabId: 'nope', url: 'https://x.com' }),
      ).rejects.toThrow();
    });
  });

  describe('nightmare_get_console', () => {
    it('returns console entries', async () => {
      const tab = tabManager.createTab();
      consoleCapture.add(tab.id, 'log', ['hello']);
      const result = await registry.callTool('nightmare_get_console', { tabId: tab.id });
      expect(result).toHaveLength(1);
    });
  });

  describe('nightmare_get_state', () => {
    it('returns full state', async () => {
      tabManager.createTab('https://x.com');
      const result = await registry.callTool('nightmare_get_state', {});
      expect(result.tabs).toHaveLength(1);
      expect(result.tabCount).toBe(1);
    });
  });

  describe('nightmare_go_back', () => {
    it('returns navigating back', async () => {
      const tab = tabManager.createTab('https://x.com');
      const result = await registry.callTool('nightmare_go_back', { tabId: tab.id });
      expect(result).toEqual({ navigating: 'back' });
    });

    it('throws for non-existent tab', async () => {
      await expect(registry.callTool('nightmare_go_back', { tabId: 'nope' })).rejects.toThrow();
    });
  });

  describe('nightmare_go_forward', () => {
    it('returns navigating forward', async () => {
      const tab = tabManager.createTab('https://x.com');
      const result = await registry.callTool('nightmare_go_forward', { tabId: tab.id });
      expect(result).toEqual({ navigating: 'forward' });
    });

    it('throws for non-existent tab', async () => {
      await expect(registry.callTool('nightmare_go_forward', { tabId: 'nope' })).rejects.toThrow();
    });
  });

  describe('nightmare_reload', () => {
    it('returns reloading', async () => {
      const tab = tabManager.createTab('https://x.com');
      const result = await registry.callTool('nightmare_reload', { tabId: tab.id });
      expect(result).toEqual({ reloading: true });
    });

    it('throws for non-existent tab', async () => {
      await expect(registry.callTool('nightmare_reload', { tabId: 'nope' })).rejects.toThrow();
    });
  });

  it('throws for unknown tool', async () => {
    await expect(
      registry.callTool('nightmare_nonexistent', {}),
    ).rejects.toThrow('Unknown tool');
  });
});
