import { describe, it, expect, beforeEach } from 'vitest';
import {
  FileDropService,
  type FileDropResult,
} from '../services/file-drop';

describe('FileDropService', () => {
  let service: FileDropService;

  beforeEach(() => {
    service = new FileDropService();
  });

  describe('processFilePath', () => {
    it('converts absolute path to file:// URL', () => {
      const result = service.processFilePath('/home/user/index.html');
      expect(result.url).toBe('file:///home/user/index.html');
    });

    it('extracts filename from path', () => {
      const result = service.processFilePath('/home/user/index.html');
      expect(result.filename).toBe('index.html');
    });

    it('extracts extension from path', () => {
      const result = service.processFilePath('/home/user/index.html');
      expect(result.extension).toBe('.html');
    });

    it('determines mime type from extension', () => {
      const result = service.processFilePath('/home/user/index.html');
      expect(result.mimeType).toBe('text/html');
    });

    it('encodes spaces as %20 in URL', () => {
      const result = service.processFilePath('/home/user/my file.html');
      expect(result.url).toBe('file:///home/user/my%20file.html');
    });

    it('encodes special characters in path', () => {
      const result = service.processFilePath('/home/user/a [1].html');
      expect(result.url).toContain('file:///home/user/');
      expect(result.url).not.toContain('[');
    });

    it('converts relative path to absolute file:// URL', () => {
      const result = service.processFilePath('./docs/page.html');
      expect(result.url).toMatch(/^file:\/\//);
      expect(result.url).toContain('docs/page.html');
      expect(result.url).not.toContain('./');
    });

    it('converts parent-relative path to absolute file:// URL', () => {
      const result = service.processFilePath('../docs/page.html');
      expect(result.url).toMatch(/^file:\/\//);
      expect(result.url).not.toContain('../');
    });

    it('returns readonly result', () => {
      const result = service.processFilePath('/home/user/index.html');
      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  describe('isAllowedExtension', () => {
    it('allows .html extension', () => {
      expect(service.isAllowedExtension('.html')).toBe(true);
    });

    it('allows .htm extension', () => {
      expect(service.isAllowedExtension('.htm')).toBe(true);
    });

    it('allows .txt extension', () => {
      expect(service.isAllowedExtension('.txt')).toBe(true);
    });

    it('allows .json extension', () => {
      expect(service.isAllowedExtension('.json')).toBe(true);
    });

    it('allows .xml extension', () => {
      expect(service.isAllowedExtension('.xml')).toBe(true);
    });

    it('allows .svg extension', () => {
      expect(service.isAllowedExtension('.svg')).toBe(true);
    });

    it('allows .pdf extension', () => {
      expect(service.isAllowedExtension('.pdf')).toBe(true);
    });

    it('allows .md extension', () => {
      expect(service.isAllowedExtension('.md')).toBe(true);
    });

    it('allows .css extension', () => {
      expect(service.isAllowedExtension('.css')).toBe(true);
    });

    it('allows .js extension', () => {
      expect(service.isAllowedExtension('.js')).toBe(true);
    });

    it('rejects unknown extension', () => {
      expect(service.isAllowedExtension('.xyz')).toBe(false);
    });

    it('handles case-insensitive comparison', () => {
      expect(service.isAllowedExtension('.HTML')).toBe(true);
      expect(service.isAllowedExtension('.Json')).toBe(true);
    });
  });

  describe('isDangerousExtension', () => {
    it('rejects .exe files', () => {
      expect(service.isDangerousExtension('.exe')).toBe(true);
    });

    it('rejects .bat files', () => {
      expect(service.isDangerousExtension('.bat')).toBe(true);
    });

    it('rejects .cmd files', () => {
      expect(service.isDangerousExtension('.cmd')).toBe(true);
    });

    it('rejects .sh files', () => {
      expect(service.isDangerousExtension('.sh')).toBe(true);
    });

    it('rejects .ps1 files', () => {
      expect(service.isDangerousExtension('.ps1')).toBe(true);
    });

    it('does not flag safe extensions as dangerous', () => {
      expect(service.isDangerousExtension('.html')).toBe(false);
      expect(service.isDangerousExtension('.txt')).toBe(false);
    });

    it('handles case-insensitive comparison', () => {
      expect(service.isDangerousExtension('.EXE')).toBe(true);
      expect(service.isDangerousExtension('.Bat')).toBe(true);
    });
  });

  describe('validateFilePath', () => {
    it('accepts allowed file extensions', () => {
      expect(() => service.validateFilePath('/home/user/index.html')).not.toThrow();
    });

    it('throws on dangerous file extensions', () => {
      expect(() => service.validateFilePath('/home/user/virus.exe')).toThrow(
        'Dangerous file type: .exe'
      );
    });

    it('throws on disallowed file extensions', () => {
      expect(() => service.validateFilePath('/home/user/data.bin')).toThrow(
        'File type not allowed: .bin'
      );
    });

    it('throws on empty path', () => {
      expect(() => service.validateFilePath('')).toThrow('File path is empty');
    });

    it('throws on path with no extension', () => {
      expect(() => service.validateFilePath('/home/user/Makefile')).toThrow(
        'File has no extension'
      );
    });
  });

  describe('getMimeType', () => {
    it('returns text/html for .html', () => {
      expect(service.getMimeType('.html')).toBe('text/html');
    });

    it('returns text/html for .htm', () => {
      expect(service.getMimeType('.htm')).toBe('text/html');
    });

    it('returns text/plain for .txt', () => {
      expect(service.getMimeType('.txt')).toBe('text/plain');
    });

    it('returns application/json for .json', () => {
      expect(service.getMimeType('.json')).toBe('application/json');
    });

    it('returns application/xml for .xml', () => {
      expect(service.getMimeType('.xml')).toBe('application/xml');
    });

    it('returns image/svg+xml for .svg', () => {
      expect(service.getMimeType('.svg')).toBe('image/svg+xml');
    });

    it('returns application/pdf for .pdf', () => {
      expect(service.getMimeType('.pdf')).toBe('application/pdf');
    });

    it('returns text/markdown for .md', () => {
      expect(service.getMimeType('.md')).toBe('text/markdown');
    });

    it('returns text/css for .css', () => {
      expect(service.getMimeType('.css')).toBe('text/css');
    });

    it('returns text/javascript for .js', () => {
      expect(service.getMimeType('.js')).toBe('text/javascript');
    });

    it('returns application/octet-stream for unknown extension', () => {
      expect(service.getMimeType('.xyz')).toBe('application/octet-stream');
    });

    it('handles case-insensitive lookup', () => {
      expect(service.getMimeType('.HTML')).toBe('text/html');
    });
  });

  describe('processMultipleFiles', () => {
    it('returns results for all valid files', () => {
      const paths = ['/home/user/a.html', '/home/user/b.json'];
      const results = service.processMultipleFiles(paths);
      expect(results).toHaveLength(2);
      expect(results[0]?.filename).toBe('a.html');
      expect(results[1]?.filename).toBe('b.json');
    });

    it('throws on empty array', () => {
      expect(() => service.processMultipleFiles([])).toThrow(
        'No files provided'
      );
    });

    it('throws if any file is dangerous', () => {
      const paths = ['/home/user/a.html', '/home/user/virus.exe'];
      expect(() => service.processMultipleFiles(paths)).toThrow(
        'Dangerous file type: .exe'
      );
    });

    it('throws if any file has disallowed extension', () => {
      const paths = ['/home/user/a.html', '/home/user/data.bin'];
      expect(() => service.processMultipleFiles(paths)).toThrow(
        'File type not allowed: .bin'
      );
    });

    it('returns readonly frozen results', () => {
      const paths = ['/home/user/a.html'];
      const results = service.processMultipleFiles(paths);
      expect(Object.isFrozen(results)).toBe(true);
    });
  });

  describe('buildFileUrl', () => {
    it('builds file:// URL from absolute path', () => {
      expect(service.buildFileUrl('/home/user/index.html')).toBe(
        'file:///home/user/index.html'
      );
    });

    it('encodes spaces as %20', () => {
      expect(service.buildFileUrl('/home/user/my file.html')).toBe(
        'file:///home/user/my%20file.html'
      );
    });

    it('encodes brackets in path', () => {
      const result = service.buildFileUrl('/home/user/a [1].html');
      expect(result).toContain('file:///home/user/');
      expect(result).not.toContain('[');
      expect(result).not.toContain(']');
    });

    it('preserves forward slashes', () => {
      const result = service.buildFileUrl('/a/b/c/d.html');
      expect(result).toBe('file:///a/b/c/d.html');
    });

    it('resolves relative path before building URL', () => {
      const result = service.buildFileUrl('./relative/page.html');
      expect(result).toMatch(/^file:\/\//);
      expect(result).not.toContain('./');
    });
  });

  describe('extractExtension', () => {
    it('extracts .html extension', () => {
      expect(service.extractExtension('/home/user/index.html')).toBe('.html');
    });

    it('extracts .tar.gz as .gz', () => {
      expect(service.extractExtension('/home/user/file.tar.gz')).toBe('.gz');
    });

    it('returns empty string for files with no extension', () => {
      expect(service.extractExtension('/home/user/Makefile')).toBe('');
    });

    it('extracts extension from dotfile', () => {
      expect(service.extractExtension('/home/.bashrc')).toBe('');
    });

    it('handles paths with dots in directories', () => {
      expect(service.extractExtension('/home/my.dir/file.txt')).toBe('.txt');
    });
  });

  describe('extractFilename', () => {
    it('extracts filename from absolute path', () => {
      expect(service.extractFilename('/home/user/index.html')).toBe('index.html');
    });

    it('extracts filename from path with spaces', () => {
      expect(service.extractFilename('/home/user/my file.html')).toBe('my file.html');
    });

    it('extracts filename from relative path', () => {
      expect(service.extractFilename('./docs/page.html')).toBe('page.html');
    });
  });

  describe('isDirectory', () => {
    it('returns true for paths ending with /', () => {
      expect(service.isDirectory('/home/user/')).toBe(true);
    });

    it('returns false for paths with file extension', () => {
      expect(service.isDirectory('/home/user/file.html')).toBe(false);
    });

    it('returns true for paths ending with separator', () => {
      expect(service.isDirectory('/home/user/docs/')).toBe(true);
    });
  });
});
