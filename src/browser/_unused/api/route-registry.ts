import type { RouteResponse } from './router';

export interface RouteParams {
  readonly pathParams: Record<string, string>;
  readonly body: Record<string, unknown>;
}

type RouteHandler = (params: RouteParams) => RouteResponse;

export interface RouteDefinition {
  readonly method: string;
  readonly path: string;
  readonly mcpName: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly handler: RouteHandler;
}

export class RouteRegistry {
  private readonly definitions: RouteDefinition[] = [];

  register(definition: RouteDefinition): void {
    this.definitions.push(definition);
  }

  getDefinitions(): readonly RouteDefinition[] {
    return [...this.definitions];
  }

  findByMcpName(name: string): RouteDefinition | undefined {
    return this.definitions.find((d) => d.mcpName === name);
  }

  findByRoute(method: string, path: string): RouteDefinition | undefined {
    return this.definitions.find(
      (d) => d.method === method && d.path === path,
    );
  }
}

export function extractPathParamNames(path: string): string[] {
  return path
    .split('/')
    .filter((s) => s.startsWith(':'))
    .map((s) => s.slice(1));
}
