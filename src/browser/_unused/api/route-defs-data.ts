import type { RouteRegistry } from './route-registry';
import { getString } from './route-helpers';

export interface DataDependencies {
  readonly bookmarkManager: {
    add(title: string, url: string): { readonly id: string; title: string; url: string };
  };
  readonly historyManager: {
    search(query: string): readonly { url: string; title: string }[];
  };
}

export function registerDataRoutes(
  r: RouteRegistry, d: DataDependencies,
): void {
  r.register({
    method: 'POST', path: '/api/bookmarks',
    mcpName: 'nightmare_add_bookmark',
    description: 'Add a bookmark',
    inputSchema: {
      type: 'object',
      properties: { title: { type: 'string' }, url: { type: 'string' } },
      required: ['title', 'url'],
    },
    handler: (p) => {
      const title = getString(p.body, 'title');
      const url = getString(p.body, 'url');
      const bookmark = d.bookmarkManager.add(title, url);
      return { status: 201, body: bookmark };
    },
  });

  r.register({
    method: 'GET', path: '/api/history/search',
    mcpName: 'nightmare_search_history',
    description: 'Search browsing history',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
    handler: (p) => {
      const query = getString(p.body, 'query');
      const results = d.historyManager.search(query);
      return { status: 200, body: results };
    },
  });
}
