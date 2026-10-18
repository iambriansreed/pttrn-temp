# @ptrn/styles

The pttrn design tokens and the reset that `@ptrn/react` and `@ptrn/web` share.

The tokens come from the USWDS Design Kit in Figma. The source of truth in this package is `tokens/`, a set of
[DTCG](https://www.designtokens.org/) token files the Figma plugin exports; everything else here is built from them.

| File                            | What it is                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `tokens/`                       | The token source: `manifest.json` plus one DTCG file per collection, or per mode of a multi-mode collection.    |
| `tokens.css`                    | Built. Every token except the theme: the USWDS primitives, the font collections and their modes.                |
| `themes/default.css`            | Built. The `default` USWDS theme, complete.                                                                     |
| `themes/project-theme.css`      | Built. The `project-theme` USWDS theme, complete.                                                               |
| `themes/project-theme-dark.css` | Built. The `project-theme-dark` USWDS theme, complete.                                                          |
| `tokens.js`, `tokens.d.ts`      | Built. Every token with its CSS name, Figma name, type, value and mode values, typed, for tooling and the docs. |
| `fonts.css`                     | Hand-written. Loads Public Sans, Merriweather and Roboto Mono from Google Fonts.                                |
| `reset.css`                     | Hand-written. `@ptrn/react` loads it for the page, and each `@ptrn/web` element includes it in its shadow root. |

## Use it

Load the fonts and `tokens.css`, then one theme file:

```css
@import '@ptrn/styles/fonts.css';
@import '@ptrn/styles/tokens.css';
@import '@ptrn/styles/themes/default.css';
```

Each theme file sets `:root` and `[data-uswds-theme="<name>"]`, so the last one loaded is the page default. Load more
than one only to switch part of the page with the `data-uswds-theme` attribute. The header of `tokens.css` lists the
other mode attributes (`data-font-type-*`, `data-font-role-*`).

From Sass, load a file with the Node package importer (`--pkg-importer=node`, or `new NodePackageImporter()` in the
API):

```scss
@use 'pkg:@ptrn/styles/reset';
```

From JavaScript or TypeScript, the token catalog:

```ts
import { tokens, collections } from '@ptrn/styles/tokens';

tokens['--usa-color-red-50'].value; // 'rgb(216 57 51)'
tokens['--theme-color-ink'].modes; // { 'project-theme-dark': 'var(--usa-color-gray-5)', ... }
```

Tools that read DTCG files can load `@ptrn/styles/tokens/manifest.json` and the files it lists.

## The token files

`tokens/manifest.json` records where the tokens came from (the Figma file and when it was exported) and lists every
collection: its name, slug, the `data-*` attribute that switches its mode, its modes and the default. A single-mode
collection is one file, `<collection>.tokens.json`; a multi-mode collection has one complete file per mode,
`<collection>/<mode>.tokens.json`. The theme collection (`USWDS Theme`) builds into `themes/` instead of blocks in
`tokens.css`.

Each file is a DTCG document whose top-level group is the collection slug, so a reference is unambiguous across
collections: `{color.usa.color.red.50}`. Every token carries `$extensions.pttrn.css`, its custom property name exactly
as the stylesheets declare it, and `$extensions.pttrn.figma`, its name in Figma. Colors are `srgb` objects with a hex
fallback, sizes are `dimension` objects, and a few Figma string variables that no DTCG type fits (a size name, a focus
style) use `string`, which is pttrn's extension of the type list.

## Update the tokens

1. Build the Figma plugin: `npm run build --workspace ptrn-figma-plugin`.
2. In the USWDS Design Kit file in Figma, run **Plugins → Development → pttrn Export Tokens** and click
   **Download ZIP**.
3. Replace this package's `tokens/` folder with the `tokens/` folder from the ZIP.
4. Run `npm run build --workspace @ptrn/styles`. It rebuilds `tokens.css`, `themes/` and `tokens.js` from the token
   files; CI fails if the built files and the token files disagree.

The ZIP also holds the stylesheets the plugin builds itself, so a consumer without this pipeline can still use the
export directly. An export from an older plugin version that only produced CSS can be imported with
`npm run tokens:import -- --from <folder with tokens.css and themes/>`.

See [`figma-plugin/README.md`](../../figma-plugin/README.md) for what the export contains.
