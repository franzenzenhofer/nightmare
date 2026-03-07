import type { TabManager } from '../../services/tab-manager';
import type { ConsoleCapture } from '../console-capture';
import type { EventBus } from '../event-bus';

export interface McpToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

interface McpDependencies {
  readonly tabManager: TabManager;
  readonly consoleCapture: ConsoleCapture;
  readonly eventBus: EventBus;
}

type ToolHandler = (args: Record<string, unknown>) => unknown;

export class McpToolRegistry {
  private readonly tools = new Map<string, { definition: McpToolDefinition; handler: ToolHandler }>();

  constructor(private readonly deps: McpDependencies) {
    this.registerTools();
  }

  listTools(): McpToolDefinition[] {
    return [...this.tools.values()].map((t) => t.definition);
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ReturnType<ToolHandler>> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    return tool.handler(args);
  }

  private registerTools(): void {
    this.register({
      name: 'nightmare_create_tab',
      description: 'Open a new tab with optional URL',
      inputSchema: { type: 'object', properties: { url: { type: 'string' } } },
      handler: (args) => {
        const url = typeof args.url === 'string' ? args.url : undefined;
        const tab = this.deps.tabManager.createTab(url);
        this.deps.eventBus.emit({
          type: 'tab:created',
          tab: { id: tab.id, url: tab.url, title: tab.title, zone: tab.zone },
        });
        return tab;
      },
    });

    this.register({
      name: 'nightmare_list_tabs',
      description: 'List all open tabs with state',
      inputSchema: { type: 'object', properties: {} },
      handler: () => this.deps.tabManager.getAllTabs(),
    });

    this.register({
      name: 'nightmare_get_tab',
      description: 'Get full tab state by ID',
      inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
      handler: (args) => {
        const tab = this.deps.tabManager.getTab(args.tabId as string);
        if (!tab) throw new Error('Tab not found');
        return tab;
      },
    });

    this.register({
      name: 'nightmare_close_tab',
      description: 'Close a tab by ID',
      inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
      handler: (args) => {
        this.deps.tabManager.closeTab(args.tabId as string);
        this.deps.eventBus.emit({ type: 'tab:closed', tabId: args.tabId as string });
        return { closed: true };
      },
    });

    this.register({
      name: 'nightmare_navigate',
      description: 'Navigate a tab to a URL',
      inputSchema: {
        type: 'object',
        properties: { tabId: { type: 'string' }, url: { type: 'string' } },
        required: ['tabId', 'url'],
      },
      handler: (args) => {
        const tab = this.deps.tabManager.getTab(args.tabId as string);
        if (!tab) throw new Error('Tab not found');
        this.deps.tabManager.updateTabFromWebview(tab.id, { url: args.url as string });
        this.deps.eventBus.emit({ type: 'tab:navigated', tabId: tab.id, url: args.url as string });
        return this.deps.tabManager.getTab(tab.id);
      },
    });

    this.register({
      name: 'nightmare_go_back',
      description: 'Navigate back in tab history',
      inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
      handler: (args) => {
        const tab = this.deps.tabManager.getTab(args.tabId as string);
        if (!tab) throw new Error('Tab not found');
        return { navigating: 'back' };
      },
    });

    this.register({
      name: 'nightmare_go_forward',
      description: 'Navigate forward in tab history',
      inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
      handler: (args) => {
        const tab = this.deps.tabManager.getTab(args.tabId as string);
        if (!tab) throw new Error('Tab not found');
        return { navigating: 'forward' };
      },
    });

    this.register({
      name: 'nightmare_reload',
      description: 'Reload a tab',
      inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
      handler: (args) => {
        const tab = this.deps.tabManager.getTab(args.tabId as string);
        if (!tab) throw new Error('Tab not found');
        return { reloading: true };
      },
    });

    this.register({
      name: 'nightmare_get_console',
      description: 'Read console log buffer for a tab',
      inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] },
      handler: (args) => this.deps.consoleCapture.getEntries(args.tabId as string),
    });

    this.register({
      name: 'nightmare_get_state',
      description: 'Full browser state snapshot',
      inputSchema: { type: 'object', properties: {} },
      handler: () => {
        const tabs = this.deps.tabManager.getAllTabs();
        const activeTab = this.deps.tabManager.getActiveTab();
        return {
          tabs,
          activeTabId: activeTab?.id ?? null,
          tabCount: this.deps.tabManager.getTabCount(),
        };
      },
    });
  }

  private register(config: McpToolDefinition & { handler: ToolHandler }): void {
    const { handler, ...definition } = config;
    this.tools.set(config.name, { definition, handler });
  }
}
