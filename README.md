# Nightmare Browser

An **AI-first web browser** built on NW.js. Zero CORS, **full Node.js in every page** — including external websites. No sandboxing, no restrictions, no safety rails. Every tab has `require()`, `process`, `fs`, and the entire Node.js API. The red warning banner on web pages is just a warning — it does NOT disable anything. Chrome without the safety rails — designed from the ground up to be controlled by AI agents.

## Features

- **Full Node.js Everywhere**: Every page — local files, localhost, AND external websites — has full Node.js access. `require('fs')` works on google.com.
- **Zero CORS**: All X-Frame-Options and CSP headers stripped. Every page loads in every iframe.
- **Full API Control**: Every browser action is API-controllable via REST + MCP
- **JS Execution in Any Tab**: Run arbitrary JavaScript (with Node.js!) in any page via API
- **Console Log Streaming**: Capture all console output from every tab
- **Headless Mode**: Run without GUI for CI/CD and automation
- **Tabs, Bookmarks, History**: Full browser chrome with nightmare aesthetic
- **Three Warning Zones**: LOCAL, LOCALHOST, WEB — zones are informational only, all have equal power

## Quick Start

```bash
npm install
npm run dev          # Launch with DevTools
npm run dev:headless # Launch headless (API only)
```

## API

The control API runs on `http://localhost:6660` (configurable via `NIGHTMARE_API_PORT`).

### Core Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/state | Full browser state snapshot |
| GET | /api/tabs | List all tabs |
| POST | /api/tabs | Create new tab |
| GET | /api/tabs/:id | Get tab details |
| DELETE | /api/tabs/:id | Close tab |
| POST | /api/tabs/:id/navigate | Navigate to URL |
| POST | /api/tabs/:id/reload | Reload tab |
| POST | /api/tabs/:id/back | Go back |
| POST | /api/tabs/:id/forward | Go forward |
| POST | /api/tabs/:id/activate | Activate tab |
| POST | /api/tabs/:id/duplicate | Duplicate tab |
| POST | /api/tabs/:id/pin | Toggle pin |
| POST | /api/tabs/:id/mute | Toggle mute |
| POST | /api/tabs/:id/zoom | Set zoom level |
| POST | /api/tabs/:id/find | Find text in page |
| POST | /api/tabs/:id/execute | Execute JavaScript |
| GET | /api/tabs/:id/screenshot | Take screenshot |
| GET | /api/tabs/:id/html | Get page HTML |
| GET | /api/tabs/:id/console | Get console logs |
| POST | /api/tabs/:id/click | Click element |
| POST | /api/tabs/:id/type | Type into element |
| POST | /api/tabs/:id/wait-for | Wait for selector |
| GET | /api/tabs/:id/query | Query DOM |
| POST | /api/shutdown | Shutdown browser |
| POST | /api/relaunch | Relaunch browser |

### MCP Server

Connect as an MCP server for AI agent integration. All REST endpoints are auto-exposed as MCP tools.

## Development

```bash
npm run typecheck    # TypeScript strict check
npm run lint         # ESLint (zero warnings)
npm run test         # Vitest with 95% coverage
npm run build        # Production build
npm run check        # All of the above
```

## Architecture

```
src/browser/
  services/     Pure business logic (security-zones, tabs, navigation, etc.)
  components/   UI components (tab-bar, nav-bar, sidebar, etc.)
  api/          REST + MCP server (auto-synced via RouteRegistry)
  __tests__/    Unit tests (1600+ tests, 99%+ coverage)
```

## Tech Stack

- **Runtime**: NW.js 0.109.0
- **Language**: TypeScript 5.x (strict mode)
- **Tests**: Vitest with V8 coverage
- **Linter**: ESLint + @typescript-eslint (strict + stylistic)
- **CI**: GitHub Actions

## License

Private
