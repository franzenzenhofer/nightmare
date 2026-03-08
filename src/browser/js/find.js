// Find in page — toggleFindBar, doFind, clearFindHighlights
// Depends on: findBarVisible, getActiveTab (globals)

function toggleFindBar() {
  var existing = document.getElementById('nm-find-bar');
  if (existing) {
    existing.remove();
    findBarVisible = false;
    return;
  }
  findBarVisible = true;
  var bar = document.createElement('div');
  bar.id = 'nm-find-bar';
  bar.style.cssText = 'position:fixed;top:80px;right:20px;background:#1a1a2e;border:1px solid #333;border-radius:6px;padding:8px 12px;z-index:9999;display:flex;gap:8px;align-items:center;box-shadow:0 4px 16px rgba(0,0,0,0.6);';

  var input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Find in page...';
  input.style.cssText = 'width:200px;height:28px;background:#08090f;border:1px solid #333;border-radius:4px;padding:0 8px;color:#f0eeeb;font-family:inherit;font-size:13px;outline:none;';
  bar.appendChild(input);

  var countSpan = document.createElement('span');
  countSpan.style.cssText = 'font-size:11px;color:#585a64;min-width:40px;';
  bar.appendChild(countSpan);

  var closeBtn = document.createElement('button');
  closeBtn.textContent = '\u2715';
  closeBtn.style.cssText = 'background:none;border:none;color:#585a64;cursor:pointer;font-size:14px;padding:2px 6px;';
  closeBtn.addEventListener('click', function() { bar.remove(); findBarVisible = false; clearFindHighlights(); });
  bar.appendChild(closeBtn);

  document.body.appendChild(bar);
  input.focus();

  var searchTimer = null;
  input.addEventListener('input', function() {
    clearTimeout(searchTimer);
    var q = input.value;
    searchTimer = setTimeout(function() { doFind(q, countSpan); }, 150);
  });
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { bar.remove(); findBarVisible = false; clearFindHighlights(); }
    if (e.key === 'Enter') { doFind(input.value, countSpan); }
  });
}

function doFind(query, countEl) {
  clearFindHighlights();
  if (!query) { countEl.textContent = ''; return; }
  var tab = getActiveTab();
  if (!tab) return;
  try {
    var frameWin = tab.frame.contentWindow;
    var found = frameWin.find(query, false, false, true, false, false, false);
    if (found) {
      countEl.textContent = 'Found';
      countEl.style.color = '#4ade80';
    } else {
      countEl.textContent = 'No match';
      countEl.style.color = '#ff4444';
    }
  } catch(e) {
    countEl.textContent = 'Error';
    countEl.style.color = '#ff4444';
  }
}

function clearFindHighlights() {
  var tab = getActiveTab();
  if (!tab) return;
  try { tab.frame.contentWindow.getSelection().removeAllRanges(); } catch(e) {}
}
