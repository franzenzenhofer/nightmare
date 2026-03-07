# CLAUDE.md — Nightmare Browser

## Autonomous Mode

**You are on your own. Do NOT ask the user any questions.** Answer all your own questions. Make all decisions yourself. Choose the best path and execute. Continue until the project is 100% done and the golden goal is reached. The user is away — treat every decision as yours to make.

---

## Golden Goal

Build an **AI-first web browser** on NW.js with tabs, URL bar, bookmarks, history, and three security zones (LOCAL/LOCALHOST/WEB). Zero CORS, full Node.js integration for local zones, permanent red warning bar for open web. Chrome without the safety rails — **designed from the ground up to be controlled by AI agents.**

**Core differentiator:** Every browser action is API-controllable. Built-in MCP server. Console log streaming. Full headless mode. An AI can open Nightmare, navigate, execute JS, read console output, take screenshots, and debug web apps — all via API or MCP protocol.

**See `briefing.md` for the complete visual architecture specification.** This file defines HOW we build it.

### Headless Mode

Nightmare runs in two modes:

| Mode | Flag | Use Case |
|------|------|----------|
| **GUI** | `nightmare` (default) | Human use, visual browser |
| **Headless** | `nightmare --headless` | AI agents, CI/CD, automation |

In headless mode:
- No window is rendered (NW.js `show: false` or `xvfb` wrapper)
- The API server starts immediately on `NIGHTMARE_API_PORT` (default: 6660)
- MCP server is available via stdio or SSE
- All browser features work identically (tabs, navigation, zones, console capture)
- Process exits cleanly on `POST /api/shutdown` or SIGTERM
- Stdout outputs the API URL on startup: `{"ready": true, "api": "http://localhost:6660", "mcp": "http://localhost:6660/mcp"}`

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | NW.js (latest stable) |
| Language | TypeScript 5.x — `strict: true`, no `any`, no vanilla JS |
| Test Framework | Vitest |
| Test Coverage | **>= 95%** unit test coverage (enforced in CI) |
| Linter | ESLint + @typescript-eslint (strict + stylistic configs) |
| Formatter | Prettier |
| Build | tsc for type checking, NW.js for packaging |
| Package Manager | bun |
| E2E Tests | Playwright |

---

## TDD Workflow — Red, Green, Refactor

**Every feature starts with a failing test. No exceptions.**

```
1. RED    — Write a test that describes the desired behavior. Run it. It MUST fail.
2. GREEN  — Write the MINIMUM code to make the test pass. Nothing more.
3. REFACTOR — Clean up. Remove duplication. Improve names. Tests must stay green.
4. REPEAT — Next behavior. Next test. Next cycle.
```

### Rules

- **Never write implementation code without a failing test first.**
- **Never write more code than needed to pass the current test.**
- **Tests are first-class code** — same quality standards as production code.
- **Test file location:** `src/browser/__tests__/<module>.test.ts` (co-located with source)
- **Test naming:** `describe('<ClassName>')` → `it('<behavior in plain English>')`
- **No mocks of internal code.** Use real implementations. Mock only external I/O (filesystem, network) at the boundary.
- **Each test must be independent.** No shared mutable state between tests. Use `beforeEach` for fresh instances.

### Coverage Enforcement

```bash
# Must pass before any commit
bun run test -- --coverage --coverage.thresholds.lines=95 --coverage.thresholds.functions=95 --coverage.thresholds.branches=95 --coverage.thresholds.statements=95
```

---

## Quality Gates

**ALL must pass before any commit or PR:**

```bash
bun run typecheck   # tsc --noEmit (zero errors)
bun run lint        # ESLint strict (zero warnings, zero errors)
bun run test        # Vitest with 95% coverage thresholds
bun run build       # Clean production build
```

Shorthand: `bun run check` runs all four in sequence.

---

## TypeScript Configuration

```jsonc
// tsconfig.json — non-negotiable settings
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  }
}
```

---

## ESLint Configuration

Strict + stylistic. Zero tolerance for warnings.

```jsonc
// Key rules (non-negotiable)
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": "error",
  "@typescript-eslint/explicit-function-return-type": "error",
  "@typescript-eslint/strict-boolean-expressions": "error",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": "error",
  "@typescript-eslint/prefer-readonly": "error",
  "@typescript-eslint/switch-exhaustiveness-check": "error",
  "no-console": "warn",
  "no-debugger": "error",
  "eqeqeq": ["error", "always"],
  "no-var": "error",
  "prefer-const": "error",
  "no-param-reassign": "error"
}
```

---

## AI/API Steerability — The Killer Feature

Nightmare is **100% controllable by AI agents** via a built-in localhost API and MCP server.

### Control API (localhost HTTP + WebSocket)

Every browser action is exposed as an API endpoint on `http://localhost:NIGHTMARE_PORT`:

```
POST /api/tabs                    → Create tab
DELETE /api/tabs/:id              → Close tab
POST /api/tabs/:id/navigate      → Navigate to URL
POST /api/tabs/:id/back          → Go back
POST /api/tabs/:id/forward       → Go forward
POST /api/tabs/:id/reload        → Reload
GET  /api/tabs                   → List all tabs
GET  /api/tabs/:id               → Get tab details (url, title, zone, loading)
POST /api/tabs/:id/execute       → Execute JS in tab context
GET  /api/tabs/:id/screenshot    → Screenshot as PNG
GET  /api/tabs/:id/html          → Get page HTML
POST /api/bookmarks              → Add bookmark
GET  /api/bookmarks              → List bookmarks
GET  /api/history                → Search history
GET  /api/state                  → Full browser state snapshot
WS   /api/events                 → Real-time event stream (all browser events)
```

### Console Log Streaming

**All console output from every tab is captured and streamed:**

```
GET  /api/tabs/:id/console       → Get console log buffer for tab
WS   /api/console                → Real-time console stream (all tabs)
```

Every `console.log`, `console.error`, `console.warn` from every webview is intercepted, tagged with `{tabId, level, timestamp, args}`, and:
1. Stored in a ring buffer (last 10,000 entries per tab)
2. Streamed over WebSocket to connected clients
3. Available via REST API with filtering

### MCP Server (Model Context Protocol)

Nightmare exposes a **built-in MCP server** so AI agents (Claude Code, etc.) can connect directly:

```
Transport: stdio or SSE on http://localhost:NIGHTMARE_PORT/mcp
```

**MCP Tools exposed:**

| Tool | Description |
|------|-------------|
| `nightmare_create_tab` | Open a new tab with URL |
| `nightmare_close_tab` | Close a tab by ID |
| `nightmare_navigate` | Navigate active/specified tab to URL |
| `nightmare_go_back` | Navigate back |
| `nightmare_go_forward` | Navigate forward |
| `nightmare_reload` | Reload tab |
| `nightmare_list_tabs` | List all open tabs with state |
| `nightmare_get_tab` | Get full tab state |
| `nightmare_execute_js` | Execute JavaScript in tab context |
| `nightmare_screenshot` | Take screenshot of tab |
| `nightmare_get_html` | Get page HTML content |
| `nightmare_get_console` | Read console log buffer |
| `nightmare_get_state` | Full browser state snapshot |
| `nightmare_add_bookmark` | Add a bookmark |
| `nightmare_search_history` | Search browsing history |
| `nightmare_find_in_page` | Ctrl+F search in page |
| `nightmare_click` | Click element by selector |
| `nightmare_type` | Type text into element |
| `nightmare_wait_for` | Wait for selector/condition |

**MCP Resources exposed:**

| Resource | Description |
|----------|-------------|
| `nightmare://tabs` | Live tab list |
| `nightmare://console/{tabId}` | Console logs for tab |
| `nightmare://state` | Full browser state |

### Architecture for API Layer

```
src/browser/
  api/
    server.ts          → HTTP + WebSocket server (Bun.serve or Node http)
    router.ts          → Route matching and dispatch
    handlers/
      tabs.ts          → Tab CRUD endpoints
      console.ts       → Console log buffer + streaming
      navigation.ts    → Navigation control endpoints
      bookmarks.ts     → Bookmark endpoints
      history.ts       → History endpoints
      state.ts         → State snapshot endpoint
      execute.ts       → JS execution endpoint
    mcp/
      server.ts        → MCP protocol handler
      tools.ts         → MCP tool definitions
      resources.ts     → MCP resource definitions
    console-capture.ts → Intercept webview console output
    event-bus.ts       → Internal event bus (browser events → API/WS/MCP)
    __tests__/
      router.test.ts
      handlers/*.test.ts
      console-capture.test.ts
      event-bus.test.ts
```

### Event Bus

All browser events flow through a central event bus:

```typescript
type BrowserEvent =
  | { type: 'tab:created'; tab: Tab }
  | { type: 'tab:closed'; tabId: string }
  | { type: 'tab:navigated'; tabId: string; url: string }
  | { type: 'tab:loaded'; tabId: string; title: string }
  | { type: 'tab:loading'; tabId: string }
  | { type: 'console'; tabId: string; level: string; args: unknown[] }
  | { type: 'zone:changed'; tabId: string; zone: SecurityZone }
  | { type: 'bookmark:added'; bookmark: Bookmark }
  | { type: 'error'; tabId: string; error: string };
```

Events are broadcast to: WebSocket clients, MCP subscribers, internal UI components.

### Design Principles for API

- **Every UI action has an API equivalent.** If you can click it, you can API it.
- **Console logs are never lost.** Ring buffer + streaming ensures full observability.
- **API port is configurable** via `--api-port` flag or `NIGHTMARE_API_PORT` env var. Default: `6660`.
- **No auth on localhost.** This is a local dev tool. Simplicity over security for the control API.
- **JSON everywhere.** All API responses are JSON. Screenshots are base64 in JSON.
- **WebSocket for real-time.** Console streams and browser events use WebSocket.
- **MCP for AI agents.** The MCP server makes Nightmare a first-class AI-controllable browser.

---

## Architecture Rules

### Hard Constraints

- **Single Responsibility:** One class/module = one job. No god objects.
- **Pure Functions:** Prefer pure functions. Side effects at the edges only.
- **No Magic Values:** All constants named and exported.
- **Named Exports Only:** No default exports.
- **Early Returns:** Guard clauses first, happy path last.
- **Immutability:** `readonly` by default. Mutate only when necessary.
- **Small Functions:** Max 30 lines per function. Max 150 lines per file.
- **Max 4 Parameters:** Use an options object for more.
- **No Boolean Parameters:** Use named options or separate functions.
- **No Commented-Out Code:** Delete it. Git remembers.
- **No TODO Comments:** Fix it now or create an issue.
- **Composition Over Inheritance:** Prefer interfaces + composition.
- **Fail Fast, Fail Loud:** Throw on invalid state. No silent failures. No fallbacks.
- **DRY:** Never duplicate logic. Extract shared code immediately.
- **KISS:** Simplest solution that works. No clever code.

### Module Boundaries

```
src/browser/
  services/     → Pure business logic. No DOM. No NW.js APIs. 100% testable.
  components/   → UI components. Thin wrappers that delegate to services.
  api/          → HTTP + WebSocket + MCP server. AI control plane.
    handlers/   → REST endpoint handlers (tabs, console, navigation, etc.)
    mcp/        → MCP protocol server, tool + resource definitions.
  __tests__/    → Unit tests for services, API handlers, and component logic.

src/pages/      → Internal pages (newtab, settings, history, bookmarks, about).
src/styles/     → CSS files. Design tokens in tokens.css.
e2e/            → Playwright integration tests.
```

**Services are the core.** They must work without a DOM. All business logic lives here. Components are thin UI layers that call services. The API layer delegates everything to services — it is a thin HTTP/MCP adapter.

---

## Build Order (TDD Phases)

Follow this order. Each phase is RED-GREEN-REFACTOR cycles.

### Phase 1: Core Services (Pure Logic, No DOM)

1. **`security-zones.ts`** + `security-zones.test.ts` — URL classification, banner config, node enablement
2. **`tab.ts`** (model) + `tab.test.ts` — Tab interface, factory function, validation
3. **`tab-manager.ts`** + `tab-manager.test.ts` — Create, close, activate, duplicate, pin, update
4. **`navigation.ts`** + `navigation.test.ts` — URL resolution (port, domain, search, file, nightmare://)
5. **`bookmarks.ts`** + `bookmarks.test.ts` — CRUD, folders, search, import/export
6. **`history.ts`** + `history.test.ts` — Add visit, search, recent, most visited, clear
7. **`storage.ts`** + `storage.test.ts` — JSON persistence layer
8. **`settings.ts`** + `settings.test.ts` — Home page, theme, search engine, downloads path

### Phase 2: Components (UI Logic, Minimal DOM)

9. **`security-banner.ts`** + `security-banner.test.ts` — Show/dismiss/permanent logic
10. **`tab-bar.ts`** + `tab-bar.test.ts` — Tab rendering, events, drag-reorder
11. **`nav-bar.ts`** + `nav-bar.test.ts` — Button states, URL input, zone dot
12. **`url-input.ts`** + `url-input.test.ts` — Autocomplete, smart resolution
13. **`bookmarks-bar.ts`** + `bookmarks-bar.test.ts` — Display, click, star button
14. **`titlebar.ts`** + `titlebar.test.ts` — Window controls, drag region
15. **`status-bar.ts`** + `status-bar.test.ts` — Zone, node version, tab count, clock
16. **`context-menu.ts`** + `context-menu.test.ts` — Right-click menus
17. **`find-bar.ts`** + `find-bar.test.ts` — In-page search
18. **`sidebar.ts`** + `sidebar.test.ts` — Bookmarks/history/downloads panel

### Phase 3: API & AI Control Plane (Pure Logic, No DOM)

19. **`event-bus.ts`** + `event-bus.test.ts` — Central event bus, subscribe/emit, typed events
20. **`console-capture.ts`** + `console-capture.test.ts` — Console log interception, ring buffer, filtering
21. **`router.ts`** + `router.test.ts` — HTTP route matching and dispatch
22. **`handlers/tabs.ts`** + `handlers/tabs.test.ts` — Tab CRUD REST endpoints
23. **`handlers/console.ts`** + `handlers/console.test.ts` — Console log REST + WS streaming
24. **`handlers/navigation.ts`** + `handlers/navigation.test.ts` — Navigation control endpoints
25. **`handlers/execute.ts`** + `handlers/execute.test.ts` — JS execution in tab context
26. **`handlers/state.ts`** + `handlers/state.test.ts` — Full state snapshot
27. **`server.ts`** + `server.test.ts` — HTTP + WebSocket server lifecycle
28. **`mcp/tools.ts`** + `mcp/tools.test.ts` — MCP tool definitions
29. **`mcp/resources.ts`** + `mcp/resources.test.ts` — MCP resource definitions
30. **`mcp/server.ts`** + `mcp/server.test.ts` — MCP protocol handler

### Phase 4: Integration

31. **`browser.ts`** — Orchestrator. Wires services + components + webviews + API server.
32. **`node-bridge.ts`** — Inject nightmare API into local/localhost webviews.
33. **`index.html`** — Browser shell markup.
34. **Styles** — CSS files per the design tokens.
35. **Internal pages** — newtab, settings, history, bookmarks, about.
36. **Headless mode** — `--headless` flag, no window, API-only startup.

### Phase 5: Polish & Distribution

37. **Keyboard shortcuts** — Full mapping from briefing.
38. **Downloads manager** — Intercept + progress.
39. **System tray** — Minimize to tray, tray menu.
40. **E2E tests** — Playwright tests for full browser flows.
41. **API integration tests** — Test AI control flows end-to-end.
42. **Icons + branding** — Glitched N, all sizes.
43. **Build + package** — nw-builder for Win/Mac/Linux.

---

## Testing Conventions

### Unit Tests (Vitest)

```typescript
// Pattern for service tests
import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceUnderTest } from '../services/service-under-test';

describe('ServiceUnderTest', () => {
  let service: ServiceUnderTest;

  beforeEach(() => {
    service = new ServiceUnderTest();
  });

  describe('methodName', () => {
    it('describes expected behavior in plain English', () => {
      const result = service.methodName(input);
      expect(result).toBe(expected);
    });

    it('handles edge case X', () => {
      // ...
    });
  });
});
```

### What to Test

- **Every public method** of every service.
- **Every branch** — if/else, switch cases, error paths.
- **Edge cases** — empty inputs, nulls, boundary values, malformed URLs.
- **Security zone classification** is safety-critical — test exhaustively.
- **URL resolution** has many branches — test every pattern.

### What NOT to Test

- Private methods (test through public API).
- DOM rendering details (test logic, not pixels).
- NW.js platform APIs (mock at boundary, test your code around them).

---

## Commit Convention

```
<type>: <short description>

type = feat | fix | test | refactor | style | docs | chore
```

Examples:
- `test: add security-zones classification tests (RED)`
- `feat: implement security-zones to pass all tests (GREEN)`
- `refactor: extract isPrivateIp helper from security-zones`

**Commit after each RED-GREEN-REFACTOR cycle.** Not after each line. Not after each file. After each complete TDD cycle.

---

## Scripts (package.json)

```jsonc
{
  "scripts": {
    "dev": "nw src/ --devtools",
    "dev:headless": "nw src/ --headless",
    "build": "tsc && nw-builder --platforms linux,osx,win --buildDir dist/",
    "typecheck": "tsc --noEmit",
    "lint": "eslint 'src/**/*.ts' 'e2e/**/*.ts' --max-warnings 0",
    "lint:fix": "eslint 'src/**/*.ts' 'e2e/**/*.ts' --fix",
    "test": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "check": "bun run typecheck && bun run lint && bun run test && bun run build",
    "e2e": "playwright test",
    "format": "prettier --write 'src/**/*.ts'",
    "format:check": "prettier --check 'src/**/*.ts'"
  }
}
```

---

## File Naming

- **Files:** `kebab-case.ts` (e.g., `security-zones.ts`, `tab-manager.ts`)
- **Tests:** `<module>.test.ts` in `__tests__/` directory
- **CSS:** `kebab-case.css` matching component name
- **Interfaces/Types:** PascalCase, exported, in the module that owns them
- **Constants:** UPPER_SNAKE_CASE

---

## Security Zones — The #1 Priority

The security zone system is the heart of Nightmare. It MUST be:

- **100% covered** by tests (not just 95%).
- **Exhaustively tested** for edge cases: IPv6, private IP ranges, `.localhost` subdomains, malformed URLs, bare paths.
- **The first thing built.** Everything else depends on it.
- **Never relaxed.** The WEB zone warning is NEVER dismissable. This is a hard architectural constraint.

---

## What "Done" Looks Like

A phase is done when:

1. All tests pass (`bun run test` — green, 95%+ coverage).
2. Zero TypeScript errors (`bun run typecheck`).
3. Zero ESLint errors or warnings (`bun run lint`).
4. Build succeeds (`bun run build`).
5. Code committed with proper message.
6. No TODOs, no commented code, no `any` types, no skipped tests.
7. API endpoints tested and documented.
8. MCP tools verified with a test client.
