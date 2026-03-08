import type { Router } from './router';

export function registerSystemRoutes(router: Router): void {
  router.post('/api/shutdown', () => {
    return { status: 200, body: { shutting_down: true } };
  });

  router.post('/api/relaunch', () => {
    return { status: 200, body: { relaunching: true } };
  });
}
