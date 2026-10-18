# @ptrn/mcp

An [MCP](https://modelcontextprotocol.io) server for the pttrn design system. Connect it to an AI client, ask for a UI, and the AI builds it from real `@ptrn/react` components, `@ptrn/icons` icons and `@ptrn/styles` tokens, then checks its own work.

## Connect

Claude Code:

```bash
claude mcp add pttrn -- npx -y @ptrn/mcp
```

Any client that takes an MCP config (Claude Desktop, Cursor, and others):

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

Then ask for what you want: "Build a sign-in form with an email field, a password field and a primary submit button." The `build_ui` prompt runs the whole loop. It is also available as a slash command in clients that show MCP prompts.

## What it gives the AI

| Tool                | What it does                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `list_components`   | Every component with a one-line description.                                                      |
| `search_components` | Finds components by name or purpose ("date picker", "modal").                                     |
| `get_component`     | Props with types, allowed values and defaults, the import path, dependencies and a usage example. |
| `search_icons`      | Finds icons by name or meaning, with the import path and named export.                            |
| `get_tokens`        | CSS variables with light and dark values. Call with no `kind` to list the groups.                 |
| `get_guidelines`    | Setup, imports, token and accessibility rules.                                                    |
| `validate_code`     | Checks TSX and reports problems with a suggested fix for each. See below.                         |

`validate_code` reports:

- imports from `@ptrn/react` or `@ptrn/icons` that do not exist, and icons imported without their `Svg` prefix;
- components used without an import;
- props a component does not have, values outside a prop's allowed set, and missing required props;
- hardcoded colors, and pixel spacing that has a token;
- raw HTML elements that have a pttrn component (`<button>` for `Button`).

Nothing here calls an LLM. The AI you already use writes the code, and this server gives it the design system and checks the result.

## Versions

The data is built from `@ptrn/react` at release time and every result carries that version, so upgrade `@ptrn/mcp` alongside `@ptrn/react`.

## Development

```bash
npm run build:data   # snapshot components, icons and tokens into data/
npm run build        # build:data, then compile to dist/
npm test             # unit tests, plus a real MCP client against the real server over stdio
npm run lint         # typecheck
```

`build:data` reads `docs/src/meta/data.json` (generating it with `npm run meta` if it is missing), `packages/icons/icon-aliases.json` and the `packages/styles` token and theme stylesheets. It runs `validate_code` over each docs usage example and does not serve any that disagree with their component's props, listing them so they can be fixed in the docs.
