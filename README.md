# pttrn

A monorepo for the Pattern Design System: React components, Web Components, icons, styles, and the docs site that documents them.

## Packages

| Path                                 | Package             | Description                                                                   |
| ------------------------------------ | ------------------- | ----------------------------------------------------------------------------- |
| [`packages/react`](packages/react)   | `@ptrn/react`       | The React component library.                                                  |
| [`packages/web`](packages/web)       | `@ptrn/web`         | The same components as framework-free Web Components (Lit). Accordion so far. |
| [`packages/icons`](packages/icons)   | `@ptrn/icons`       | The icon set (material and custom `nowhere` icons).                           |
| [`packages/styles`](packages/styles) | `@ptrn/styles`      | The USWDS design tokens and themes, plus the shared reset.                    |
| [`packages/mcp`](packages/mcp)       | `@ptrn/mcp`         | MCP server for AI coding tools: components, tokens, icons and a validator.    |
| [`docs`](docs)                       | `ptrn-docs`         | The documentation and demo site, built with the packages above.               |
| [`figma-plugin`](figma-plugin)       | `ptrn-figma-plugin` | Figma plugin that exports design tokens for `@ptrn/styles`.                   |

## Installing

```bash
npm install @ptrn/react   # React components
npm install @ptrn/web     # Web Components, no React needed
claude mcp add pttrn -- npx -y @ptrn/mcp   # MCP server for AI coding tools
```

Both take their design tokens from the `@ptrn/styles` stylesheets on the page (see [Theme](#theme)). No `.npmrc` or token is needed.

## Getting started

```bash
npm install
```

This is an npm workspace, so `@ptrn/react`, `@ptrn/web`, `@ptrn/icons`, and `@ptrn/styles` are linked from `packages/` automatically — no `npm link` needed.

```bash
npm run build      # build icons, react, then web
npm run dev        # run the docs site against the local packages
npm run lint       # lint every workspace that defines a lint script
npm run test       # test every workspace that defines a test script
```

## Theme

The styles use the USWDS design tokens, exported from the USWDS Design Kit in Figma. There are three USWDS themes: `default`, `project-theme` and `project-theme-dark`. Load the tokens, then one theme:

```css
@import '@ptrn/styles/tokens.css';
@import '@ptrn/styles/themes/default.css';
```

…or, in React, render the styles provider, which loads every theme. `UIProvider` picks one with `data-uswds-theme` on `<html>`:

```tsx
import { StylesProvider } from '@ptrn/react/StylesProvider';
```

## Attribution

pttrn is released under the [MIT License](LICENSE). See [NOTICE.md](NOTICE.md) for where this code came from and for the licenses of the third-party assets it includes.
