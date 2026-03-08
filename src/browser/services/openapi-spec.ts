import type { RouteMetadata } from './openapi-routes';
import { ROUTE_METADATA } from './openapi-routes';

export interface OpenApiSpec {
  readonly openapi: string;
  readonly info: {
    readonly title: string;
    readonly version: string;
    readonly description: string;
  };
  readonly servers: readonly { readonly url: string }[];
  readonly paths: Record<string, Record<string, unknown>>;
  readonly tags: readonly { readonly name: string; readonly description: string }[];
}

const TAG_DESCRIPTIONS: Readonly<Record<string, string>> = {
  tabs: 'Tab management (create, close, activate, pin, mute, duplicate, zoom)',
  navigation: 'Page navigation (navigate, back, forward, reload)',
  console: 'Console log capture and streaming',
  webview: 'Webview interaction (execute JS, screenshot, HTML, click, type, wait, query)',
  state: 'Browser state snapshots',
  system: 'System lifecycle (shutdown, relaunch)',
};

export function classifyTag(path: string, mcpName: string): string {
  if (mcpName.includes('shutdown') || mcpName.includes('relaunch')) return 'system';
  if (mcpName.includes('execute') || mcpName.includes('screenshot')
    || mcpName.includes('html') || mcpName.includes('click')
    || mcpName.includes('type_text') || mcpName.includes('wait_for')
    || mcpName.includes('query_dom')) return 'webview';
  if (mcpName.includes('console')) return 'console';
  if (path === '/api/state') return 'state';
  if (mcpName.includes('navigate') || mcpName.includes('back')
    || mcpName.includes('forward') || mcpName.includes('reload')) return 'navigation';
  return 'tabs';
}

export function convertPathToOpenApi(path: string): string {
  return path.replace(/:(\w+)/g, '{$1}');
}

export function buildPathParams(path: string): readonly Record<string, unknown>[] {
  const matches = path.match(/:(\w+)/g);
  if (!matches) return [];
  return matches.map((m) => ({
    name: m.slice(1),
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
}

export function buildRequestBody(
  inputSchema: Record<string, unknown>,
  method: string,
): Record<string, unknown> | undefined {
  if (method === 'GET' || method === 'DELETE') return undefined;
  const props = inputSchema.properties as Record<string, unknown> | undefined;
  if (!props || Object.keys(props).length === 0) return undefined;
  const bodyProps: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(props)) {
    if (key !== 'tabId') bodyProps[key] = val;
  }
  if (Object.keys(bodyProps).length === 0) return undefined;
  const required = inputSchema.required as string[] | undefined;
  const bodyRequired = required?.filter((r) => r !== 'tabId');
  const schema: Record<string, unknown> = { type: 'object', properties: bodyProps };
  if (bodyRequired && bodyRequired.length > 0) schema.required = bodyRequired;
  return { required: true, content: { 'application/json': { schema } } };
}

export function buildOperation(route: RouteMetadata): Record<string, unknown> {
  const tag = classifyTag(route.path, route.mcpName);
  const pathParams = buildPathParams(route.path);
  const requestBody = buildRequestBody(route.inputSchema, route.method);
  const op: Record<string, unknown> = {
    operationId: route.mcpName,
    summary: route.description,
    tags: [tag],
    responses: {
      '200': {
        description: 'Successful response',
        content: { 'application/json': { schema: { type: 'object' } } },
      },
    },
  };
  if (pathParams.length > 0) op.parameters = pathParams;
  if (requestBody !== undefined) op.requestBody = requestBody;
  return op;
}

function collectTags(routes: readonly RouteMetadata[]): readonly { readonly name: string; readonly description: string }[] {
  const used = new Set<string>();
  for (const route of routes) {
    used.add(classifyTag(route.path, route.mcpName));
  }
  return [...used].map((t) => ({
    name: t,
    description: TAG_DESCRIPTIONS[t] ?? t,
  }));
}

export function generateOpenApiSpec(): OpenApiSpec {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const route of ROUTE_METADATA) {
    const oaPath = convertPathToOpenApi(route.path);
    const method = route.method.toLowerCase();
    const existing = paths[oaPath] ?? {};
    existing[method] = buildOperation(route);
    paths[oaPath] = existing;
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'Nightmare Browser API',
      version: '1.0.0',
      description: 'AI-first browser control API. Every browser action is API-controllable.',
    },
    servers: [{ url: 'http://localhost:6660' }],
    paths,
    tags: collectTags(ROUTE_METADATA),
  };
}
