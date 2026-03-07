import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ApiServer } from '../api/server';
import { TabManager } from '../services/tab-manager';
import { ConsoleCapture } from '../api/console-capture';
import { EventBus } from '../api/event-bus';

let server: ApiServer;
let port: number;

beforeEach(async () => {
  const tabManager = new TabManager();
  const consoleCapture = new ConsoleCapture();
  const eventBus = new EventBus();
  server = new ApiServer({ tabManager, consoleCapture, eventBus });
  port = await server.start(0);
});

afterEach(async () => {
  await server.stop();
});

async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`http://localhost:${String(port)}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const responseBody = res.status === 204 ? null : await res.json();
  return { status: res.status, body: responseBody };
}

describe('ApiServer', () => {
  it('starts and responds to health check', async () => {
    const res = await fetch(`http://localhost:${String(port)}/api/state`);
    expect(res.status).toBe(200);
  });

  it('creates a tab via POST /api/tabs', async () => {
    const { status, body } = await apiRequest('POST', '/api/tabs', { url: 'https://test.com' });
    expect(status).toBe(201);
    expect((body as Record<string, unknown>).url).toBe('https://test.com');
  });

  it('lists tabs via GET /api/tabs', async () => {
    await apiRequest('POST', '/api/tabs', { url: 'https://a.com' });
    await apiRequest('POST', '/api/tabs', { url: 'https://b.com' });
    const { status, body } = await apiRequest('GET', '/api/tabs');
    expect(status).toBe(200);
    expect(body).toHaveLength(2);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await fetch(`http://localhost:${String(port)}/api/nonexistent`);
    expect(res.status).toBe(404);
  });

  it('returns CORS headers', async () => {
    const res = await fetch(`http://localhost:${String(port)}/api/state`);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('handles OPTIONS preflight', async () => {
    const res = await fetch(`http://localhost:${String(port)}/api/tabs`, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-methods')).toContain('GET');
  });

  it('returns full state via GET /api/state', async () => {
    await apiRequest('POST', '/api/tabs', { url: 'https://x.com' });
    const { body } = await apiRequest('GET', '/api/state');
    const state = body as Record<string, unknown>;
    expect(state.tabs).toBeDefined();
    expect(state.tabCount).toBe(1);
  });
});
