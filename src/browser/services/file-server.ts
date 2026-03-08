const MIME_TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.md': 'text/plain',
  '.ts': 'text/plain',
  '.tsx': 'text/plain',
};

const DEFAULT_MIME = 'application/octet-stream';

export function getMimeType(ext: string): string {
  return MIME_TYPES[ext] ?? DEFAULT_MIME;
}

export function decodeFilePath(urlPath: string): string {
  return decodeURIComponent(urlPath);
}
