import type { Bookmark, BookmarkFolder } from './bookmarks';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

export function renderFolder(
  parentId: string | null,
  bookmarks: readonly Bookmark[],
  folders: readonly BookmarkFolder[],
  indent: number,
): string {
  const pad = '    '.repeat(indent);
  const items: string[] = [`${pad}<DL><p>`];
  for (const folder of folders.filter((f) => f.parentId === parentId)) {
    items.push(`${pad}    <DT><H3>${escapeHtml(folder.name)}</H3>`);
    items.push(renderFolder(folder.id, bookmarks, folders, indent + 1));
  }
  for (const bm of bookmarks.filter((b) => b.folderId === parentId)) {
    items.push(`${pad}    <DT><A HREF="${escapeHtml(bm.url)}">${escapeHtml(bm.title)}</A>`);
  }
  items.push(`${pad}</DL><p>`);
  return items.join('\n');
}

export function parseHtmlLines(
  html: string,
  bookmarks: Bookmark[],
  folders: BookmarkFolder[],
): void {
  const folderStack: Array<string | null> = [null];
  const posCounters = new Map<string | null, number>();
  for (const line of html.split('\n')) {
    parseSingleLine(line, folderStack, bookmarks, folders, posCounters);
  }
}

function parseSingleLine(
  line: string,
  folderStack: Array<string | null>,
  bookmarks: Bookmark[],
  folders: BookmarkFolder[],
  posCounters: Map<string | null, number>,
): void {
  const folderMatch = /<DT><H3[^>]*>(.*?)<\/H3>/i.exec(line);
  if (folderMatch?.[1] !== undefined) {
    pushFolder(folderMatch[1], folderStack, folders, posCounters);
    return;
  }
  const linkMatch = /<DT><A[^>]*HREF="([^"]*)"[^>]*>(.*?)<\/A>/i.exec(line);
  if (linkMatch?.[1] !== undefined && linkMatch[2] !== undefined) {
    pushBookmark(linkMatch[1], linkMatch[2], folderStack, bookmarks, posCounters);
    return;
  }
  if (/<\/DL>/i.test(line) && folderStack.length > 1) {
    folderStack.pop();
  }
}

function pushFolder(
  name: string,
  folderStack: Array<string | null>,
  folders: BookmarkFolder[],
  posCounters: Map<string | null, number>,
): void {
  const parentId = folderStack[folderStack.length - 1] ?? null;
  const pos = posCounters.get(parentId) ?? 0;
  posCounters.set(parentId, pos + 1);
  const folder: BookmarkFolder = {
    id: crypto.randomUUID(),
    name: decodeHtmlEntities(name),
    parentId,
    position: pos,
  };
  folders.push(folder);
  folderStack.push(folder.id);
}

function pushBookmark(
  url: string,
  title: string,
  folderStack: Array<string | null>,
  bookmarks: Bookmark[],
  posCounters: Map<string | null, number>,
): void {
  const folderId = folderStack[folderStack.length - 1] ?? null;
  const pos = posCounters.get(folderId) ?? 0;
  posCounters.set(folderId, pos + 1);
  bookmarks.push({
    id: crypto.randomUUID(),
    title: decodeHtmlEntities(title),
    url: decodeHtmlEntities(url),
    favicon: null,
    folderId,
    createdAt: Date.now(),
    position: pos,
  });
}
