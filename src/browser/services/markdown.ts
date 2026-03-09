export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function inlineFormat(text: string): string {
  let s = escapeHtml(text);
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

function closeList(
  html: string[],
  inList: boolean,
  listType: string,
): void {
  if (inList) {
    html.push(listType === 'ul' ? '</ul>' : '</ol>');
  }
}

function processListItem(
  html: string[],
  inList: boolean,
  listType: string,
  targetType: 'ul' | 'ol',
  content: string,
): { inList: boolean; listType: string } {
  if (!inList || listType !== targetType) {
    if (inList) {
      html.push(listType === 'ul' ? '</ul>' : '</ol>');
    }
    html.push(targetType === 'ul' ? '<ul>' : '<ol>');
  }
  html.push(`<li>${inlineFormat(content)}</li>`);
  return { inList: true, listType: targetType };
}

function processLine(
  line: string,
  html: string[],
  state: { inList: boolean; listType: string },
): void {
  const isListLine =
    /^\s*[-*+]\s/.test(line) || /^\s*\d+\.\s/.test(line);

  if (state.inList && !isListLine && line.trim() !== '') {
    closeList(html, state.inList, state.listType);
    state.inList = false;
  }

  const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
  if (hMatch) {
    const level = hMatch[1]?.length ?? 1;
    const text = hMatch[2] ?? '';
    html.push(`<h${String(level)}>${inlineFormat(text)}</h${String(level)}>`);
    return;
  }

  if (/^(-{3,}|_{3,}|\*{3,})\s*$/.test(line.trim())) {
    html.push('<hr>');
    return;
  }

  if (line.startsWith('> ')) {
    html.push(
      `<blockquote>${inlineFormat(line.slice(2))}</blockquote>`,
    );
    return;
  }

  const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
  if (ulMatch) {
    const result = processListItem(
      html, state.inList, state.listType, 'ul', ulMatch[1] ?? '',
    );
    state.inList = result.inList;
    state.listType = result.listType;
    return;
  }

  const olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
  if (olMatch) {
    const result = processListItem(
      html, state.inList, state.listType, 'ol', olMatch[1] ?? '',
    );
    state.inList = result.inList;
    state.listType = result.listType;
    return;
  }

  if (line.trim() === '') {
    html.push('<br>');
    return;
  }

  html.push(`<p>${inlineFormat(line)}</p>`);
}

export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const html: string[] = [];
  let inCode = false;
  const listState = { inList: false, listType: '' };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        html.push('</code></pre>');
        inCode = false;
      } else {
        html.push('<pre><code>');
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }
    processLine(line, html, listState);
  }

  if (inCode) html.push('</code></pre>');
  closeList(html, listState.inList, listState.listType);

  return html.join('\n');
}
