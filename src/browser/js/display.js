// Display utilities — URL transformation, MIME types
// Depends on: API_PORT, samplesDir, pagesDir, path (globals)

function localFileUrl(filePath) {
  return 'http://127.0.0.1:' + API_PORT + '/file/' + encodeURIComponent(filePath);
}

function proxyUrl(webUrl) {
  return 'http://127.0.0.1:' + API_PORT + '/proxy/' + encodeURIComponent(webUrl);
}

function toDisplayUrl(internalUrl) {
  var filePrefix = 'http://127.0.0.1:' + API_PORT + '/file/';
  var proxyPrefix = 'http://127.0.0.1:' + API_PORT + '/proxy/';
  if (internalUrl.startsWith(proxyPrefix)) {
    return decodeURIComponent(internalUrl.slice(proxyPrefix.length));
  }
  if (internalUrl.startsWith(filePrefix)) {
    var filePath = decodeURIComponent(internalUrl.slice(filePrefix.length));
    if (filePath.startsWith(samplesDir)) {
      var name = path.basename(filePath, '.html');
      return 'nightmare://' + (name === 'hello' ? 'home' : name);
    }
    if (filePath.startsWith(pagesDir)) {
      return 'nightmare://' + path.basename(filePath, '.html');
    }
    return 'nightmare://' + filePath;
  }
  return internalUrl;
}

function tabToJson(t) {
  return { id: t.id, url: t.url, displayUrl: toDisplayUrl(t.url), title: t.title, zone: t.zone };
}

function serveMimeType(ext) {
  var m = {
    '.html': 'text/html', '.htm': 'text/html',
    '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.woff': 'font/woff',
    '.woff2': 'font/woff2', '.ttf': 'font/ttf',
    '.mp3': 'audio/mpeg', '.mp4': 'video/mp4',
    '.wasm': 'application/wasm', '.xml': 'application/xml',
    '.txt': 'text/plain', '.md': 'text/plain',
    '.ts': 'text/plain', '.tsx': 'text/plain'
  };
  return m[ext] || 'application/octet-stream';
}

// Execute arbitrary JS in a frame context.
// This is Nightmare Browser's core AI-control feature — intentional use of eval()
// to allow API/MCP consumers to run JS in any tab. See CLAUDE.md "AI/API Steerability".
function executeInFrame(frame, code, cb) {
  try {
    var result = frame.contentWindow.eval(code);
    if (cb) cb(null, result);
    return result;
  } catch(e) {
    if (cb) cb(e, undefined);
  }
}
