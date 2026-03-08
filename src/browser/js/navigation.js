// URL resolution — converts user input to internal URLs
// Depends on: localFileUrl, proxyUrl, HOME_URL, samplesDir, pagesDir, fs, path, os (globals)

function resolveUrl(input) {
  if (!input) return resolveUrl(HOME_URL);
  if (input.startsWith('nightmare:///')) {
    var absPath = input.slice('nightmare://'.length);
    return localFileUrl(absPath);
  }
  if (input.startsWith('nightmare://')) {
    var pageName = input.replace('nightmare://', '');
    if (pageName === 'home') return localFileUrl(path.join(samplesDir, 'hello.html'));
    if (pageName === 'about') return localFileUrl(path.join(pagesDir, 'about.html'));
    var samplePath = path.join(samplesDir, pageName + '.html');
    if (fs.existsSync(samplePath)) return localFileUrl(samplePath);
    var pagePath = path.join(pagesDir, pageName + '.html');
    if (fs.existsSync(pagePath)) return localFileUrl(pagePath);
    return localFileUrl(path.join(pagesDir, 'newtab.html'));
  }
  if (input.startsWith('file://')) return input;
  if (/^https?:\/\//.test(input)) {
    var parsedHost = '';
    try { parsedHost = new URL(input).hostname; } catch(e) {}
    if (parsedHost === 'localhost' || parsedHost === '127.0.0.1' || parsedHost === '[::1]' || parsedHost === '0.0.0.0'
        || parsedHost.endsWith('.localhost')
        || /^192\.168\.\d+\.\d+$/.test(parsedHost)
        || /^10\.\d+\.\d+\.\d+$/.test(parsedHost)
        || /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(parsedHost)) {
      return input;
    }
    return proxyUrl(input);
  }
  if (/^\d{2,5}$/.test(input)) return 'http://localhost:' + input;
  if (input.startsWith('/') || input.startsWith('./') || input.startsWith('~')) {
    return localFileUrl(path.resolve(input.replace(/^~/, os.homedir())));
  }
  if (input.includes('.') && !input.includes(' ') && !input.includes('/')) return proxyUrl('https://' + input);
  return proxyUrl('https://www.google.com/search?q=' + encodeURIComponent(input));
}
