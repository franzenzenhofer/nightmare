# Security Policy

## Important: Nightmare Is Intentionally Dangerous

Nightmare Browser **deliberately disables web security features** including:

- CORS (Cross-Origin Resource Sharing) restrictions
- CSP (Content Security Policy) enforcement
- X-Frame-Options header enforcement
- Browser sandboxing
- Process isolation between tabs

This is by design. Nightmare is a **local development tool** for developers and AI agents who need unrestricted browser access.

## What This Means

- **Never use Nightmare for banking, email, or sensitive browsing.** Use Chrome or Firefox for that.
- **Never enter real passwords** on untrusted websites in Nightmare.
- **The security zone warnings are informational only.** They do not restrict functionality.
- **Every tab has full Node.js access**, including on external websites. A malicious page could access your filesystem.

## Reporting Security Issues

If you find a security vulnerability **in Nightmare's own code** (not the intentional security bypasses described above), please:

1. Open a GitHub issue at https://github.com/franzenzenhofer/nightmare/issues
2. Label it as a security issue
3. Describe the vulnerability and how to reproduce it

This project is a local development tool. There is no bug bounty program.

## Supported Versions

Only the latest version on the `main` branch is supported.
