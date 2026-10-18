# pttrn Export Tokens

A Figma plugin that exports the file's variables and styles (paint, effect, text and grid) as DTCG token files and as a CSS stylesheet of custom properties. The token files are the source `@ptrn/styles` builds from; the stylesheet works on its own for anyone else.

## Install it in Figma

From Figma: **Plugins → Development → "Import Plugin from Manifest…"** and select `manifest.json` from the [`figma-plugin`](https://github.com/pttrn/pttrn/tree/main/figma-plugin) folder.

## Run it

1. Build the plugin: `npm run build --workspace ptrn-figma-plugin` from the monorepo root (or `npm run dev --workspace ptrn-figma-plugin` while developing).
2. In Figma: **Plugins → Development → pttrn Export Tokens**.
3. Wait for the progress bar to finish, then click **Download CSS** (a single `.css` file) or **Copy CSS**. When the export has image fills or theme files, the download becomes **Download ZIP**: the stylesheets plus an `images/` folder.
4. Unzip it into your project, or paste the copied CSS into a `.css` file.

## Theme files (USWDS Design Kit)

The plugin is built for the USWDS Design Kit. One variable collection with several modes is the theme collection: the one named `USWDS Theme` when the file has it, otherwise the first collection with "theme" in its name. The **Theme collection** menu on the result screen picks another one, or none; the choice is stored in the file (as plugin data), so it holds for everyone who runs the plugin there. With a theme collection the ZIP holds a split export in place of the single stylesheet:

- `tokens.css`: everything except that collection (primitives, the other collections and their modes, element defaults and text style classes).
- `themes/<mode>.css`, one per mode (`default.css`, `project-theme.css`, `project-theme-dark.css`): every variable of the collection with that mode's values, under `:root, [data-uswds-theme="<mode>"]`.

Load `tokens.css`, then one theme file. Each theme file is complete, so it does not need `default.css` beside it. Each also sets `:root`, so when several are loaded the last one is the page default; load more than one only to switch part of the page with `data-uswds-theme`. **Copy CSS** still copies the single all-in-one stylesheet. With no theme collection, every multi-mode collection stays in the stylesheet as attribute-scoped blocks.

## Token files (DTCG)

The ZIP always holds a `tokens/` folder: `manifest.json` and one [DTCG](https://www.designtokens.org/) file per variable collection, or one per mode for a collection with several modes (`<collection>/<mode>.tokens.json`). Styles are grouped the same way (`effect-styles.tokens.json`). The manifest records the Figma file, the export time and the plugin version, and lists every collection with its `data-*` attribute, modes and default mode.

Each file's top-level group is the collection slug, so a reference is unambiguous across collections (`{color.usa.color.red.50}`). Every token carries `$extensions.pttrn.css` (its custom property name, exactly as the stylesheet declares it) and `$extensions.pttrn.figma` (its name in Figma). Colors are `srgb` objects with a hex fallback, sizes are `dimension` objects, font names are `fontFamily`, and a Figma string that no DTCG type fits uses `string`, pttrn's extension of the type list. A value with no DTCG form (a gradient, an image fill, a `font` shorthand) stays in the stylesheet only; the header lists them.

To refresh `@ptrn/styles`, replace its `tokens/` folder with the one from the ZIP and run `npm run build --workspace @ptrn/styles`.

## What the CSS looks like

- Every variable becomes a custom property named by hyphenating its path (`primary/main` becomes `--primary-main`), with a comment above it holding the exact Figma name. On a name clash the later one is prefixed with its collection.
- Aliases stay aliases: `--button-bg: var(--primary-main);`.
- Each collection that has more than one mode, and whose values actually differ between them, gets its own attribute named after the collection: a collection named "Theme" is switched with `[data-theme="dark"]`, one named "Breakpoint" with `[data-breakpoint="md-672px"]`. The default mode is in `:root` and also under its own attribute value, so a subtree can switch back. Each block redeclares only that collection's changing variables plus anything that aliases them, so a nested attribute never keeps the outer value. Variables that are themed by a different collection are not redeclared in another collection's blocks, so set both attributes on the same element when two collections alias each other.
- Colors are `rgb(r g b)`, with `/ a%` added only when they are not fully opaque. FLOAT values get `px`, except those scoped only to font weight.
- Styles become custom properties too: paint styles as colors or gradients, effect styles as `box-shadow` and blur values, text styles as a `font` shorthand plus one property per field, and grid styles as count, gutter, margin, size and alignment values. Image fills become `url("images/<style-name>.<ext>")` backgrounds, and the ZIP holds those files (an image shared by several styles is included once).
- The same file ends with rules that use those tokens: a class for every text style (`.heading-xl { font: var(--heading-xl); … }`), and element defaults for `h1`–`h6`, `p`, `small` and `code`. Elements are chosen by name and size, not by a Figma setting: an explicit `H1`–`H6` in a name wins, otherwise headings are ranked by size, and `p`, `small` and `code` take the plain style closest to 16, 12 and 14px. The header lists which style became which element, so edit any that do not fit.

## Development

`src/code.ts` is the plugin's main thread and `src/ui.ts` runs in the panel. `npm run build` compiles both to the plugin root and inlines the compiled `ui.js` into `ui.html` from `src/ui.html`, because Figma cannot load a `<script src>` from a plugin panel. `code.js`, `ui.js` and `ui.html` in the root are generated.
