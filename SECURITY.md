# Security

## Supported versions

Only the latest published minor of each `@ptrn/*` package receives security fixes.

## Reporting a vulnerability

Report vulnerabilities privately, not in a public issue:

- GitHub: use **Report a vulnerability** on the repository's Security tab (private vulnerability reporting).
- Email: me@iambrian.com

Include the package and version, a description, and steps to reproduce. You will get an acknowledgement within a week. Fixes ship as a patch release with a changelog entry that credits the reporter unless they ask otherwise.

## Scope

The `@ptrn/*` packages, the docs site, the MCP server and the Figma plugin in this repository. The MCP server serves public design system data and holds no user state; still, report anything that lets a client crash it, exhaust it, or make it return data from outside its bundle.
