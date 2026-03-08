import { Router } from './router';
import { RouteRegistry } from './route-registry';
import type { RouteDefinition } from './route-registry';
import { registerAllRoutes } from './route-definitions';
import type { RouteDependencies } from './route-definitions';

function getBody(body: unknown): Record<string, unknown> {
  if (body !== null && body !== undefined) {
    return body as Record<string, unknown>;
  }
  return {};
}

export function param(
  params: Record<string, string>,
  key: string,
): string {
  return params[key] ?? '';
}

function addToRouter(router: Router, def: RouteDefinition): void {
  const wrapped = (
    params: Record<string, string>,
    body: unknown,
  ): ReturnType<typeof def.handler> => {
    return def.handler({
      pathParams: params,
      body: getBody(body),
    });
  };

  switch (def.method) {
    case 'GET':
      router.get(def.path, wrapped);
      break;
    case 'POST':
      router.post(def.path, wrapped);
      break;
    case 'DELETE':
      router.delete(def.path, wrapped);
      break;
  }
}

export function createRouteRegistry(
  deps: RouteDependencies,
): RouteRegistry {
  const registry = new RouteRegistry();
  registerAllRoutes(registry, deps);
  return registry;
}

export function createApiRouter(deps: RouteDependencies): Router {
  const registry = createRouteRegistry(deps);
  const router = new Router();

  for (const def of registry.getDefinitions()) {
    addToRouter(router, def);
  }

  return router;
}
