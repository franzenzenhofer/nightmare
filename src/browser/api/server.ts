import { createServer } from 'http';
import type { Server, IncomingMessage, ServerResponse } from 'http';
import { createApiRouter } from './handlers';
import type { TabManager } from '../services/tab-manager';
import type { ConsoleCapture } from './console-capture';
import type { EventBus } from './event-bus';

interface ServerDependencies {
  readonly tabManager: TabManager;
  readonly consoleCapture: ConsoleCapture;
  readonly eventBus: EventBus;
}

export class ApiServer {
  private server: Server | null = null;
  private readonly router: ReturnType<typeof createApiRouter>;

  constructor(deps: ServerDependencies) {
    this.router = createApiRouter(deps);
  }

  start(port: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', reject);
      this.server.listen(port, () => {
        const addr = this.server?.address();
        const actualPort = typeof addr === 'object' && addr !== null ? addr.port : port;
        resolve(actualPort);
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    this.readBody(req).then((body) => {
      const path = req.url ?? '/';
      const method = req.method ?? 'GET';
      const result = this.router.handle(method, path, body);

      if (result === null) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }

      res.writeHead(result.status);
      if (result.body !== null) {
        res.end(JSON.stringify(result.body));
      } else {
        res.end();
      }
    }).catch(() => {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    });
  }

  private readBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      req.on('end', () => {
        if (chunks.length === 0) {
          resolve(undefined);
          return;
        }
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch {
          resolve(undefined);
        }
      });
    });
  }
}
