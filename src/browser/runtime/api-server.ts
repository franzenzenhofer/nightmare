/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BrowserDeps } from './types';
import { renderMarkdown } from '../services/markdown';
import { getMimeType } from '../services/file-server';

declare const require: (module: string) => any;
declare const Buffer: {
  concat(chunks: unknown[]): { toString(encoding: string): string; length: number };
  from(str: string, encoding: string): { length: number };
};

interface HttpRequest {
  readonly method: string;
  readonly url: string;
  on(event: string, handler: (data: unknown) => void): void;
}

interface HttpResponse {
  setHeader(name: string, value: string): void;
  writeHead(status: number, headers?: Record<string, string | number>): void;
  end(data?: string | Buffer): void;
}

interface HttpServer {
  listen(port: number, host: string, cb: () => void): void;
  close(): void;
  on(event: string, handler: (err: { code?: string; message: string }) => void): void;
  address(): { port: number };
}

function readBody(req: HttpRequest): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c: unknown) => { body += String(c); });
    req.on('end', () => { resolve(body); });
  });
}

function parseJson(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function serveStaticAsset(
  url: string,
  res: HttpResponse,
  srcDir: string,
): boolean {
  if (
    !url.startsWith('/styles/') &&
    !url.startsWith('/assets/') &&
    !url.startsWith('/pages/')
  ) {
    return false;
  }

  const path = require('path') as { join(...p: string[]): string; extname(p: string): string };
  const fs = require('fs') as { readFileSync(p: string): unknown };

  const staticPath = path.join(srcDir, url);
  try {
    const content = fs.readFileSync(staticPath);
    const ext = path.extname(staticPath).toLowerCase();
    res.writeHead(200, { 'Content-Type': getMimeType(ext) });
    res.end(content as string | Buffer);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`Not found: ${url}`);
  }
  return true;
}

function serveLocalFile(
  url: string,
  res: HttpResponse,
): boolean {
  if (!url.startsWith('/file/')) return false;

  const path = require('path') as {
    resolve(...p: string[]): string;
    extname(p: string): string;
    basename(p: string): string;
  };
  const fs = require('fs') as {
    readFileSync(p: string): { toString(enc: string): string };
  };

  const filePath = decodeURIComponent(url.substring(6));
  try {
    const resolved = path.resolve(filePath);
    const content = fs.readFileSync(resolved);
    const ext = path.extname(resolved).toLowerCase();

    if (ext === '.md') {
      const mdText = content.toString('utf-8');
      const htmlBody = renderMarkdown(mdText);
      const fileName = path.basename(resolved);
      const mdHtml = buildMdHtml(fileName, resolved, htmlBody);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(mdHtml);
      return true;
    }

    res.writeHead(200, { 'Content-Type': getMimeType(ext) });
    res.end(content as unknown as string | Buffer);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`File not found: ${filePath}`);
  }
  return true;
}

function buildMdHtml(
  fileName: string,
  resolved: string,
  htmlBody: string,
): string {
  return (
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' +
    fileName +
    '</title><style>' +
    'body{background:#0a0a14;color:#c8c8d8;font-family:"Cascadia Code","JetBrains Mono","Fira Code",monospace;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7;}' +
    'h1,h2,h3,h4,h5,h6{color:#ff4444;border-bottom:1px solid #1a1a2e;padding-bottom:8px;margin-top:32px;}' +
    'h1{font-size:1.8em;}h2{font-size:1.4em;}h3{font-size:1.2em;}' +
    'a{color:#60a5fa;text-decoration:none;}a:hover{text-decoration:underline;}' +
    'code{background:#1a1a2e;color:#4ade80;padding:2px 6px;border-radius:3px;font-size:0.9em;}' +
    'pre{background:#1a1a2e;padding:16px;border-radius:6px;overflow-x:auto;border:1px solid #333;}' +
    'pre code{background:none;padding:0;}' +
    'blockquote{border-left:3px solid #ff4444;margin-left:0;padding-left:16px;color:#888;}' +
    'img{max-width:100%;border-radius:6px;}' +
    'table{border-collapse:collapse;width:100%;}th,td{border:1px solid #333;padding:8px 12px;text-align:left;}th{background:#1a1a2e;}' +
    'hr{border:none;border-top:1px solid #333;margin:24px 0;}' +
    'ul,ol{padding-left:24px;}li{margin:4px 0;}' +
    '.nm-md-meta{color:#585a64;font-size:0.85em;border-bottom:1px solid #1a1a2e;padding-bottom:12px;margin-bottom:24px;}' +
    '</style></head><body>' +
    '<div class="nm-md-meta">nightmare://' +
    fileName +
    ' \u2500 ' +
    resolved +
    '</div>' +
    htmlBody +
    '</body></html>'
  );
}

function serveProxy(
  url: string,
  res: HttpResponse,
): boolean {
  if (!url.startsWith('/proxy/')) return false;

  const http = require('http') as { get: any };
  const https = require('https') as { get: any };

  const targetUrl = decodeURIComponent(url.substring(7));
  const proto = targetUrl.startsWith('https') ? https : http;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  proto
    .get(
      targetUrl,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Nightmare/1.0',
        },
        rejectUnauthorized: false,
      },
      (proxyRes: any) => {
        const chunks: unknown[] = [];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        proxyRes.on('data', (c: unknown) => {
          chunks.push(c);
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        proxyRes.on('end', () => {
          let body = Buffer.concat(chunks);
          const headers: Record<string, string | number> = {};
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const rawHeaders = (proxyRes.headers ?? {}) as Record<string, string>;
          for (const h of Object.keys(rawHeaders)) {
            const lower = h.toLowerCase();
            if (
              lower !== 'x-frame-options' &&
              lower !== 'content-security-policy' &&
              lower !== 'content-security-policy-report-only'
            ) {
              headers[h] = rawHeaders[h] ?? '';
            }
          }
          const rawCt = headers['content-type'];
          const ct = (typeof rawCt === 'string' ? rawCt : '').toLowerCase();
          if (ct.includes('text/html')) {
            let html = body.toString('utf-8');
            const baseUrl = targetUrl.replace(/[?#].*/, '');
            const baseTag = `<base href="${baseUrl}">`;
            if (html.includes('<head>')) {
              html = html.replace('<head>', `<head>${baseTag}`);
            } else if (html.includes('<HEAD>')) {
              html = html.replace('<HEAD>', `<HEAD>${baseTag}`);
            } else {
              html = baseTag + html;
            }
            body = Buffer.from(html, 'utf-8');
            headers['content-length'] = body.length;
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          res.writeHead((proxyRes.statusCode as number) || 200, headers);
          res.end(body as unknown as string | Buffer);
        });
      },
    )
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    .on('error', (e: { message: string }) => {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Proxy error: ${e.message}`);
    });

  return true;
}

function handleApiEndpoint(
  url: string,
  method: string,
  req: HttpRequest,
  res: HttpResponse,
  deps: BrowserDeps,
): void {
  res.setHeader('Content-Type', 'application/json');

  if (url === '/api/state' && method === 'GET') {
    handleGetState(res, deps);
    return;
  }
  if (url === '/api/tabs' && method === 'GET') {
    handleGetTabs(res, deps);
    return;
  }
  if (url === '/api/tabs' && method === 'POST') {
    void handleCreateTab(req, res, deps);
    return;
  }

  const tabIdMatch = url.match(/^\/api\/tabs\/([^/]+)$/);
  if (tabIdMatch?.[1] && method === 'GET') {
    handleGetTab(tabIdMatch[1], res, deps);
    return;
  }
  if (tabIdMatch?.[1] && method === 'DELETE') {
    deps.closeTab(tabIdMatch[1]);
    res.writeHead(204);
    res.end();
    return;
  }

  if (handleTabAction(url, method, req, res, deps)) return;
  if (handleScreenshot(url, method, res, deps)) return;
  if (handleResize(url, method, req, res, deps)) return;
  if (handleBookmarks(url, method, req, res, deps)) return;
  if (handleHistory(url, method, res, deps)) return;
  if (handleShutdown(url, method, res, deps)) return;

  sendNotFound(res);
}

function handleGetState(res: HttpResponse, deps: BrowserDeps): void {
  const tabList = deps.tabManager.getAllTabs().map((t) => deps.tabToJson(t));
  const active = deps.tabManager.getActiveTab();
  res.writeHead(200);
  res.end(
    JSON.stringify({
      tabs: tabList,
      activeTabId: active ? active.id : null,
      tabCount: deps.tabManager.getTabCount(),
      nodeVersion: process.version,
      apiPort: deps.apiPort,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime(),
    }),
  );
}

function handleGetTabs(res: HttpResponse, deps: BrowserDeps): void {
  res.writeHead(200);
  res.end(
    JSON.stringify(deps.tabManager.getAllTabs().map((t) => deps.tabToJson(t))),
  );
}

async function handleCreateTab(
  req: HttpRequest,
  res: HttpResponse,
  deps: BrowserDeps,
): Promise<void> {
  const body = await readBody(req);
  const parsed = parseJson(body);
  const tab = deps.createTab(parsed['url'] as string | undefined);
  res.writeHead(201);
  res.end(JSON.stringify(deps.tabToJson(tab)));
}

function handleGetTab(
  tabId: string,
  res: HttpResponse,
  deps: BrowserDeps,
): void {
  const t = deps.tabManager.getTab(tabId);
  if (!t) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  res.writeHead(200);
  res.end(JSON.stringify(deps.tabToJson(t)));
}

function handleTabAction(
  url: string,
  method: string,
  req: HttpRequest,
  res: HttpResponse,
  deps: BrowserDeps,
): boolean {
  const navMatch = url.match(/^\/api\/tabs\/([^/]+)\/navigate$/);
  if (navMatch?.[1] && method === 'POST') {
    void handleNavigate(navMatch[1], req, res, deps);
    return true;
  }

  const reloadMatch = url.match(/^\/api\/tabs\/([^/]+)\/reload$/);
  if (reloadMatch?.[1] && method === 'POST') {
    handleReload(reloadMatch[1], res, deps);
    return true;
  }

  const activateMatch = url.match(/^\/api\/tabs\/([^/]+)\/activate$/);
  if (activateMatch?.[1] && method === 'POST') {
    handleActivate(activateMatch[1], res, deps);
    return true;
  }

  const htmlMatch = url.match(/^\/api\/tabs\/([^/]+)\/html$/);
  if (htmlMatch?.[1] && method === 'GET') {
    handleGetHtml(htmlMatch[1], res, deps);
    return true;
  }

  const execMatch = url.match(/^\/api\/tabs\/([^/]+)\/execute$/);
  if (execMatch?.[1] && method === 'POST') {
    void handleExecute(execMatch[1], req, res, deps);
    return true;
  }

  const clickMatch = url.match(/^\/api\/tabs\/([^/]+)\/click$/);
  if (clickMatch?.[1] && method === 'POST') {
    void handleClick(clickMatch[1], req, res, deps);
    return true;
  }

  const typeMatch = url.match(/^\/api\/tabs\/([^/]+)\/type$/);
  if (typeMatch?.[1] && method === 'POST') {
    void handleType(typeMatch[1], req, res, deps);
    return true;
  }

  const findMatch = url.match(/^\/api\/tabs\/([^/]+)\/find$/);
  if (findMatch?.[1] && method === 'POST') {
    void handleFind(findMatch[1], req, res, deps);
    return true;
  }

  const scrollMatch = url.match(/^\/api\/tabs\/([^/]+)\/scroll$/);
  if (scrollMatch?.[1] && method === 'POST') {
    void handleScroll(scrollMatch[1], req, res, deps);
    return true;
  }

  const textMatch = url.match(/^\/api\/tabs\/([^/]+)\/text$/);
  if (textMatch?.[1] && method === 'GET') {
    handleGetText(textMatch[1], res, deps);
    return true;
  }

  const backMatch = url.match(/^\/api\/tabs\/([^/]+)\/back$/);
  if (backMatch?.[1] && method === 'POST') {
    handleBack(backMatch[1], res, deps);
    return true;
  }

  const fwdMatch = url.match(/^\/api\/tabs\/([^/]+)\/forward$/);
  if (fwdMatch?.[1] && method === 'POST') {
    handleForward(fwdMatch[1], res, deps);
    return true;
  }

  const tabScreenshotMatch = url.match(
    /^\/api\/tabs\/([^/]+)\/screenshot$/,
  );
  if (tabScreenshotMatch?.[1] && method === 'GET') {
    handleTabScreenshot(tabScreenshotMatch[1], res, deps);
    return true;
  }

  return false;
}

async function handleNavigate(
  tabId: string,
  req: HttpRequest,
  res: HttpResponse,
  deps: BrowserDeps,
): Promise<void> {
  const body = await readBody(req);
  const parsed = parseJson(body);
  const tab = deps.getFullTab(tabId);
  if (!tab) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  deps.navigateTab(tab, deps.resolveUrl(parsed['url'] as string));
  const tabData = deps.tabManager.getTab(tabId);
  res.writeHead(200);
  res.end(JSON.stringify(deps.tabToJson(tabData ?? tab)));
}

function handleReload(
  tabId: string,
  res: HttpResponse,
  deps: BrowserDeps,
): void {
  const rt = deps.getFullTab(tabId);
  if (!rt) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  rt.frame.src = rt.url;
  res.writeHead(200);
  res.end(JSON.stringify(deps.tabToJson(rt)));
}

function handleActivate(
  tabId: string,
  res: HttpResponse,
  deps: BrowserDeps,
): void {
  if (!deps.tabManager.hasTab(tabId)) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  deps.activateTab(tabId);
  const atData = deps.tabManager.getTab(tabId);
  res.writeHead(200);
  res.end(JSON.stringify(deps.tabToJson(atData ?? { id: tabId })));
}

function handleGetHtml(
  tabId: string,
  res: HttpResponse,
  deps: BrowserDeps,
): void {
  const ht = deps.getFullTab(tabId);
  if (!ht) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  deps.executeInFrame(
    ht.frame,
    'document.documentElement.outerHTML',
    (err, htmlContent) => {
      res.writeHead(200);
      if (err) {
        res.end(
          JSON.stringify({
            tabId: ht.id,
            html: null,
            error: 'Cross-origin: cannot read HTML',
          }),
        );
      } else {
        res.end(JSON.stringify({ tabId: ht.id, html: htmlContent }));
      }
    },
  );
}

async function handleExecute(
  tabId: string,
  req: HttpRequest,
  res: HttpResponse,
  deps: BrowserDeps,
): Promise<void> {
  const body = await readBody(req);
  const parsed = parseJson(body);
  const et = deps.getFullTab(tabId);
  if (!et) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  deps.executeInFrame(et.frame, parsed['code'] as string, (err, result) => {
    res.writeHead(200);
    if (err) {
      res.end(JSON.stringify({ tabId: et.id, error: err.message }));
    } else {
      res.end(JSON.stringify({ tabId: et.id, result: String(result) }));
    }
  });
}

async function handleClick(
  tabId: string,
  req: HttpRequest,
  res: HttpResponse,
  deps: BrowserDeps,
): Promise<void> {
  const body = await readBody(req);
  const parsed = parseJson(body);
  const ct = deps.getFullTab(tabId);
  if (!ct) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  const clickCode = `var el = document.querySelector(${JSON.stringify(parsed['selector'])}); if (el) { el.click(); "clicked" } else { "not_found" }`;
  deps.executeInFrame(ct.frame, clickCode, (err, clickResult) => {
    res.writeHead(200);
    if (err) {
      res.end(JSON.stringify({ tabId: ct.id, error: err.message }));
    } else {
      res.end(
        JSON.stringify({
          tabId: ct.id,
          selector: parsed['selector'],
          result: clickResult,
        }),
      );
    }
  });
}

async function handleType(
  tabId: string,
  req: HttpRequest,
  res: HttpResponse,
  deps: BrowserDeps,
): Promise<void> {
  const body = await readBody(req);
  const parsed = parseJson(body);
  const tt = deps.getFullTab(tabId);
  if (!tt) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  const clearPart = parsed['clear'] === true ? ' el.value = "";' : '';
  const typeCode =
    `var el = document.querySelector(${JSON.stringify(parsed['selector'])}); if (el) { el.focus();${clearPart}` +
    ` el.value += ${JSON.stringify(typeof parsed['text'] === 'string' ? parsed['text'] : '')};` +
    ' el.dispatchEvent(new Event("input", {bubbles:true}));' +
    ' el.dispatchEvent(new Event("change", {bubbles:true}));' +
    ' "typed" } else { "not_found" }';
  deps.executeInFrame(tt.frame, typeCode, (err, typeResult) => {
    res.writeHead(200);
    if (err) {
      res.end(JSON.stringify({ tabId: tt.id, error: err.message }));
    } else {
      res.end(
        JSON.stringify({
          tabId: tt.id,
          selector: parsed['selector'],
          result: typeResult,
        }),
      );
    }
  });
}

async function handleFind(
  tabId: string,
  req: HttpRequest,
  res: HttpResponse,
  deps: BrowserDeps,
): Promise<void> {
  const body = await readBody(req);
  const parsed = parseJson(body);
  const ft = deps.getFullTab(tabId);
  if (!ft) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  const limit = Number(parsed['limit']) || 50;
  const findCode =
    `(function() { var els = document.querySelectorAll(${JSON.stringify(parsed['selector'])});` +
    ` return JSON.stringify(Array.from(els).slice(0, ${String(limit)}).map(function(el) {` +
    '   var rect = el.getBoundingClientRect();' +
    '   var attrs = {};' +
    '   for (var i = 0; i < el.attributes.length; i++) { attrs[el.attributes[i].name] = el.attributes[i].value; }' +
    '   return { tag: el.tagName, text: (el.textContent || "").substring(0, 200), id: el.id, className: el.className,' +
    '     href: el.href || null, src: el.src || null, value: el.value || null,' +
    '     visible: rect.width > 0 && rect.height > 0,' +
    '     rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }, attrs: attrs };' +
    ' })); })()';
  deps.executeInFrame(ft.frame, findCode, (err, findResult) => {
    res.writeHead(200);
    if (err) {
      res.end(JSON.stringify({ tabId: ft.id, error: err.message }));
    } else {
      try {
        res.end(
          JSON.stringify({
            tabId: ft.id,
            selector: parsed['selector'],
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            elements: JSON.parse(String(findResult)),
          }),
        );
      } catch {
        res.end(
          JSON.stringify({
            tabId: ft.id,
            selector: parsed['selector'],
            elements: [],
            error: 'Parse error',
          }),
        );
      }
    }
  });
}

async function handleScroll(
  tabId: string,
  req: HttpRequest,
  res: HttpResponse,
  deps: BrowserDeps,
): Promise<void> {
  const body = await readBody(req);
  const parsed = parseJson(body);
  const st = deps.getFullTab(tabId);
  if (!st) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  let scrollCode: string;
  if (parsed['selector']) {
    scrollCode = `var el = document.querySelector(${JSON.stringify(parsed['selector'])}); if (el) { el.scrollIntoView({behavior:"smooth",block:"center"}); "scrolled" } else { "not_found" }`;
  } else {
    scrollCode = `window.scrollTo(${String(Number(parsed['x']) || 0)},${String(Number(parsed['y']) || 0)}); "scrolled"`;
  }
  deps.executeInFrame(st.frame, scrollCode, (err, scrollResult) => {
    res.writeHead(200);
    if (err) {
      res.end(JSON.stringify({ tabId: st.id, error: err.message }));
    } else {
      res.end(
        JSON.stringify({ tabId: st.id, result: scrollResult }),
      );
    }
  });
}

function handleGetText(
  tabId: string,
  res: HttpResponse,
  deps: BrowserDeps,
): void {
  const txtt = deps.getFullTab(tabId);
  if (!txtt) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  deps.executeInFrame(
    txtt.frame,
    'document.body ? document.body.innerText : ""',
    (err, textResult) => {
      res.writeHead(200);
      if (err) {
        res.end(
          JSON.stringify({ tabId: txtt.id, error: err.message }),
        );
      } else {
        res.end(
          JSON.stringify({ tabId: txtt.id, text: textResult }),
        );
      }
    },
  );
}

function handleBack(
  tabId: string,
  res: HttpResponse,
  deps: BrowserDeps,
): void {
  const bt = deps.getFullTab(tabId);
  if (!bt) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  const bstate = deps.navState.get(bt.id);
  if (bstate && bstate.depth > 0) {
    bstate.isBackForward = true;
    bstate.depth--;
    bstate.forwardDepth++;
    try {
      bt.frame.contentWindow?.history.back();
    } catch {
      // cross-origin
    }
  }
  res.writeHead(200);
  res.end(JSON.stringify(deps.tabToJson(bt)));
}

function handleForward(
  tabId: string,
  res: HttpResponse,
  deps: BrowserDeps,
): void {
  const fwdt = deps.getFullTab(tabId);
  if (!fwdt) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  const fstate = deps.navState.get(fwdt.id);
  if (fstate && fstate.forwardDepth > 0) {
    fstate.isBackForward = true;
    fstate.depth++;
    fstate.forwardDepth--;
    try {
      fwdt.frame.contentWindow?.history.forward();
    } catch {
      // cross-origin
    }
  }
  res.writeHead(200);
  res.end(JSON.stringify(deps.tabToJson(fwdt)));
}

function handleTabScreenshot(
  tabId: string,
  res: HttpResponse,
  deps: BrowserDeps,
): void {
  const sst = deps.getFullTab(tabId);
  if (!sst) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Tab not found' }));
    return;
  }
  try {
    const frameDoc = sst.frame.contentDocument;
    const w = frameDoc?.documentElement.scrollWidth ?? 0;
    const h = frameDoc?.documentElement.scrollHeight ?? 0;
    res.writeHead(200);
    res.end(
      JSON.stringify({
        tabId: sst.id,
        width: w,
        height: h,
        note: 'Use GET /api/screenshot for full window capture. Per-tab capture requires activating the tab first.',
      }),
    );
  } catch (e) {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        tabId: sst.id,
        error: `Cross-origin or capture error: ${(e as Error).message}`,
      }),
    );
  }
}

function handleScreenshot(
  url: string,
  method: string,
  res: HttpResponse,
  deps: BrowserDeps,
): boolean {
  const screenshotMatch = url.match(/^\/api\/screenshot(\?.*)?$/);
  if (!screenshotMatch || method !== 'GET') return false;

  if (!deps.win) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'No window handle' }));
    return true;
  }
  const params = new URLSearchParams(url.split('?')[1] ?? '');
  const sWidth = parseInt(params.get('width') ?? '0', 10);
  const sHeight = parseInt(params.get('height') ?? '0', 10);
  const sFormat = params.get('format') === 'jpeg' ? 'jpeg' : 'png';

  const doCapture = (): void => {
    deps.win?.capturePage(
      (buffer: Buffer) => {
        const base64 = buffer.toString('base64');
        res.writeHead(200);
        res.end(
          JSON.stringify({
            format: sFormat,
            width: sWidth || null,
            height: sHeight || null,
            data: base64,
          }),
        );
      },
      { format: sFormat, datatype: 'buffer' },
    );
  };

  if (sWidth > 0 && sHeight > 0) {
    const origW = deps.win.width;
    const origH = deps.win.height;
    deps.win.resizeTo(sWidth, sHeight);
    setTimeout(() => {
      doCapture();
      deps.win?.resizeTo(origW, origH);
    }, 300);
  } else {
    doCapture();
  }
  return true;
}

function handleResize(
  url: string,
  method: string,
  req: HttpRequest,
  res: HttpResponse,
  deps: BrowserDeps,
): boolean {
  const resizeMatch = url.match(/^\/api\/resize(\?.*)?$/);
  if (!resizeMatch || method !== 'POST') return false;
  if (!deps.win) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'No window handle' }));
    return true;
  }
  void readBody(req).then((body) => {
    const parsed = parseJson(body);
    const rw = (parsed['width'] as number) || 1280;
    const rh = (parsed['height'] as number) || 800;
    deps.win?.resizeTo(rw, rh);
    res.writeHead(200);
    res.end(JSON.stringify({ width: rw, height: rh }));
  });
  return true;
}

function handleBookmarks(
  url: string,
  method: string,
  req: HttpRequest,
  res: HttpResponse,
  deps: BrowserDeps,
): boolean {
  if (url === '/api/bookmarks' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(deps.bookmarkManager.getAll()));
    return true;
  }
  if (url === '/api/bookmarks' && method === 'POST') {
    void readBody(req).then((body) => {
      const parsed = parseJson(body);
      deps.addBookmark(
        parsed['url'] as string,
        parsed['title'] as string | undefined,
      );
      res.writeHead(201);
      res.end(JSON.stringify({ added: true }));
    });
    return true;
  }
  return false;
}

function handleHistory(
  url: string,
  method: string,
  res: HttpResponse,
  deps: BrowserDeps,
): boolean {
  if (url === '/api/history' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(deps.historyManager.getRecent(100)));
    return true;
  }
  return false;
}

function handleShutdown(
  url: string,
  method: string,
  res: HttpResponse,
  deps: BrowserDeps,
): boolean {
  if (url === '/api/shutdown' && method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'shutting down' }));
    setTimeout(() => {
      if (deps.win) deps.win.close();
    }, 100);
    return true;
  }
  return false;
}

function sendNotFound(res: HttpResponse): void {
  res.writeHead(404);
  res.end(
    JSON.stringify({
      error: 'Not found',
      available: [
        'GET /api/state',
        'GET /api/tabs',
        'POST /api/tabs',
        'GET /api/tabs/:id',
        'DELETE /api/tabs/:id',
        'POST /api/tabs/:id/navigate',
        'POST /api/tabs/:id/reload',
        'POST /api/tabs/:id/activate',
        'GET /api/tabs/:id/html',
        'POST /api/tabs/:id/execute',
        'GET /api/tabs/:id/text',
        'GET /api/tabs/:id/screenshot',
        'POST /api/tabs/:id/click',
        'POST /api/tabs/:id/type',
        'POST /api/tabs/:id/find',
        'POST /api/tabs/:id/scroll',
        'POST /api/tabs/:id/back',
        'POST /api/tabs/:id/forward',
        'GET /api/screenshot',
        'POST /api/resize',
        'GET /api/bookmarks',
        'POST /api/bookmarks',
        'GET /api/history',
        'POST /api/shutdown',
      ],
    }),
  );
}

export interface ServerResult {
  readonly server: HttpServer;
  readonly getPort: () => number;
}

export function createApiServer(deps: BrowserDeps): ServerResult {
  const http = require('http') as {
    createServer(
      handler: (req: HttpRequest, res: HttpResponse) => void,
    ): HttpServer;
  };

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, DELETE, PUT, PATCH, OPTIONS',
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = req.url || '/';

    if (serveStaticAsset(url, res, deps.srcDir)) return;
    if (serveLocalFile(url, res)) return;
    if (serveProxy(url, res)) return;

    handleApiEndpoint(url, req.method, req, res, deps);
  });

  return {
    server,
    getPort: () => deps.apiPort,
  };
}
