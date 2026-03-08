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

async function post(
  path: string,
  body?: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function get(path: string): Promise<Response> {
  return fetch(`${BASE}${path}`);
}

async function del(path: string): Promise<Response> {
  return fetch(`${BASE}${path}`, { method: 'DELETE' });
}

async function createTab(url?: string): Promise<TabResponse> {
  const body = url !== undefined ? { url } : {};
  const res = await post('/api/tabs', body);
  expect(res.status).toBe(201);
  return res.json() as Promise<TabResponse>;
}

async function cleanupTab(id: string): Promise<void> {
  await del(`/api/tabs/${id}`);
}

async function getState(): Promise<StateResponse> {
  const res = await get('/api/state');
  expect(res.status).toBe(200);
  return res.json() as Promise<StateResponse>;
}

// ---------------------------------------------------------------------------
// Security Zone Classification
// ---------------------------------------------------------------------------

test.describe('Security zone classification', () => {
  test('local file URL is classified as LOCAL', async () => {
    const tab = await createTab('file:///tmp/test.html');
    expect(tab.zone).toBe('LOCAL');
    await cleanupTab(tab.id);
  });

  test('nightmare:// URL is classified as LOCAL', async () => {
    const tab = await createTab('nightmare://newtab');
    expect(tab.zone).toBe('LOCAL');
    await cleanupTab(tab.id);
  });

  test('about:blank is classified as LOCAL', async () => {
    const tab = await createTab('about:blank');
    expect(tab.zone).toBe('LOCAL');
    await cleanupTab(tab.id);
  });

  test('localhost URL is classified as LOCALHOST', async () => {
    const tab = await createTab('http://localhost:3000');
    expect(tab.zone).toBe('LOCALHOST');
    await cleanupTab(tab.id);
  });

  test('127.0.0.1 URL is classified as LOCALHOST', async () => {
    const tab = await createTab('http://127.0.0.1:8080');
    expect(tab.zone).toBe('LOCALHOST');
    await cleanupTab(tab.id);
  });

  test('private IP (192.168.x.x) is classified as LOCALHOST', async () => {
    const tab = await createTab('http://192.168.1.100');
    expect(tab.zone).toBe('LOCALHOST');
    await cleanupTab(tab.id);
  });

  test('subdomain of localhost is classified as LOCALHOST', async () => {
    const tab = await createTab('http://app.localhost:8080');
    expect(tab.zone).toBe('LOCALHOST');
    await cleanupTab(tab.id);
  });

  test('public URL is classified as WEB', async () => {
    const tab = await createTab('https://example.com');
    expect(tab.zone).toBe('WEB');
    await cleanupTab(tab.id);
  });

  test('HTTP public URL is classified as WEB', async () => {
    const tab = await createTab('http://example.org');
    expect(tab.zone).toBe('WEB');
    await cleanupTab(tab.id);
  });

  test('zone updates after navigation', async () => {
    const tab = await createTab('nightmare://newtab');
    expect(tab.zone).toBe('LOCAL');

    const res = await post(`/api/tabs/${tab.id}/navigate`, {
      url: 'https://example.com',
    });
    expect(res.status).toBe(200);
    const updated = (await res.json()) as TabResponse;
    expect(updated.zone).toBe('WEB');

    await cleanupTab(tab.id);
  });

  test('zone changes from WEB to LOCALHOST', async () => {
    const tab = await createTab('https://example.com');
    expect(tab.zone).toBe('WEB');

    const res = await post(`/api/tabs/${tab.id}/navigate`, {
      url: 'http://localhost:3000',
    });
    const updated = (await res.json()) as TabResponse;
    expect(updated.zone).toBe('LOCALHOST');

    await cleanupTab(tab.id);
  });
});

// ---------------------------------------------------------------------------
// Tab Management
// ---------------------------------------------------------------------------

test.describe('Tab management', () => {
  test('create multiple tabs and verify count', async () => {
    const stateBefore = await getState();
    const countBefore = stateBefore.tabCount;

    const tab1 = await createTab();
    const tab2 = await createTab();
    const tab3 = await createTab();

    const stateAfter = await getState();
    expect(stateAfter.tabCount).toBe(countBefore + 3);

    await cleanupTab(tab1.id);
    await cleanupTab(tab2.id);
    await cleanupTab(tab3.id);
  });

  test('most recently created tab becomes active', async () => {
    const tab1 = await createTab();
    const tab2 = await createTab();

    const state = await getState();
    expect(state.activeTabId).toBe(tab2.id);

    await cleanupTab(tab1.id);
    await cleanupTab(tab2.id);
  });

  test('switch active tab via activate', async () => {
    const tab1 = await createTab();
    const tab2 = await createTab();

    const res = await post(`/api/tabs/${tab1.id}/activate`);
    expect(res.status).toBe(200);

    const state = await getState();
    expect(state.activeTabId).toBe(tab1.id);

    await cleanupTab(tab1.id);
    await cleanupTab(tab2.id);
  });

  test('close tab and verify removal', async () => {
    const tab = await createTab();
    const tabId = tab.id;

    await cleanupTab(tabId);

    const res = await get(`/api/tabs/${tabId}`);
    expect(res.status).toBe(404);
  });

  test('close active tab activates another', async () => {
    const tab1 = await createTab();
    const tab2 = await createTab();

    await cleanupTab(tab2.id);

    const state = await getState();
    // After closing active tab, another should be active
    expect(state.tabCount).toBeGreaterThanOrEqual(1);
    expect(state.activeTabId).not.toBe(tab2.id);

    await cleanupTab(tab1.id);
  });

  test('duplicate tab creates copy with same URL', async () => {
    const original = await createTab('https://example.com');

    const res = await post(`/api/tabs/${original.id}/duplicate`);
    expect(res.status).toBe(201);
    const dup = (await res.json()) as TabResponse;
    expect(dup.url).toBe(original.url);
    expect(dup.id).not.toBe(original.id);

    await cleanupTab(original.id);
    await cleanupTab(dup.id);
  });

  test('pin tab prevents close', async () => {
    const tab = await createTab();

    // Pin the tab
    const pinRes = await post(`/api/tabs/${tab.id}/pin`);
    expect(pinRes.status).toBe(200);
    const pinBody = (await pinRes.json()) as { pinned: boolean };
    expect(pinBody.pinned).toBe(true);

    // Attempt to close pinned tab -- TabManager.closeTab ignores pinned tabs
    await del(`/api/tabs/${tab.id}`);

    // Tab should still exist because it is pinned
    const getRes = await get(`/api/tabs/${tab.id}`);
    expect(getRes.status).toBe(200);

    // Unpin and clean up
    await post(`/api/tabs/${tab.id}/pin`);
    await cleanupTab(tab.id);
  });

  test('duplicate nonexistent tab returns 404', async () => {
    const res = await post('/api/tabs/nonexistent-xxx/duplicate');
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Navigation (Forward, Back, Reload)
// ---------------------------------------------------------------------------

test.describe('Navigation flow', () => {
  test('full navigation cycle: navigate, back, forward, reload', async () => {
    const tab = await createTab();

    // Navigate to a URL
    const navRes = await post(`/api/tabs/${tab.id}/navigate`, {
      url: 'https://example.com',
    });
    expect(navRes.status).toBe(200);

    // Go back
    const backRes = await post(`/api/tabs/${tab.id}/back`);
    expect(backRes.status).toBe(200);
    const backBody = (await backRes.json()) as { navigating: string };
    expect(backBody.navigating).toBe('back');

    // Go forward
    const fwdRes = await post(`/api/tabs/${tab.id}/forward`);
    expect(fwdRes.status).toBe(200);
    const fwdBody = (await fwdRes.json()) as { navigating: string };
    expect(fwdBody.navigating).toBe('forward');

    // Reload
    const reloadRes = await post(`/api/tabs/${tab.id}/reload`);
    expect(reloadRes.status).toBe(200);
    const reloadBody = (await reloadRes.json()) as { reloading: boolean };
    expect(reloadBody.reloading).toBe(true);

    await cleanupTab(tab.id);
  });

  test('navigate updates tab URL and zone', async () => {
    const tab = await createTab();
    expect(tab.url).toBe('nightmare://newtab');
    expect(tab.zone).toBe('LOCAL');

    const navRes = await post(`/api/tabs/${tab.id}/navigate`, {
      url: 'https://github.com',
    });
    const updated = (await navRes.json()) as TabResponse;
    expect(updated.url).toBe('https://github.com');
    expect(updated.zone).toBe('WEB');

    await cleanupTab(tab.id);
  });

  test('multiple navigations update state correctly', async () => {
    const tab = await createTab();

    await post(`/api/tabs/${tab.id}/navigate`, {
      url: 'http://localhost:3000',
    });
    const state1 = await get(`/api/tabs/${tab.id}`);
    const tab1 = (await state1.json()) as TabResponse;
    expect(tab1.zone).toBe('LOCALHOST');

    await post(`/api/tabs/${tab.id}/navigate`, {
      url: 'https://example.com',
    });
    const state2 = await get(`/api/tabs/${tab.id}`);
    const tab2 = (await state2.json()) as TabResponse;
    expect(tab2.zone).toBe('WEB');

    await post(`/api/tabs/${tab.id}/navigate`, {
      url: 'file:///home/user/index.html',
    });
    const state3 = await get(`/api/tabs/${tab.id}`);
    const tab3 = (await state3.json()) as TabResponse;
    expect(tab3.zone).toBe('LOCAL');

    await cleanupTab(tab.id);
  });
});

// ---------------------------------------------------------------------------
// Find In Page
// ---------------------------------------------------------------------------

test.describe('Find in page', () => {
  test('find returns query and tab id', async () => {
    const tab = await createTab('https://example.com');

    const res = await post(`/api/tabs/${tab.id}/find`, {
      query: 'Example Domain',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { query: string; tabId: string };
    expect(body.query).toBe('Example Domain');
    expect(body.tabId).toBe(tab.id);

    await cleanupTab(tab.id);
  });

  test('find on nonexistent tab returns 404', async () => {
    const res = await post('/api/tabs/missing-id/find', {
      query: 'search',
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Combined Workflow
// ---------------------------------------------------------------------------

test.describe('Combined workflow', () => {
  test('full AI agent workflow: create, navigate, execute, screenshot, close', async () => {
    // Step 1: Create a tab
    const tab = await createTab();
    expect(tab.id).toBeTruthy();

    // Step 2: Navigate
    const navRes = await post(`/api/tabs/${tab.id}/navigate`, {
      url: 'https://example.com',
    });
    expect(navRes.status).toBe(200);

    // Step 3: Execute JS
    const execRes = await post(`/api/tabs/${tab.id}/execute`, {
      code: 'document.title',
    });
    expect(execRes.status).toBe(200);

    // Step 4: Take screenshot
    const ssRes = await get(`/api/tabs/${tab.id}/screenshot`);
    expect(ssRes.status).toBe(200);

    // Step 5: Get HTML
    const htmlRes = await get(`/api/tabs/${tab.id}/html`);
    expect(htmlRes.status).toBe(200);

    // Step 6: Click element
    const clickRes = await post(`/api/tabs/${tab.id}/click`, {
      selector: 'a',
    });
    expect(clickRes.status).toBe(200);

    // Step 7: Type into input
    const typeRes = await post(`/api/tabs/${tab.id}/type`, {
      selector: 'input',
      text: 'hello',
    });
    expect(typeRes.status).toBe(200);

    // Step 8: Check console
    const consoleRes = await get(`/api/tabs/${tab.id}/console`);
    expect(consoleRes.status).toBe(200);

    // Step 9: Get state
    const state = await getState();
    expect(state.tabCount).toBeGreaterThanOrEqual(1);

    // Step 10: Close
    await cleanupTab(tab.id);
  });

  test('multi-tab workflow with zone transitions', async () => {
    // Open a local tab
    const localTab = await createTab('file:///tmp/app.html');
    expect(localTab.zone).toBe('LOCAL');

    // Open a localhost tab
    const devTab = await createTab('http://localhost:3000');
    expect(devTab.zone).toBe('LOCALHOST');

    // Open a web tab
    const webTab = await createTab('https://example.com');
    expect(webTab.zone).toBe('WEB');

    // Verify all three are tracked
    const state = await getState();
    const tabIds = state.tabs.map((t) => t.id);
    expect(tabIds).toContain(localTab.id);
    expect(tabIds).toContain(devTab.id);
    expect(tabIds).toContain(webTab.id);

    // Activate the dev tab
    const actRes = await post(`/api/tabs/${devTab.id}/activate`);
    expect(actRes.status).toBe(200);

    const updatedState = await getState();
    expect(updatedState.activeTabId).toBe(devTab.id);

    // Clean up all
    await cleanupTab(localTab.id);
    await cleanupTab(devTab.id);
    await cleanupTab(webTab.id);
  });
});
