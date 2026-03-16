# Contributing to Nightmare Browser

## Prerequisites

- Node.js 22+
- npm
- macOS, Linux, or Windows

## Setup

```bash
git clone https://github.com/franzenzenhofer/nightmare.git
cd nightmare
npm install
npm run dev
```

## Quality Gates

All four must pass before any commit:

```bash
npm run typecheck   # tsc --noEmit (zero errors)
npm run lint        # ESLint strict (zero warnings)
npm run test        # Vitest with 95% coverage
npm run build       # Clean build
```

Shorthand: `npm run check` runs all four.

## TDD Workflow

Every feature starts with a failing test:

1. **RED** — Write a test. Run it. It must fail.
2. **GREEN** — Write minimum code to pass.
3. **REFACTOR** — Clean up. Tests stay green.

## Commit Convention

```
<type>: <short description>

type = feat | fix | test | refactor | style | docs | chore
```

## Code Style

- TypeScript strict mode — no `any`, no `as` casts
- Named exports only (no default exports)
- Max 30 lines per function, 150 lines per file
- Pure functions preferred, side effects at boundaries
- No external fonts, no CDN resources
- No TODO comments — fix it or file an issue

## Filing Issues

- **Bug?** Use the bug report template. Include OS, Node version, and console output.
- **Feature?** Use the feature request template. Describe the problem, not just the solution.

## Pull Requests

1. Fork the repo, create a feature branch (`feature/your-thing`)
2. Write tests first (TDD)
3. Ensure `npm run check` passes
4. Open a PR with a clear description
