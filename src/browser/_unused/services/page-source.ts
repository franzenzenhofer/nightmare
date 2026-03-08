const VIEW_SOURCE_PREFIX = 'view-source:';

export function isViewSourceUrl(url: string): boolean {
  return url.toLowerCase().startsWith(VIEW_SOURCE_PREFIX);
}

export function parseViewSourceUrl(url: string): string | null {
  if (!isViewSourceUrl(url)) return null;
  return url.slice(VIEW_SOURCE_PREFIX.length);
}

function escapeHtml(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatSourceHtml(html: string): string {
  const escaped = escapeHtml(html);
  const lines = escaped.split('\n');
  const numbered = lines
    .map((line, i) => `<span class="line-number">${String(i + 1)}</span>${line}`)
    .join('\n');
  return `<pre class="source-view">${numbered}</pre>`;
}
