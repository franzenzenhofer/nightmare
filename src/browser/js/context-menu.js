// Context menu — showContextMenu + injectContextMenu
// Depends on: navState, tabs, toDisplayUrl, isBookmarked, addBookmark, removeBookmark,
//   createTab, toggleFindBar, win (globals — all called at runtime, not load time)

function showContextMenu(x, y, items) {
  var existing = document.getElementById('nm-context-menu');
  if (existing) existing.remove();

  var menu = document.createElement('div');
  menu.id = 'nm-context-menu';
  menu.style.cssText = 'position:fixed;top:' + y + 'px;left:' + x + 'px;background:#12142a;border:1px solid #2a2d44;border-radius:6px;padding:4px 0;z-index:9999;min-width:200px;box-shadow:0 8px 24px rgba(0,0,0,0.7);font-size:13px;font-family:inherit;';

  items.forEach(function(item) {
    if (item.separator) {
      var sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:#2a2d44;margin:4px 0;';
      menu.appendChild(sep);
      return;
    }
    var el = document.createElement('div');
    el.style.cssText = 'padding:7px 16px;cursor:pointer;color:#d0d0d8;display:flex;justify-content:space-between;align-items:center;';
    if (item.disabled) {
      el.style.opacity = '0.4';
      el.style.cursor = 'default';
    }
    var labelSpan = document.createElement('span');
    labelSpan.textContent = item.label;
    el.appendChild(labelSpan);
    if (item.shortcut) {
      var scSpan = document.createElement('span');
      scSpan.textContent = item.shortcut;
      scSpan.style.cssText = 'font-size:11px;color:#585a64;margin-left:24px;';
      el.appendChild(scSpan);
    }
    if (!item.disabled) {
      el.addEventListener('mouseenter', function() { el.style.background = '#1e2248'; });
      el.addEventListener('mouseleave', function() { el.style.background = 'none'; });
      el.addEventListener('click', function() { item.action(); menu.remove(); });
    }
    menu.appendChild(el);
  });

  document.body.appendChild(menu);
  var rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width - 8) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height - 8) + 'px';

  var removeMenu = function(e) {
    if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('mousedown', removeMenu); }
  };
  setTimeout(function() { document.addEventListener('mousedown', removeMenu); }, 0);
}

function injectContextMenu(tab, frame) {
  try {
    var doc = frame.contentDocument;
    if (!doc) return;
    doc.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      var target = e.target;
      var linkEl = target.closest ? target.closest('a[href]') : null;
      var imgEl = target.closest ? target.closest('img[src]') : null;
      var selectedText = '';
      try { selectedText = frame.contentWindow.getSelection().toString(); } catch(err) {}

      var frameRect = frame.getBoundingClientRect();
      var mx = e.clientX + frameRect.left;
      var my = e.clientY + frameRect.top;

      var navSt = navState.get(tab.id);
      var canBack = navSt && (navSt.depth > 0 || (navSt.openerId && tabs.has(navSt.openerId)));
      var canFwd = navSt && navSt.forwardDepth > 0;
      var displayUrl = toDisplayUrl(tab.url);

      var menuItems = [
        { label: 'Back', shortcut: '\u2318\u2190', disabled: !canBack, action: function() { document.getElementById('nm-btn-back').click(); } },
        { label: 'Forward', shortcut: '\u2318\u2192', disabled: !canFwd, action: function() { document.getElementById('nm-btn-forward').click(); } },
        { label: 'Reload', shortcut: '\u2318R', action: function() { tab.frame.src = tab.url; } },
        { separator: true },
      ];

      if (linkEl) {
        var linkHref = linkEl.href;
        menuItems.push({ label: 'Open Link in New Tab', action: function() { createTab(linkHref); } });
        menuItems.push({ label: 'Copy Link Address', action: function() {
          try { var cb = require('nw.gui').Clipboard.get(); cb.set(linkHref, 'text'); }
          catch(err) { try { navigator.clipboard.writeText(linkHref); } catch(e2) {} }
        }});
        menuItems.push({ separator: true });
      }

      if (imgEl) {
        var imgSrc = imgEl.src;
        menuItems.push({ label: 'Open Image in New Tab', action: function() { createTab(imgSrc); } });
        menuItems.push({ label: 'Copy Image Address', action: function() {
          try { var cb = require('nw.gui').Clipboard.get(); cb.set(imgSrc, 'text'); }
          catch(err) { try { navigator.clipboard.writeText(imgSrc); } catch(e2) {} }
        }});
        menuItems.push({ separator: true });
      }

      if (selectedText) {
        var searchQuery = selectedText.substring(0, 80);
        menuItems.push({ label: 'Copy', action: function() {
          try { var cb = require('nw.gui').Clipboard.get(); cb.set(selectedText, 'text'); }
          catch(err) { try { navigator.clipboard.writeText(selectedText); } catch(e2) {} }
        }});
        menuItems.push({ label: 'Search Google for "' + (searchQuery.length > 30 ? searchQuery.substring(0, 30) + '...' : searchQuery) + '"', action: function() {
          createTab('https://www.google.com/search?q=' + encodeURIComponent(searchQuery));
        }});
        menuItems.push({ separator: true });
      }

      menuItems.push({ label: isBookmarked(tab.url) ? 'Remove Bookmark' : 'Bookmark This Page', shortcut: '\u2318D', action: function() {
        if (isBookmarked(tab.url)) removeBookmark(tab.url);
        else addBookmark(tab.url, tab.title);
      }});
      menuItems.push({ separator: true });
      menuItems.push({ label: 'Copy Page URL', action: function() {
        try { var cb = require('nw.gui').Clipboard.get(); cb.set(displayUrl, 'text'); }
        catch(err) { try { navigator.clipboard.writeText(displayUrl); } catch(e2) {} }
      }});
      menuItems.push({ label: 'View Page Source', action: function() {
        try {
          var html = frame.contentDocument.documentElement.outerHTML;
          var blob = new Blob([html], { type: 'text/plain' });
          createTab(URL.createObjectURL(blob));
        } catch(err) {}
      }});
      menuItems.push({ label: 'Find in Page', shortcut: '\u2318F', action: function() { toggleFindBar(); } });
      menuItems.push({ separator: true });
      menuItems.push({ label: 'Inspect Element', shortcut: 'F12', action: function() { if (win) win.showDevTools(); } });

      showContextMenu(mx, my, menuItems);
    });
  } catch(e) {
    // Cross-origin — cannot inject context menu
  }
}
