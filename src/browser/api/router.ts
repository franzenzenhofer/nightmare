export interface RouteResponse {
  status: number;
  body: unknown;
}

type RouteHandler = (params: Record<string, string>, body: unknown) => RouteResponse;

interface Route {
  method: string;
  pattern: string;
  segments: string[];
  handler: RouteHandler;
  isExact: boolean;
}

export class Router {
  private readonly routes: Route[] = [];

  get(pattern: string, handler: RouteHandler): void {
    this.addRoute('GET', pattern, handler);
  }

  post(pattern: string, handler: RouteHandler): void {
    this.addRoute('POST', pattern, handler);
  }

  delete(pattern: string, handler: RouteHandler): void {
    this.addRoute('DELETE', pattern, handler);
  }

  handle(method: string, path: string, body?: unknown): RouteResponse | null {
    const pathSegments = path.split('/').filter(Boolean);

    let bestMatch: { route: Route; params: Record<string, string> } | null = null;

    for (const route of this.routes) {
      if (route.method !== method) continue;
      if (route.segments.length !== pathSegments.length) continue;

      const params: Record<string, string> = {};
      let matched = true;
      let isExactMatch = true;

      for (let i = 0; i < route.segments.length; i++) {
        const routeSeg = route.segments[i] ?? '';
        const pathSeg = pathSegments[i] ?? '';

        if (routeSeg.startsWith(':')) {
          params[routeSeg.slice(1)] = pathSeg;
          isExactMatch = false;
        } else if (routeSeg !== pathSeg) {
          matched = false;
          break;
        }
      }

      if (matched) {
        if (isExactMatch) {
          return route.handler(params, body);
        }
        if (!bestMatch) {
          bestMatch = { route, params };
        }
      }
    }

    if (bestMatch) {
      return bestMatch.route.handler(bestMatch.params, body);
    }

    return null;
  }

  private addRoute(method: string, pattern: string, handler: RouteHandler): void {
    const segments = pattern.split('/').filter(Boolean);
    const isExact = !segments.some((s) => s.startsWith(':'));
    this.routes.push({ method, pattern, segments, handler, isExact });
  }
}
