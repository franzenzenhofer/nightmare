export type ErrorType =
  | 'connection-failed'
  | 'not-found'
  | 'ssl-error'
  | 'timeout'
  | 'dns-failed'
  | 'crash';

export const ERROR_TYPES: readonly ErrorType[] = [
  'connection-failed', 'not-found', 'ssl-error', 'timeout', 'dns-failed', 'crash',
];

interface ErrorInfo {
  readonly title: string;
  readonly description: string;
}

const ERROR_INFO: Record<ErrorType, ErrorInfo> = {
  'connection-failed': { title: 'Connection Failed', description: 'Could not connect to the server.' },
  'not-found': { title: 'Not Found', description: 'The requested page does not exist.' },
  'ssl-error': { title: 'Security Error', description: 'The security certificate is invalid.' },
  'timeout': { title: 'Timed Out', description: 'The server took too long to respond.' },
  'dns-failed': { title: 'DNS Failed', description: 'Could not resolve the server address.' },
  'crash': { title: 'Page Crashed', description: 'The page has unexpectedly crashed.' },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getErrorPageHtml(errorType: ErrorType, url: string): string {
  const info = ERROR_INFO[errorType];
  const safeUrl = escapeHtml(url);
  return [
    '<html><head><title>Nightmare - Error</title></head>',
    '<body style="background:#1a1a2e;color:#e0e0e0;font-family:monospace;padding:40px;">',
    `<h1 style="color:#ff4444;">${info.title}</h1>`,
    `<p>${info.description}</p>`,
    `<p style="color:#888;">URL: ${safeUrl}</p>`,
    '<p style="color:#666;margin-top:40px;">Nightmare Browser</p>',
    '</body></html>',
  ].join('\n');
}
