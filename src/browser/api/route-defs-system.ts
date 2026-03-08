import type { RouteRegistry } from './route-registry';

export function registerSystemRoutes(r: RouteRegistry): void {
  r.register({
    method: 'POST', path: '/api/shutdown',
    mcpName: 'nightmare_shutdown',
    description: 'Shutdown the browser',
    inputSchema: { type: 'object', properties: {} },
    handler: () => ({ status: 200, body: { shutting_down: true } }),
  });

  r.register({
    method: 'POST', path: '/api/relaunch',
    mcpName: 'nightmare_relaunch',
    description: 'Relaunch browser without killing process',
    inputSchema: { type: 'object', properties: {} },
    handler: () => ({ status: 200, body: { relaunching: true } }),
  });
}
