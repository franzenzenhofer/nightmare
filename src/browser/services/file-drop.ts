import { resolve, extname, basename } from 'path';

export interface FileDropResult {
  readonly url: string;
  readonly filename: string;
  readonly extension: string;
  readonly mimeType: string;
}

const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set([
  '.html', '.htm', '.txt', '.json', '.xml',
  '.svg', '.pdf', '.md', '.css', '.js',
]);

const DANGEROUS_EXTENSIONS: ReadonlySet<string> = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.ps1',
]);

const MIME_MAP: Readonly<Record<string, string>> = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown',
  '.css': 'text/css',
  '.js': 'text/javascript',
};

const FALLBACK_MIME = 'application/octet-stream';

export class FileDropService {
  isAllowedExtension(ext: string): boolean {
    return ALLOWED_EXTENSIONS.has(ext.toLowerCase());
  }

  isDangerousExtension(ext: string): boolean {
    return DANGEROUS_EXTENSIONS.has(ext.toLowerCase());
  }

  getMimeType(ext: string): string {
    return MIME_MAP[ext.toLowerCase()] ?? FALLBACK_MIME;
  }

  extractExtension(filePath: string): string {
    const name = basename(filePath);
    if (name.startsWith('.') && !name.includes('.', 1)) return '';
    return extname(filePath);
  }

  extractFilename(filePath: string): string {
    return basename(filePath);
  }

  isDirectory(filePath: string): boolean {
    return filePath.endsWith('/');
  }

  validateFilePath(filePath: string): void {
    if (filePath === '') throw new Error('File path is empty');

    const ext = this.extractExtension(filePath);
    if (ext === '') throw new Error('File has no extension');
    if (this.isDangerousExtension(ext)) throw new Error(`Dangerous file type: ${ext}`);
    if (!this.isAllowedExtension(ext)) throw new Error(`File type not allowed: ${ext}`);
  }

  buildFileUrl(filePath: string): string {
    const absolute = this.resolvePath(filePath);
    const encoded = this.encodePathSegments(absolute);
    return `file://${encoded}`;
  }

  processFilePath(filePath: string): FileDropResult {
    this.validateFilePath(filePath);

    const ext = this.extractExtension(filePath);
    const result: FileDropResult = {
      url: this.buildFileUrl(filePath),
      filename: this.extractFilename(filePath),
      extension: ext,
      mimeType: this.getMimeType(ext),
    };

    return Object.freeze(result);
  }

  processMultipleFiles(paths: readonly string[]): readonly FileDropResult[] {
    if (paths.length === 0) throw new Error('No files provided');

    const results = paths.map((p) => this.processFilePath(p));
    return Object.freeze(results);
  }

  private resolvePath(filePath: string): string {
    if (filePath.startsWith('/')) return filePath;
    return resolve(filePath);
  }

  private encodePathSegments(absolutePath: string): string {
    return absolutePath
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }
}
