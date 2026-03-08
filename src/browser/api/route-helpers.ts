import type { RouteParams } from './route-registry';
import type { RouteResponse } from './router';
import type { TabManager } from '../services/tab-manager';
import type { ConsoleCapture } from './console-capture';
import type { EventBus } from './event-bus';

export interface RouteDependencies {
  readonly tabManager: TabManager;
  readonly consoleCapture: ConsoleCapture;
  readonly eventBus: EventBus;
}

export function getString(obj: Record<string, unknown>, key: string): string {
  const val = obj[key];
  return typeof val === 'string' ? val : '';
}

export function getNumber(obj: Record<string, unknown>, key: string): number {
  const val = obj[key];
  return typeof val === 'number' ? val : 0;
}

export function resolveTabId(p: RouteParams): string {
  return p.pathParams.id ?? getString(p.body, 'tabId');
}

export function notFound(): RouteResponse {
  return { status: 404, body: { error: 'Tab not found' } };
}

export function withTab(
  d: RouteDependencies, p: RouteParams, fn: (id: string) => RouteResponse,
): RouteResponse {
  const id = resolveTabId(p);
  const tab = d.tabManager.getTab(id);
  if (!tab) return notFound();
  return fn(tab.id);
}
