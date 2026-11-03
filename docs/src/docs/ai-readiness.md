# AI readiness

A coding agent that builds UI with pttrn should do what a person reading these docs does: reach for a real component,
pass only the props it takes, import icons by their real names, and style with tokens. pttrn gives agents three ways to
learn the system, all built from the same component metadata as this site, so none of them can say something the
packages do not do.

## The MCP server

`@ptrn/mcp` is a [Model Context Protocol](https://modelcontextprotocol.io) server. Connected to an AI client (Claude,
Cursor, or any other MCP client), it gives the AI the whole catalog: every component's props with their types, allowed
values and defaults, the import path, a usage example and the behavior spec; the icons; the tokens with their value in
each theme; and the rules for building with pttrn. Its `validate_code` tool checks the TSX the AI wrote and returns a
suggested fix for each problem: an import that does not exist, a prop the component does not have, a value outside a
prop's allowed set, a hardcoded color or pixel spacing that has a token, a raw `<button>` where `Button` exists.

The AI writes the code; the server supplies the system and checks the result. Nothing on the server calls a language
model, so there is no API key, cost or rate limit on our side.

```bash
claude mcp add pttrn -- npx -y @ptrn/mcp
```

Any other client takes the same command in its MCP configuration:

```json
{
    "mcpServers": {
        "pttrn": {
            "command": "npx",
            "args": ["-y", "@ptrn/mcp"]
        }
    }
}
```

Then ask for a UI in plain language: "Build a sign-in form with an email field, a password field and a primary submit
button." The server's `build_ui` prompt has the AI search the components, read each one it plans to use, write the
code, run `validate_code` and fix every issue before it answers.

Until `@ptrn/mcp` is on npm, run it from a clone: `npm run build --workspace @ptrn/mcp`, then give the client
`node packages/mcp/dist/stdio.js` as the command.

The usage example on each component page is one an agent will copy, so each is held to the same check. Building the
server's data runs `validate_code` over every example, and the build fails on one that disagrees with its component's
props.

## llms.txt and DESIGN.md

[/llms.txt](/llms.txt) is the index of this site for language models, in the
[llms.txt](https://llmstxt.org) format: what pttrn is, the rules that matter most, and a link to every component page
with its import path, grouped by phase.

[/DESIGN.md](/DESIGN.md) is the whole system in one file: setup for React and for Web Components, how to
connect the MCP server, the rules for building with pttrn, every rule `validate_code` enforces, the token tiers and how
tokens are named, and every component with its import path. `@ptrn/react` ships the same file, so an agent working in
an app finds it at `node_modules/@ptrn/react/DESIGN.md`.

Both files are generated when the site is built, from the data the MCP server serves: the component metadata, the
server's guide and tools, and the validator's rules. When a component, a rule or a tool changes, they change with it.

## Agent-Ready signals

The Agent-Ready Design Systems Index scores a design system on five signals. Wrappers and third-party shims do not
count. Where pttrn stands:

| Signal                         | Status      | Notes                                                                                                                                                                                                    |
| ------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MCP server                     | Built       | `@ptrn/mcp` runs over stdio and publishes to npm with the other `@ptrn` packages. A hosted HTTPS endpoint, for clients that only take a URL, is planned.                                                 |
| llms.txt                       | Done        | [/llms.txt](/llms.txt), with [/DESIGN.md](/DESIGN.md) beside it, generated at build time.                                                                                                                |
| DTCG tokens                    | Done        | The Figma plugin exports the USWDS Design Kit variables as DTCG token files. `@ptrn/styles` builds its stylesheets from them and ships them as `@ptrn/styles/tokens/*.tokens.json`.                      |
| Installable component registry | Not started | A `registry.json` the shadcn CLI can install from, and an agent skill that teaches the import paths, the token rules and the validator.                                                                  |
| Code Connect                   | Not started | Figma Code Connect mappings, so Figma's own MCP server hands agents real `@ptrn/react` imports. They need a pttrn component library in Figma; the USWDS Design Kit alone has no pttrn components to map. |
