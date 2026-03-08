// Minimal Markdown to HTML renderer — pure functions, no deps

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function inlineFormat(s) {
  s = escapeHtml(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return s;
}

function renderMarkdown(md) {
  var lines = md.split('\n');
  var html = [];
  var inCode = false;
  var inList = false;
  var listType = '';

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCode) { html.push('</code></pre>'); inCode = false; }
      else { html.push('<pre><code>'); inCode = true; }
      continue;
    }
    if (inCode) { html.push(escapeHtml(line) + '\n'); continue; }

    if (inList && !line.match(/^\s*[-*+]\s/) && !line.match(/^\s*\d+\.\s/) && line.trim() !== '') {
      html.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }

    var hMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) { var lv = hMatch[1].length; html.push('<h' + lv + '>' + inlineFormat(hMatch[2]) + '</h' + lv + '>'); continue; }

    if (/^(-{3,}|_{3,}|\*{3,})\s*$/.test(line.trim())) { html.push('<hr>'); continue; }

    if (line.startsWith('> ')) { html.push('<blockquote>' + inlineFormat(line.slice(2)) + '</blockquote>'); continue; }

    var ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') { if (inList) html.push('</ol>'); html.push('<ul>'); inList = true; listType = 'ul'; }
      html.push('<li>' + inlineFormat(ulMatch[1]) + '</li>');
      continue;
    }

    var olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') { if (inList) html.push('</ul>'); html.push('<ol>'); inList = true; listType = 'ol'; }
      html.push('<li>' + inlineFormat(olMatch[1]) + '</li>');
      continue;
    }

    if (line.trim() === '') { html.push('<br>'); continue; }

    html.push('<p>' + inlineFormat(line) + '</p>');
  }

  if (inCode) html.push('</code></pre>');
  if (inList) html.push(listType === 'ul' ? '</ul>' : '</ol>');
  return html.join('\n');
}
