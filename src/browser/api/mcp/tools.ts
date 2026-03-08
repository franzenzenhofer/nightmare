import { RouteRegistry } from '../route-registry';
import { extractPathParamNames } from '../route-registry';
import { registerAllRoutes } from '../route-definitions';
import type { RouteDefinition } from '../route-registry';
import type { TabManager } from '../../services/tab-manager';
import type { ConsoleCapture } from '../console-capture';
import type { EventBus } from '../event-bus';

export interface McpToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

interface McpDependencies {
  readonly tabManager: TabManager;
  readonly consoleCapture: ConsoleCapture;
  readonly eventBus: EventBus;
}

type ToolHandler = (args: Record<string, unknown>) => unknown;

function mcpHandlerFromRoute(
  def: RouteDefinition,
): ToolHandler {
  const paramNames = extractPathParamNames(def.path);

  return (args: Record<string, unknown>): unknown => {
    const pathParams: Record<string, string> = {};
    const body: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(args)) {
      if (paramNames.includes(key)) {
        pathParams[key] = String(value);
      } else {
        body[key] = value;
      }
    }

    if ('tabId' in args && paramNames.includes('id')) {
      pathParams.id = String(args.tabId);
    }

    const result = def.handler({ pathParams, body });

    if (result.status === 404) {
      throw new Error('Tab not found');
    }

    return result.body;
  };
}

export class McpToolRegistry {
  private readonly tools = new Map<
    string,
    { definition: McpToolDefinition; handler: ToolHandler }
  >();

  constructor(deps: McpDependencies) {
    const registry = new RouteRegistry();
    registerAllRoutes(registry, deps);

    for (const def of registry.getDefinitions()) {
      const definition: McpToolDefinition = {
        name: def.mcpName,
        description: def.description,
        inputSchema: def.inputSchema,
      };
      const handler = mcpHandlerFromRoute(def);
      this.tools.set(def.mcpName, { definition, handler });
    }
  }

  listTools(): McpToolDefinition[] {
    return [...this.tools.values()].map((t) => t.definition);
  }

  callTool(
    name: string,
    args: Record<string, unknown>,
  ): ReturnType<ToolHandler> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    return tool.handler(args);
  }
}
