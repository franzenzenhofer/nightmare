// HTTP server — API endpoints + file serving + reverse proxy
// Depends on: http, https, fs, path, os, _srcDir, _dataDir, API_PORT, samplesDir, pagesDir,
//   tabs, activeTabId, navState, win, and all function modules (globals)

var server = http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  var url = req.url || '/';

  // ---- Static assets ----
  if (url.startsWith('/styles/') || url.startsWith('/assets/') || url.startsWith('/pages/')) {
    var staticPath = path.join(_srcDir, url);
    try {
      var staticContent = fs.readFileSync(staticPath);
      var staticExt = path.extname(staticPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': serveMimeType(staticExt) });
      res.end(staticContent);
    } catch(e) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + url);
    }
    return;
  }

  // ---- Local file serving ----
  if (url.startsWith('/file/')) {
    var filePath = decodeURIComponent(url.substring(6));
    try {
      var resolved = path.resolve(filePath);
      var content = fs.readFileSync(resolved);
      var ext = path.extname(resolved).toLowerCase();

      if (ext === '.md') {
        var mdText = content.toString('utf-8');
        var htmlBody = renderMarkdown(mdText);
        var fileName = path.basename(resolved);
        var mdHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + fileName + '</title>' +
          '<style>' +
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
          '<div class="nm-md-meta">nightmare://' + fileName + ' \u2500 ' + resolved + '</div>' +
          htmlBody + '</body></html>';
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(mdHtml);
        return;
      }

      res.writeHead(200, { 'Content-Type': serveMimeType(ext) });
      res.end(content);
    } catch(e) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found: ' + filePath);
    }
    return;
  }

  // ---- Reverse proxy ----
  if (url.startsWith('/proxy/')) {
    var targetUrl = decodeURIComponent(url.substring(7));
    var proto = targetUrl.startsWith('https') ? https : http;
    proto.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Nightmare/1.0' } }, function(proxyRes) {
      var chunks = [];
      proxyRes.on('data', function(c) { chunks.push(c); });
      proxyRes.on('end', function() {
        var body = Buffer.concat(chunks);
        var headers = {};
        Object.keys(proxyRes.headers).forEach(function(h) {
          var lower = h.toLowerCase();
          if (lower !== 'x-frame-options' && lower !== 'content-security-policy' && lower !== 'content-security-policy-report-only') {
            headers[h] = proxyRes.headers[h];
          }
        });
        var ct = (headers['content-type'] || '').toLowerCase();
        if (ct.includes('text/html')) {
          var html = body.toString('utf-8');
          var baseUrl = targetUrl.replace(/[?#].*/, '');
          var baseTag = '<base href="' + baseUrl + '">';
          if (html.includes('<head>')) {
            html = html.replace('<head>', '<head>' + baseTag);
          } else if (html.includes('<HEAD>')) {
            html = html.replace('<HEAD>', '<HEAD>' + baseTag);
          } else {
            html = baseTag + html;
          }
          body = Buffer.from(html, 'utf-8');
          headers['content-length'] = String(body.length);
        }
        res.writeHead(proxyRes.statusCode || 200, headers);
        res.end(body);
      });
    }).on('error', function(e) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Proxy error: ' + e.message);
    });
    return;
  }

  // ---- API endpoints ----
  res.setHeader('Content-Type', 'application/json');

  if (url === '/api/state' && req.method === 'GET') {
    var tabList = [];
    tabs.forEach(function(t) { tabList.push(tabToJson(t)); });
    res.writeHead(200);
    res.end(JSON.stringify({
      tabs: tabList, activeTabId: activeTabId, tabCount: tabs.size,
      nodeVersion: process.version, apiPort: API_PORT,
      platform: process.platform, arch: process.arch,
      pid: process.pid, uptime: process.uptime()
    }));
    return;
  }

  if (url === '/api/tabs' && req.method === 'GET') {
    var list = [];
    tabs.forEach(function(t) { list.push(tabToJson(t)); });
    res.writeHead(200);
    res.end(JSON.stringify(list));
    return;
  }

  if (url === '/api/tabs' && req.method === 'POST') {
    var body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', function() {
      var parsed = {};
      try { parsed = JSON.parse(body); } catch(e) {}
      var tab = createTab(parsed.url);
      res.writeHead(201);
      res.end(JSON.stringify(tabToJson(tab)));
    });
    return;
  }

  var tabIdMatch = url.match(/^\/api\/tabs\/([^/]+)$/);
  if (tabIdMatch && req.method === 'GET') {
    var t = tabs.get(tabIdMatch[1]);
    if (!t) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
    res.writeHead(200);
    res.end(JSON.stringify(tabToJson(t)));
    return;
  }
  if (tabIdMatch && req.method === 'DELETE') {
    closeTab(tabIdMatch[1]);
    res.writeHead(204);
    res.end();
    return;
  }

  var navMatch = url.match(/^\/api\/tabs\/([^/]+)\/navigate$/);
  if (navMatch && req.method === 'POST') {
    var nbody = '';
    req.on('data', function(c) { nbody += c; });
    req.on('end', function() {
      var parsed2 = {};
      try { parsed2 = JSON.parse(nbody); } catch(e) {}
      var tab2 = tabs.get(navMatch[1]);
      if (!tab2) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
      navigateTab(tab2, resolveUrl(parsed2.url));
      res.writeHead(200);
      res.end(JSON.stringify(tabToJson(tab2)));
    });
    return;
  }

  var reloadMatch = url.match(/^\/api\/tabs\/([^/]+)\/reload$/);
  if (reloadMatch && req.method === 'POST') {
    var rt = tabs.get(reloadMatch[1]);
    if (!rt) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
    rt.frame.src = rt.url;
    res.writeHead(200);
    res.end(JSON.stringify(tabToJson(rt)));
    return;
  }

  var activateMatch = url.match(/^\/api\/tabs\/([^/]+)\/activate$/);
  if (activateMatch && req.method === 'POST') {
    var at = tabs.get(activateMatch[1]);
    if (!at) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
    activateTab(activateMatch[1]);
    res.writeHead(200);
    res.end(JSON.stringify(tabToJson(at)));
    return;
  }

  var htmlMatch = url.match(/^\/api\/tabs\/([^/]+)\/html$/);
  if (htmlMatch && req.method === 'GET') {
    var ht = tabs.get(htmlMatch[1]);
    if (!ht) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
    executeInFrame(ht.frame, 'document.documentElement.outerHTML', function(err, htmlContent) {
      res.writeHead(200);
      if (err) { res.end(JSON.stringify({ tabId: ht.id, html: null, error: 'Cross-origin: cannot read HTML' })); }
      else { res.end(JSON.stringify({ tabId: ht.id, html: htmlContent })); }
    });
    return;
  }

  var execMatch = url.match(/^\/api\/tabs\/([^/]+)\/execute$/);
  if (execMatch && req.method === 'POST') {
    var ebody = '';
    req.on('data', function(c) { ebody += c; });
    req.on('end', function() {
      var eparsed = {};
      try { eparsed = JSON.parse(ebody); } catch(e) {}
      var et = tabs.get(execMatch[1]);
      if (!et) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
      executeInFrame(et.frame, eparsed.code, function(err, result) {
        res.writeHead(200);
        if (err) { res.end(JSON.stringify({ tabId: et.id, error: err.message })); }
        else { res.end(JSON.stringify({ tabId: et.id, result: String(result) })); }
      });
    });
    return;
  }

  var screenshotMatch = url.match(/^\/api\/screenshot(\?.*)?$/);
  if (screenshotMatch && req.method === 'GET') {
    if (!win) { res.writeHead(500); res.end(JSON.stringify({error:'No window handle'})); return; }
    var params = new URLSearchParams(url.split('?')[1] || '');
    var sWidth = parseInt(params.get('width') || '0', 10);
    var sHeight = parseInt(params.get('height') || '0', 10);
    var sFormat = params.get('format') === 'jpeg' ? 'jpeg' : 'png';
    var doCapture = function() {
      win.capturePage(function(buffer) {
        var base64 = buffer.toString('base64');
        res.writeHead(200);
        res.end(JSON.stringify({ format: sFormat, width: sWidth || null, height: sHeight || null, data: base64 }));
      }, { format: sFormat, datatype: 'buffer' });
    };
    if (sWidth > 0 && sHeight > 0) {
      var origW = win.width; var origH = win.height;
      win.resizeTo(sWidth, sHeight);
      setTimeout(function() { doCapture(); win.resizeTo(origW, origH); }, 300);
    } else {
      doCapture();
    }
    return;
  }

  var tabScreenshotMatch = url.match(/^\/api\/tabs\/([^/]+)\/screenshot$/);
  if (tabScreenshotMatch && req.method === 'GET') {
    var sst = tabs.get(tabScreenshotMatch[1]);
    if (!sst) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
    try {
      var frameDoc = sst.frame.contentDocument;
      var w = frameDoc.documentElement.scrollWidth;
      var h = frameDoc.documentElement.scrollHeight;
      res.writeHead(200);
      res.end(JSON.stringify({ tabId: sst.id, width: w, height: h, note: 'Use GET /api/screenshot for full window capture. Per-tab capture requires activating the tab first.' }));
    } catch(e) {
      res.writeHead(200);
      res.end(JSON.stringify({ tabId: sst.id, error: 'Cross-origin or capture error: ' + e.message }));
    }
    return;
  }

  var resizeMatch = url.match(/^\/api\/resize(\?.*)?$/);
  if (resizeMatch && req.method === 'POST') {
    if (!win) { res.writeHead(500); res.end(JSON.stringify({error:'No window handle'})); return; }
    var rbody = '';
    req.on('data', function(c) { rbody += c; });
    req.on('end', function() {
      var rparsed = {};
      try { rparsed = JSON.parse(rbody); } catch(e) {}
      var rw = rparsed.width || 1280;
      var rh = rparsed.height || 800;
      win.resizeTo(rw, rh);
      res.writeHead(200);
      res.end(JSON.stringify({ width: rw, height: rh }));
    });
    return;
  }

  var clickMatch = url.match(/^\/api\/tabs\/([^/]+)\/click$/);
  if (clickMatch && req.method === 'POST') {
    var cbody = '';
    req.on('data', function(c) { cbody += c; });
    req.on('end', function() {
      var cparsed = {};
      try { cparsed = JSON.parse(cbody); } catch(e) {}
      var ct = tabs.get(clickMatch[1]);
      if (!ct) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
      var clickCode = 'var el = document.querySelector(' + JSON.stringify(cparsed.selector) + '); if (el) { el.click(); "clicked" } else { "not_found" }';
      executeInFrame(ct.frame, clickCode, function(err, clickResult) {
        res.writeHead(200);
        if (err) { res.end(JSON.stringify({ tabId: ct.id, error: err.message })); }
        else { res.end(JSON.stringify({ tabId: ct.id, selector: cparsed.selector, result: clickResult })); }
      });
    });
    return;
  }

  var typeMatch = url.match(/^\/api\/tabs\/([^/]+)\/type$/);
  if (typeMatch && req.method === 'POST') {
    var tbody = '';
    req.on('data', function(c) { tbody += c; });
    req.on('end', function() {
      var tparsed = {};
      try { tparsed = JSON.parse(tbody); } catch(e) {}
      var tt = tabs.get(typeMatch[1]);
      if (!tt) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
      var typeCode = 'var el = document.querySelector(' + JSON.stringify(tparsed.selector) + '); if (el) { el.focus();' +
        (tparsed.clear ? ' el.value = "";' : '') +
        ' el.value += ' + JSON.stringify(tparsed.text || '') + ';' +
        ' el.dispatchEvent(new Event("input", {bubbles:true}));' +
        ' el.dispatchEvent(new Event("change", {bubbles:true}));' +
        ' "typed" } else { "not_found" }';
      executeInFrame(tt.frame, typeCode, function(err, typeResult) {
        res.writeHead(200);
        if (err) { res.end(JSON.stringify({ tabId: tt.id, error: err.message })); }
        else { res.end(JSON.stringify({ tabId: tt.id, selector: tparsed.selector, result: typeResult })); }
      });
    });
    return;
  }

  var findMatch = url.match(/^\/api\/tabs\/([^/]+)\/find$/);
  if (findMatch && req.method === 'POST') {
    var fbody = '';
    req.on('data', function(c) { fbody += c; });
    req.on('end', function() {
      var fparsed = {};
      try { fparsed = JSON.parse(fbody); } catch(e) {}
      var ft = tabs.get(findMatch[1]);
      if (!ft) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
      var findCode = '(function() { var els = document.querySelectorAll(' + JSON.stringify(fparsed.selector) + ');' +
        ' return JSON.stringify(Array.from(els).slice(0, ' + (fparsed.limit || 50) + ').map(function(el) {' +
        '   var rect = el.getBoundingClientRect();' +
        '   var attrs = {};' +
        '   for (var i = 0; i < el.attributes.length; i++) { attrs[el.attributes[i].name] = el.attributes[i].value; }' +
        '   return { tag: el.tagName, text: (el.textContent || "").substring(0, 200), id: el.id, className: el.className,' +
        '     href: el.href || null, src: el.src || null, value: el.value || null,' +
        '     visible: rect.width > 0 && rect.height > 0,' +
        '     rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }, attrs: attrs };' +
        ' })); })()';
      executeInFrame(ft.frame, findCode, function(err, findResult) {
        res.writeHead(200);
        if (err) { res.end(JSON.stringify({ tabId: ft.id, error: err.message })); }
        else {
          try { res.end(JSON.stringify({ tabId: ft.id, selector: fparsed.selector, elements: JSON.parse(findResult) })); }
          catch(pe) { res.end(JSON.stringify({ tabId: ft.id, selector: fparsed.selector, elements: [], error: 'Parse error' })); }
        }
      });
    });
    return;
  }

  var scrollMatch = url.match(/^\/api\/tabs\/([^/]+)\/scroll$/);
  if (scrollMatch && req.method === 'POST') {
    var sbody = '';
    req.on('data', function(c) { sbody += c; });
    req.on('end', function() {
      var sparsed = {};
      try { sparsed = JSON.parse(sbody); } catch(e) {}
      var st = tabs.get(scrollMatch[1]);
      if (!st) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
      var scrollCode;
      if (sparsed.selector) {
        scrollCode = 'var el = document.querySelector(' + JSON.stringify(sparsed.selector) + '); if (el) { el.scrollIntoView({behavior:"smooth",block:"center"}); "scrolled" } else { "not_found" }';
      } else {
        scrollCode = 'window.scrollTo(' + (sparsed.x || 0) + ',' + (sparsed.y || 0) + '); "scrolled"';
      }
      executeInFrame(st.frame, scrollCode, function(err, scrollResult) {
        res.writeHead(200);
        if (err) { res.end(JSON.stringify({ tabId: st.id, error: err.message })); }
        else { res.end(JSON.stringify({ tabId: st.id, result: scrollResult })); }
      });
    });
    return;
  }

  var textMatch = url.match(/^\/api\/tabs\/([^/]+)\/text$/);
  if (textMatch && req.method === 'GET') {
    var txtt = tabs.get(textMatch[1]);
    if (!txtt) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
    var textCode = 'document.body ? document.body.innerText : ""';
    executeInFrame(txtt.frame, textCode, function(err, textResult) {
      res.writeHead(200);
      if (err) { res.end(JSON.stringify({ tabId: txtt.id, error: err.message })); }
      else { res.end(JSON.stringify({ tabId: txtt.id, text: textResult })); }
    });
    return;
  }

  if (url === '/api/bookmarks' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(userBookmarks));
    return;
  }
  if (url === '/api/bookmarks' && req.method === 'POST') {
    var bbody = '';
    req.on('data', function(c) { bbody += c; });
    req.on('end', function() {
      var bparsed = {};
      try { bparsed = JSON.parse(bbody); } catch(e) {}
      addBookmark(bparsed.url, bparsed.title);
      res.writeHead(201);
      res.end(JSON.stringify({ added: true }));
    });
    return;
  }

  if (url === '/api/history' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(browsingHistory.slice(0, 100)));
    return;
  }

  var backMatch = url.match(/^\/api\/tabs\/([^/]+)\/back$/);
  if (backMatch && req.method === 'POST') {
    var bt = tabs.get(backMatch[1]);
    if (!bt) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
    var bstate = navState.get(bt.id);
    if (bstate && bstate.depth > 0) {
      bstate.isBackForward = true; bstate.depth--; bstate.forwardDepth++;
      try { bt.frame.contentWindow.history.back(); } catch(e) {}
    }
    res.writeHead(200);
    res.end(JSON.stringify(tabToJson(bt)));
    return;
  }

  var fwdMatch = url.match(/^\/api\/tabs\/([^/]+)\/forward$/);
  if (fwdMatch && req.method === 'POST') {
    var fwdt = tabs.get(fwdMatch[1]);
    if (!fwdt) { res.writeHead(404); res.end(JSON.stringify({error:'Tab not found'})); return; }
    var fstate = navState.get(fwdt.id);
    if (fstate && fstate.forwardDepth > 0) {
      fstate.isBackForward = true; fstate.depth++; fstate.forwardDepth--;
      try { fwdt.frame.contentWindow.history.forward(); } catch(e) {}
    }
    res.writeHead(200);
    res.end(JSON.stringify(tabToJson(fwdt)));
    return;
  }

  if (url === '/api/shutdown' && req.method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'shutting down' }));
    setTimeout(function() { if (win) win.close(); }, 100);
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found', available: [
    'GET /api/state', 'GET /api/tabs', 'POST /api/tabs',
    'GET /api/tabs/:id', 'DELETE /api/tabs/:id',
    'POST /api/tabs/:id/navigate', 'POST /api/tabs/:id/reload',
    'POST /api/tabs/:id/activate', 'GET /api/tabs/:id/html',
    'POST /api/tabs/:id/execute', 'GET /api/tabs/:id/text',
    'GET /api/tabs/:id/screenshot',
    'POST /api/tabs/:id/click', 'POST /api/tabs/:id/type',
    'POST /api/tabs/:id/find', 'POST /api/tabs/:id/scroll',
    'POST /api/tabs/:id/back', 'POST /api/tabs/:id/forward',
    'GET /api/screenshot', 'POST /api/resize',
    'GET /api/bookmarks', 'POST /api/bookmarks',
    'GET /api/history',
    'POST /api/shutdown'
  ]}));
});

// ---- Server startup with EADDRINUSE fallback ----
var isBrowserInit = false;
function safeInitBrowser() {
  if (isBrowserInit) return;
  isBrowserInit = true;
  initBrowser();
}

server.on('error', function(err) {
  console.error('[Nightmare] Server error:', err.message);
  if (err.code === 'EADDRINUSE' && API_PORT !== 0) {
    console.warn('[Nightmare] Port ' + API_PORT + ' in use, trying dynamic port...');
    API_PORT = 0;
    server.listen(0, '127.0.0.1', function() {
      API_PORT = server.address().port;
      console.log('[Nightmare] Server on http://127.0.0.1:' + API_PORT + ' (fallback)');
      safeInitBrowser();
    });
  } else {
    safeInitBrowser();
  }
});

server.listen(API_PORT, '127.0.0.1', function() {
  API_PORT = server.address().port;
  console.log('[Nightmare] Server on http://127.0.0.1:' + API_PORT);
  safeInitBrowser();
});

// ---- Graceful shutdown ----
if (win) {
  win.on('close', function() {
    try { server.close(); } catch(e) {}
    win.close(true);
  });
}
