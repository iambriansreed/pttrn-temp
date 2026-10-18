# @ptrn/styles

The pttrn design tokens, exported from the USWDS Design Kit in Figma, plus the reset that `@ptrn/react` and `@ptrn/web` share.

| File                            | What it is                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `tokens.css`                    | Every token except the theme: the USWDS primitives, the font collections and their modes.                       |
| `themes/default.css`            | The `default` USWDS theme, complete.                                                                            |
| `themes/project-theme.css`      | The `project-theme` USWDS theme, complete.                                                                      |
| `themes/project-theme-dark.css` | The `project-theme-dark` USWDS theme, complete.                                                                 |
| `fonts.css`                     | Hand-written. Loads Public Sans, Merriweather and Roboto Mono from Google Fonts.                                |
| `reset.css`                     | Hand-written. `@ptrn/react` loads it for the page, and each `@ptrn/web` element includes it in its shadow root. |

## Use it

Load the fonts and `tokens.css`, then one theme file:

```css
@import '@ptrn/styles/fonts.css';
@import '@ptrn/styles/tokens.css';
@import '@ptrn/styles/themes/default.css';
```

Each theme file sets `:root` and `[data-uswds-theme="<name>"]`, so the last one loaded is the page default. Load more than one only to switch part of the page with the `data-uswds-theme` attribute.

From Sass, load a file with the Node package importer (`--pkg-importer=node`, or `new NodePackageImporter()` in the API):

```scss
@use 'pkg:@ptrn/styles/reset';
```

## Update the tokens

`tokens.css` and `themes/` are generated. Do not edit them by hand.

1. Build the Figma plugin: `npm run build --workspace ptrn-figma-plugin`.
2. In the USWDS Design Kit file in Figma, run **Plugins → Development → pttrn Export Tokens** and click **Download ZIP**.
3. Unzip it into this folder, replacing `tokens.css` and `themes/`.

See [`figma-plugin/README.md`](../../figma-plugin/README.md) for what the export contains.
