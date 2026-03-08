// Persistent data — bookmarks + history
// Depends on: fs, path, _dataDir, toDisplayUrl (globals)
// Runtime deps (called later): updateBookmarkButton, renderBookmarks

function loadJsonFile(name) {
  try { return JSON.parse(fs.readFileSync(path.join(_dataDir, name), 'utf8')); }
  catch(e) { return []; }
}

function saveJsonFile(name, data) {
  fs.writeFileSync(path.join(_dataDir, name), JSON.stringify(data, null, 2), 'utf8');
}

function isBookmarked(url) {
  var display = toDisplayUrl(url);
  return userBookmarks.some(function(b) { return b.url === url || b.url === display; });
}

function addBookmark(url, title) {
  if (isBookmarked(url)) return;
  var display = toDisplayUrl(url);
  userBookmarks.push({ title: title || display, url: display, createdAt: new Date().toISOString() });
  saveJsonFile('bookmarks.json', userBookmarks);
  updateBookmarkButton();
  renderBookmarks();
}

function removeBookmark(url) {
  var display = toDisplayUrl(url);
  userBookmarks = userBookmarks.filter(function(b) { return b.url !== url && b.url !== display; });
  saveJsonFile('bookmarks.json', userBookmarks);
  updateBookmarkButton();
  renderBookmarks();
}

function recordHistory(url, title) {
  var display = toDisplayUrl(url);
  if (!url || url === 'about:blank') return;
  browsingHistory.unshift({ url: display, title: title || display, visitedAt: new Date().toISOString(), displayUrl: display });
  if (browsingHistory.length > 5000) browsingHistory = browsingHistory.slice(0, 5000);
  saveJsonFile('history.json', browsingHistory);
}
