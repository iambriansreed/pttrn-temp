# pttrn Export Tokens

A Figma plugin that exports the file's variables and styles (paint, effect, text and grid) as a CSS stylesheet of custom properties.

## Install it in Figma

From Figma: **Plugins → Development → "Import Plugin from Manifest…"** and select `manifest.json` from the [`figma-plugin`](https://github.com/pttrn/pttrn/tree/main/figma-plugin) folder.

## Run it

1. Build the plugin: `npm run build --workspace ptrn-figma-plugin` from the monorepo root (or `npm run dev --workspace ptrn-figma-plugin` while developing).
2. In Figma: **Plugins → Development → pttrn Export Tokens**.
3. Wait for the progress bar to finish, then click **Download CSS** (a single `.css` file) or **Copy CSS**. When the export has image fills or theme files, the download becomes **Download ZIP**: the stylesheets plus an `images/` folder.
4. Unzip it into your project, or paste the copied CSS into a `.css` file.

## Theme files (USWDS Design Kit)

The plugin is built for the USWDS Design Kit. When the file has a variable collection named `USWDS Theme` (`THEME_COLLECTION` in `src/code.ts`), the ZIP holds a split export in place of the single stylesheet:

- `tokens.css`: everything except that collection (primitives, the other collections and their modes, element defaults and text style classes).
- `themes/<mode>.css`, one per mode (`default.css`, `project-theme.css`, `project-theme-dark.css`): every variable of the collection with that mode's values, under `:root, [data-uswds-theme="<mode>"]`.

Load `tokens.css`, then one theme file. Each theme file is complete, so it does not need `default.css` beside it. Each also sets `:root`, so when several are loaded the last one is the page default; load more than one only to switch part of the page with `data-uswds-theme`. **Copy CSS** still copies the single all-in-one stylesheet.

## What the CSS looks like

- Every variable becomes a custom property named by hyphenating its path (`primary/main` becomes `--primary-main`), with a comment above it holding the exact Figma name. On a name clash the later one is prefixed with its collection.
- Aliases stay aliases: `--button-bg: var(--primary-main);`.
- Each collection that has more than one mode, and whose values actually differ between them, gets its own attribute named after the collection: a collection named "Theme" is switched with `[data-theme="dark"]`, one named "Breakpoint" with `[data-breakpoint="md-672px"]`. The default mode is in `:root` and also under its own attribute value, so a subtree can switch back. Each block redeclares only that collection's changing variables plus anything that aliases them, so a nested attribute never keeps the outer value. Variables that are themed by a different collection are not redeclared in another collection's blocks, so set both attributes on the same element when two collections alias each other.
- Colors are `rgb(r g b)`, with `/ a%` added only when they are not fully opaque. FLOAT values get `px`, except those scoped only to font weight.
- Styles become custom properties too: paint styles as colors or gradients, effect styles as `box-shadow` and blur values, text styles as a `font` shorthand plus one property per field, and grid styles as count, gutter, margin, size and alignment values. Image fills become `url("images/<style-name>.<ext>")` backgrounds, and the ZIP holds those files (an image shared by several styles is included once).
- The same file ends with rules that use those tokens: a class for every text style (`.heading-xl { font: var(--heading-xl); … }`), and element defaults for `h1`–`h6`, `p`, `small` and `code`. Elements are chosen by name and size, not by a Figma setting: an explicit `H1`–`H6` in a name wins, otherwise headings are ranked by size, and `p`, `small` and `code` take the plain style closest to 16, 12 and 14px. The header lists which style became which element, so edit any that do not fit.

## Development

`src/code.ts` is the plugin's main thread and `src/ui.ts` runs in the panel. `npm run build` compiles both to the plugin root and inlines the compiled `ui.js` into `ui.html` from `src/ui.html`, because Figma cannot load a `<script src>` from a plugin panel. `code.js`, `ui.js` and `ui.html` in the root are generated.
