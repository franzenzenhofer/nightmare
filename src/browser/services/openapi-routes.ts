export interface RouteMetadata {
  readonly method: string;
  readonly path: string;
  readonly mcpName: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

export const ROUTE_METADATA: readonly RouteMetadata[] = [
  { method: 'POST', path: '/api/tabs', mcpName: 'nightmare_create_tab', description: 'Open a new tab with optional URL', inputSchema: { type: 'object', properties: { url: { type: 'string' } } } },
  { method: 'GET', path: '/api/tabs', mcpName: 'nightmare_list_tabs', description: 'List all open tabs with state', inputSchema: { type: 'object', properties: {} } },
  { method: 'GET', path: '/api/tabs/:id', mcpName: 'nightmare_get_tab', description: 'Get full tab state by ID', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'DELETE', path: '/api/tabs/:id', mcpName: 'nightmare_close_tab', description: 'Close a tab by ID', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'POST', path: '/api/tabs/:id/navigate', mcpName: 'nightmare_navigate', description: 'Navigate a tab to a URL', inputSchema: { type: 'object', properties: { tabId: { type: 'string' }, url: { type: 'string' } }, required: ['tabId', 'url'] } },
  { method: 'POST', path: '/api/tabs/:id/reload', mcpName: 'nightmare_reload', description: 'Reload a tab', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'POST', path: '/api/tabs/:id/back', mcpName: 'nightmare_go_back', description: 'Navigate back in tab history', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'POST', path: '/api/tabs/:id/forward', mcpName: 'nightmare_go_forward', description: 'Navigate forward in tab history', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'GET', path: '/api/tabs/:id/console', mcpName: 'nightmare_get_console', description: 'Read console log buffer for a tab', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'GET', path: '/api/state', mcpName: 'nightmare_get_state', description: 'Full browser state snapshot', inputSchema: { type: 'object', properties: {} } },
  { method: 'POST', path: '/api/tabs/:id/activate', mcpName: 'nightmare_activate_tab', description: 'Activate a tab by ID', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'POST', path: '/api/tabs/:id/duplicate', mcpName: 'nightmare_duplicate_tab', description: 'Duplicate a tab', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'POST', path: '/api/tabs/:id/pin', mcpName: 'nightmare_pin_tab', description: 'Toggle pin state on a tab', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'POST', path: '/api/tabs/:id/mute', mcpName: 'nightmare_mute_tab', description: 'Toggle mute state on a tab', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'POST', path: '/api/tabs/:id/zoom', mcpName: 'nightmare_zoom', description: 'Set zoom level for a tab', inputSchema: { type: 'object', properties: { tabId: { type: 'string' }, level: { type: 'number' } }, required: ['tabId', 'level'] } },
  { method: 'POST', path: '/api/tabs/:id/find', mcpName: 'nightmare_find_in_page', description: 'Find text in current page', inputSchema: { type: 'object', properties: { tabId: { type: 'string' }, query: { type: 'string' } }, required: ['tabId', 'query'] } },
  { method: 'POST', path: '/api/tabs/:id/execute', mcpName: 'nightmare_execute_js', description: 'Execute JavaScript in tab context', inputSchema: { type: 'object', properties: { tabId: { type: 'string' }, code: { type: 'string' } }, required: ['tabId', 'code'] } },
  { method: 'GET', path: '/api/tabs/:id/screenshot', mcpName: 'nightmare_screenshot', description: 'Take screenshot of tab', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'GET', path: '/api/tabs/:id/html', mcpName: 'nightmare_get_html', description: 'Get page HTML content', inputSchema: { type: 'object', properties: { tabId: { type: 'string' } }, required: ['tabId'] } },
  { method: 'POST', path: '/api/tabs/:id/click', mcpName: 'nightmare_click', description: 'Click element by CSS selector', inputSchema: { type: 'object', properties: { tabId: { type: 'string' }, selector: { type: 'string' } }, required: ['tabId', 'selector'] } },
  { method: 'POST', path: '/api/tabs/:id/type', mcpName: 'nightmare_type_text', description: 'Type text into element by selector', inputSchema: { type: 'object', properties: { tabId: { type: 'string' }, selector: { type: 'string' }, text: { type: 'string' } }, required: ['tabId', 'selector', 'text'] } },
  { method: 'POST', path: '/api/tabs/:id/wait-for', mcpName: 'nightmare_wait_for', description: 'Wait for selector or condition', inputSchema: { type: 'object', properties: { tabId: { type: 'string' }, selector: { type: 'string' }, timeout: { type: 'number' } }, required: ['tabId', 'selector'] } },
  { method: 'GET', path: '/api/tabs/:id/query', mcpName: 'nightmare_query_dom', description: 'Query DOM element by selector', inputSchema: { type: 'object', properties: { tabId: { type: 'string' }, selector: { type: 'string' }, action: { type: 'string' } }, required: ['tabId', 'selector'] } },
  { method: 'POST', path: '/api/shutdown', mcpName: 'nightmare_shutdown', description: 'Shutdown the browser', inputSchema: { type: 'object', properties: {} } },
  { method: 'POST', path: '/api/relaunch', mcpName: 'nightmare_relaunch', description: 'Relaunch browser without killing process', inputSchema: { type: 'object', properties: {} } },
  { method: 'POST', path: '/api/bookmarks', mcpName: 'nightmare_add_bookmark', description: 'Add a bookmark', inputSchema: { type: 'object', properties: { title: { type: 'string' }, url: { type: 'string' } }, required: ['title', 'url'] } },
  { method: 'GET', path: '/api/history/search', mcpName: 'nightmare_search_history', description: 'Search browsing history', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
];
