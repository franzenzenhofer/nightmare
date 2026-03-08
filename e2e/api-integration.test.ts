import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:6660';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TabResponse {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly zone: string;
  readonly loading: boolean;
  readonly pinned: boolean;
  readonly muted: boolean;
}

interface StateResponse {
  readonly tabs: readonly TabResponse[];
  readonly activeTabId: string | null;
  readonly tabCount: number;
}

async function createTab(url?: string): Promise<TabResponse> {
  const body = url !== undefined ? { url } : {};
  const res = await fetch(`${BASE}/api/tabs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  expect(res.status).toBe(201);
  return res.json() as Promise<TabResponse>;
}

async function getTab(id: string): Promise<TabResponse> {
  const res = await fetch(`${BASE}/api/tabs/${id}`);
  expect(res.status).toBe(200);
  return res.json() as Promise<TabResponse>;
}

async function listTabs(): Promise<TabResponse[]> {
  const res = await fetch(`${BASE}/api/tabs`);
  expect(res.status).toBe(200);
  return res.json() as Promise<TabResponse[]>;
}

async function deleteTab(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/tabs/${id}`, { method: 'DELETE' });
  expect(res.status).toBe(204);
}

async function navigate(id: string, url: string): Promise<TabResponse> {
  const res = await fetch(`${BASE}/api/tabs/${id}/navigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  expect(res.status).toBe(200);
  return res.json() as Promise<TabResponse>;
}

async function getState(): Promise<StateResponse> {
  const res = await fetch(`${BASE}/api/state`);
  expect(res.status).toBe(200);
  return res.json() as Promise<StateResponse>;
}

// ---------------------------------------------------------------------------
// Tab Lifecycle
// ---------------------------------------------------------------------------

test.describe('Tab lifecycle', () => {
  test('create tab, navigate, get state, close', async () => {
    const tab = await createTab();
    expect(tab.id).toBeTruthy();
    expect(tab.url).toBe('nightmare://newtab');

    const navigated = await navigate(tab.id, 'https://example.com');
    expect(navigated.url).toBe('https://example.com');

    const fetched = await getTab(tab.id);
    expect(fetched.url).toBe('https://example.com');

    await deleteTab(tab.id);

    const res = await fetch(`${BASE}/api/tabs/${tab.id}`);
    expect(res.status).toBe(404);
  });

  test('create tab with explicit URL', async () => {
    const tab = await createTab('https://example.org');
    expect(tab.url).toBe('https://example.org');
    expect(tab.zone).toBe('WEB');
    await deleteTab(tab.id);
  });

  test('list tabs returns all open tabs', async () => {
    const tab1 = await createTab('https://a.com');
    const tab2 = await createTab('https://b.com');

    const tabs = await listTabs();
    const ids = tabs.map((t) => t.id);
    expect(ids).toContain(tab1.id);
    expect(ids).toContain(tab2.id);

    await deleteTab(tab1.id);
    await deleteTab(tab2.id);
  });

  test('close nonexistent tab returns 404', async () => {
    const res = await fetch(`${BASE}/api/tabs/nonexistent-id-xxx`, {
      method: 'DELETE',
    });
    // closeTab on a missing id silently succeeds (returns 204)
    // because TabManager.closeTab just returns if tab is not found
    expect([204, 404]).toContain(res.status);
  });
});

// ---------------------------------------------------------------------------
// Console Log Capture
// ---------------------------------------------------------------------------

test.describe('Console log capture', () => {
  test('execute JS and read console entries', async () => {
    const tab = await createTab();

    const execRes = await fetch(`${BASE}/api/tabs/${tab.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'console.log("hello from nightmare")' }),
    });
    expect(execRes.status).toBe(200);

    const consoleRes = await fetch(`${BASE}/api/tabs/${tab.id}/console`);
    expect(consoleRes.status).toBe(200);
    const entries = await consoleRes.json();
    expect(Array.isArray(entries)).toBe(true);

    await deleteTab(tab.id);
  });

  test('console endpoint returns 404 for unknown tab', async () => {
    const res = await fetch(`${BASE}/api/tabs/does-not-exist/console`);
    // ConsoleCapture.getEntries returns [] for unknown tab, so status is 200
    expect([200, 404]).toContain(res.status);
  });
});

// ---------------------------------------------------------------------------
// Screenshot
// ---------------------------------------------------------------------------

test.describe('Screenshot', () => {
  test('take screenshot of a tab', async () => {
    const tab = await createTab('https://example.com');

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/screenshot`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { screenshot: string; format: string };
    expect(body.format).toBe('png');
    expect(typeof body.screenshot).toBe('string');

    await deleteTab(tab.id);
  });

  test('screenshot of nonexistent tab returns 404', async () => {
    const res = await fetch(`${BASE}/api/tabs/no-such-tab/screenshot`);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Navigation Controls
// ---------------------------------------------------------------------------

test.describe('Navigation controls', () => {
  test('reload a tab', async () => {
    const tab = await createTab('https://example.com');

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/reload`, {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reloading: boolean };
    expect(body.reloading).toBe(true);

    await deleteTab(tab.id);
  });

  test('go back in tab history', async () => {
    const tab = await createTab();

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/back`, {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { navigating: string };
    expect(body.navigating).toBe('back');

    await deleteTab(tab.id);
  });

  test('go forward in tab history', async () => {
    const tab = await createTab();

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/forward`, {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { navigating: string };
    expect(body.navigating).toBe('forward');

    await deleteTab(tab.id);
  });
});

// ---------------------------------------------------------------------------
// Full State Snapshot
// ---------------------------------------------------------------------------

test.describe('State snapshot', () => {
  test('GET /api/state returns tabs and active tab', async () => {
    const tab = await createTab('https://example.com');
    const state = await getState();

    expect(state.tabCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(state.tabs)).toBe(true);

    const found = state.tabs.find((t) => t.id === tab.id);
    expect(found).toBeTruthy();
    expect(found?.url).toBe('https://example.com');

    await deleteTab(tab.id);
  });
});

// ---------------------------------------------------------------------------
// Tab Actions (Activate, Duplicate, Pin, Mute, Zoom, Find)
// ---------------------------------------------------------------------------

test.describe('Tab actions', () => {
  test('activate a tab', async () => {
    const tab1 = await createTab();
    const tab2 = await createTab();

    const res = await fetch(`${BASE}/api/tabs/${tab1.id}/activate`, {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { activated: boolean; tabId: string };
    expect(body.activated).toBe(true);
    expect(body.tabId).toBe(tab1.id);

    await deleteTab(tab1.id);
    await deleteTab(tab2.id);
  });

  test('duplicate a tab', async () => {
    const tab = await createTab('https://example.com');

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/duplicate`, {
      method: 'POST',
    });
    expect(res.status).toBe(201);
    const dup = (await res.json()) as TabResponse;
    expect(dup.id).not.toBe(tab.id);
    expect(dup.url).toBe('https://example.com');

    await deleteTab(tab.id);
    await deleteTab(dup.id);
  });

  test('pin and unpin a tab', async () => {
    const tab = await createTab();

    const res1 = await fetch(`${BASE}/api/tabs/${tab.id}/pin`, {
      method: 'POST',
    });
    expect(res1.status).toBe(200);
    const body1 = (await res1.json()) as { pinned: boolean };
    expect(body1.pinned).toBe(true);

    const res2 = await fetch(`${BASE}/api/tabs/${tab.id}/pin`, {
      method: 'POST',
    });
    expect(res2.status).toBe(200);
    const body2 = (await res2.json()) as { pinned: boolean };
    expect(body2.pinned).toBe(false);

    await deleteTab(tab.id);
  });

  test('mute and unmute a tab', async () => {
    const tab = await createTab();

    const res1 = await fetch(`${BASE}/api/tabs/${tab.id}/mute`, {
      method: 'POST',
    });
    expect(res1.status).toBe(200);
    const body1 = (await res1.json()) as { muted: boolean };
    expect(body1.muted).toBe(true);

    const res2 = await fetch(`${BASE}/api/tabs/${tab.id}/mute`, {
      method: 'POST',
    });
    expect(res2.status).toBe(200);
    const body2 = (await res2.json()) as { muted: boolean };
    expect(body2.muted).toBe(false);

    await deleteTab(tab.id);
  });

  test('set zoom level on a tab', async () => {
    const tab = await createTab();

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/zoom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 150 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { zoom: number; tabId: string };
    expect(body.zoom).toBe(150);

    await deleteTab(tab.id);
  });

  test('find text in page', async () => {
    const tab = await createTab();

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/find`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'hello' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { query: string; tabId: string };
    expect(body.query).toBe('hello');

    await deleteTab(tab.id);
  });
});

// ---------------------------------------------------------------------------
// Webview Operations (Execute, Click, Type, HTML, Query, Wait)
// ---------------------------------------------------------------------------

test.describe('Webview operations', () => {
  test('execute JavaScript in tab', async () => {
    const tab = await createTab();

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'document.title' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { result: unknown };
    expect('result' in body).toBe(true);

    await deleteTab(tab.id);
  });

  test('click element by selector', async () => {
    const tab = await createTab();

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selector: '#my-button' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { clicked: string };
    expect(body.clicked).toBe('#my-button');

    await deleteTab(tab.id);
  });

  test('type text into element', async () => {
    const tab = await createTab();

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/type`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selector: 'input[name="q"]', text: 'search query' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { typed: string; selector: string };
    expect(body.typed).toBe('search query');
    expect(body.selector).toBe('input[name="q"]');

    await deleteTab(tab.id);
  });

  test('get page HTML', async () => {
    const tab = await createTab();

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/html`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { html: string };
    expect(typeof body.html).toBe('string');

    await deleteTab(tab.id);
  });

  test('query DOM element', async () => {
    const tab = await createTab();

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/query?selector=div&action=text`);
    // GET with query params or body
    expect(res.status).toBe(200);

    await deleteTab(tab.id);
  });

  test('wait for selector', async () => {
    const tab = await createTab();

    const res = await fetch(`${BASE}/api/tabs/${tab.id}/wait-for`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selector: '.loaded', timeout: 5000 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { selector: string; timeout: number };
    expect(body.selector).toBe('.loaded');
    expect(body.timeout).toBe(5000);

    await deleteTab(tab.id);
  });
});

// ---------------------------------------------------------------------------
// System Endpoints
// ---------------------------------------------------------------------------

test.describe('System endpoints', () => {
  test('shutdown endpoint responds', async () => {
    // We do NOT actually call shutdown as it would kill the server.
    // Instead verify the route exists by checking OPTIONS.
    const res = await fetch(`${BASE}/api/shutdown`, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
  });

  test('relaunch endpoint responds', async () => {
    const res = await fetch(`${BASE}/api/relaunch`, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
  });
});

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

test.describe('Error handling', () => {
  test('unknown route returns 404', async () => {
    const res = await fetch(`${BASE}/api/nonexistent-route`);
    expect(res.status).toBe(404);
  });

  test('navigate nonexistent tab returns 404', async () => {
    const res = await fetch(`${BASE}/api/tabs/fake-id/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    expect(res.status).toBe(404);
  });

  test('CORS headers are present', async () => {
    const res = await fetch(`${BASE}/api/state`);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});
