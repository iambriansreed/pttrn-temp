# pttrn MCP server: design

Status: approved in chat. Stage 1 is built and tested: `packages/mcp` (data build, all seven tools, `build_ui`, validator, stdio bin). Stage 2, the Railway HTTPS server in `mcp/`, is not started.

Added during stage 1, not in the original design:

- `build:data` runs `validate_code` over every docs usage example and does not serve any that disagree with their component's props (12 of 65 today, listed in the build output). An AI copies the example it is shown, so a stale one is worse than none. Fixing them in the docs brings them back automatically.
- `validate_code` does not flag a missing import as stale in examples, because docs examples are fragments that borrow neighbours from the playground. It still reports `missing-import` for real code.
- Known data gap: some props extract as `unknown` (for example `Flex` `align`, `justify`, `padding`), so their values are not checked.

## Goal

An engineer connects an AI client (Claude, Cursor, any MCP client) to pttrn, asks for a UI in plain language, and gets code that fits the design system: real `@ptrn/react` components, valid props, `@ptrn/icons` icons, and tokens instead of hardcoded values.

## Decisions

| Decision            | Choice                                                                                          | Why                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope               | Design system reference plus code generation                                                    | The engineer wants to ask for a screen and get pttrn-correct output.                                                                                                                                      |
| How "generate" works | The server supplies context and checks the result. The client AI writes the code.               | No LLM, API key or cost on our side, it works with any AI, and the output is as good as the client model. A server-side LLM would add cost and rate limits without improving quality.                      |
| Distribution        | One shared core, two entry points: npm stdio first, Railway HTTPS second                        | stdio needs no hosting and fits `@ptrn/*` npm publishing. HTTPS gives claude.ai and URL-only clients a single URL. Both call the same core, so neither contains logic.                                    |
| Package             | `packages/mcp`, published as `@ptrn/mcp`, bin `ptrn-mcp`                                        | Matches the other packages and is covered by the root `packages/*` workspace glob.                                                                                                                        |
| Server app          | `mcp/` at the repo root, private, never published. Added to the root `workspaces`.              | Railway hosts a Node app that imports `@ptrn/mcp` core and adds only HTTP. Static hosting cannot serve it: MCP over HTTP is POST JSON-RPC, and GitHub Pages rejects POST.                                 |
| Data                | A build step snapshots existing metadata into slim JSON inside the package                      | The repo already generates it: `docs/src/meta/data.json` (components, usage code, utilities, types), `packages/react/types.json`, `packages/styles` tokens, `packages/icons`. Nothing new is scraped.   |
| Versioning          | The snapshot is stamped with the `@ptrn/react` version and every tool result includes it        | Upgrading the MCP means upgrading the design system, and an AI can tell which version its answer is from.                                                                                                 |
| Stack               | TypeScript, `@modelcontextprotocol/sdk`, `zod`, `node:test`-style tests run with `tsx`          | The official SDK covers both transports. `zod` gives the tool schemas.                                                                                                                                    |
| Node                | `packages/mcp` engines `>=22` (like the other published packages), `mcp/` `>=24`                | Consumers on Node 22 are not warned. The private app runs on the repo's Node.                                                                                                                             |

## Layout

- `packages/mcp/src/core/`: catalog (load and query the data), search, tokens, icons, validator, tool definitions. Pure functions over the data, no I/O beyond reading the bundled JSON.
- `packages/mcp/src/stdio.ts`: the bin. Registers the core tools on the SDK's stdio transport.
- `packages/mcp/scripts/build-data.ts`: writes `packages/mcp/data/*.json` from the sources above. Runs in `npm run build`.
- `packages/mcp/data/`: generated, shipped in the npm package, gitignored.
- `mcp/src/server.ts`: Node HTTP server. Stateless Streamable HTTP at `/mcp`, `GET /health`, per-IP rate limit. Listens on `$PORT`. Railway terminates TLS, so the app serves plain HTTP behind it.
- `mcp/Dockerfile` (or Nixpacks) and `railway.json`: build the data, then start the server.

## Tools

All results are compact JSON and size-capped, so a large component cannot flood the AI's context. Every result carries the design system version.

| Tool                        | Returns                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `list_components()`         | Every component name with a one-line description, so the AI can browse.                                          |
| `search_components(query)`  | Ranked matches by name, description and slug ("date picker", "modal").                                           |
| `get_component(name)`       | Description, props with types, allowed values and defaults, dependencies, the import path and a usage example.  |
| `search_icons(query)`       | Icon names with their `@ptrn/icons/<Name>` import path.                                                          |
| `get_tokens(kind?)`         | Colors, spacing, typography and other CSS variables from `@ptrn/styles`, optionally one kind.                   |
| `get_guidelines()`          | The consumer guide (`guide.md`): imports, the theme setup (`StylesProviderNowhere`, the stylesheet import), token and composition rules.                  |
| `validate_code(code)`       | Issues found in TSX, each with a suggested fix. See below.                                                       |

Unknown names never fail hard: `get_component("Buton")` returns "did you mean Button?".

### `validate_code`

Parses the TSX and reports, each with location and suggested fix:

- an import from `@ptrn/react` or `@ptrn/icons` that does not exist;
- a component prop that does not exist, or a value outside its allowed set;
- an icon that does not exist;
- a hardcoded hex color, or a pixel value where a token exists;
- a raw HTML element where a pttrn component exists (`<button>` for `Button`).

It never throws on bad input. A parse failure comes back as an issue. v1 favours few false positives over completeness: a check that cannot be made reliably is left out.

### Prompt: `build_ui(description)`

A prompt template that tells the AI to search components first, read each component it plans to use, write the code, run `validate_code`, and fix every issue before answering. This is what makes "ask for a UI, get a pttrn UI" work without the engineer knowing tool names.

## Data build

`build-data.ts` reads:

- `docs/src/meta/data.json`: `componentsMeta` (89 entries: name, slug, description, dependencies, usage code, css) and `typesMeta` (166 entries). A component's props are the `typesMeta` entry named `<Component>Props`, whose `properties[]` holds name, required, description, default, type and `options` (the allowed values for a union). It is generated by `npm run meta` in `packages/react` and is not committed, so the build runs the meta step first if the file is missing.
- `packages/styles/nowhere.css`: the CSS custom properties (about 640, grouped by prefix such as `--spacing-sizing-*`, `--colors-neutral-*`, `--typography-*`, `--radius-*`), each with the comment above it.
- `packages/icons`: the `*.svg` names (926 icons), `icon-aliases.json` for search synonyms. An icon `Person` is imported as `import { SvgPerson } from '@ptrn/icons/Person'`.
- A consumer guide authored in `packages/mcp/guide.md`: imports, the stylesheet and provider setup, when to use tokens, composition rules. `packages/react/GUIDELINES.md` is contributor guidance (how to write library code), so it is not served.

`get_guidelines` returns `guide.md`, not `GUIDELINES.md`.

## Errors

- Unknown component or icon: suggestions, not an error.
- Oversized result: truncated with an explicit `truncated: true` and a hint to narrow the query.
- Bad tool input: the `zod` message, returned as a normal tool error.
- HTTP: 400 for malformed JSON-RPC, 429 for rate limiting, 500 with no internals leaked.

## Testing

- Unit tests for search and the validator, using fixture snippets of good and bad pttrn code.
- A snapshot test that fails if the data build loses a component, an icon or a token group.
- Integration tests that start the server and call every tool through the real MCP client SDK over stdio and over HTTP.
- The data build is exercised in CI by `npm run build`, so a metadata shape change fails the build, not a user.

## Release

`@ptrn/mcp` publishes with the other `@ptrn/*` packages (Phase 2 in `plan.md`, GitHub Release, skipped if the version is already on npm). The Railway service redeploys on each release so the URL matches the npm version.

## Out of scope for v1

- Server-side code generation with an LLM.
- Authentication (the data is public design system information). Rate limiting only.
- Figma-to-code.
- `@ptrn/web` (Web Components) support in `validate_code`; add it when that package exists.
- Sessions, a database, or any per-user state.

## Open questions

- The public hostname for the Railway service (for example `mcp.pttrn.iambrian.com`). Needed only for the README's connect instructions.
