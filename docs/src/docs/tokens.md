# Design tokens

Every color, size, radius, shadow and type setting in pttrn is a design token: a named value that lives in Figma, in
the token files, and in CSS under the same name. Components never carry a hardcoded value where a token exists, and
the build fails on a custom property that is not one.

## Where tokens come from

Designers own the tokens as variables in the **USWDS Design Kit** in Figma. The pttrn Figma plugin exports them as
[DTCG](https://www.designtokens.org/) token files, and `@ptrn/styles` builds the stylesheets and a typed catalog
from those files:

```
Figma variables  →  pttrn Export Tokens  →  tokens/*.tokens.json  →  tokens.css, themes/*.css, tokens.js
```

Every token keeps its Figma name as a comment in the CSS and as `$extensions.pttrn.figma` in the token files, so a
designer and an engineer searching for the same string land on the same thing.

The primitives are meant to match the USWDS code. `npm run tokens:check-uswds` in `@ptrn/styles` compares them with
the `@uswds/uswds` release recorded in `tokens/uswds.json`, and a weekly workflow repeats the check, so a drift between
the Design Kit and USWDS Core is caught and reviewed rather than discovered in a component.

## Three tiers

| Tier          | Prefix          | Example                                     | Who changes it                               |
| ------------- | --------------- | ------------------------------------------- | -------------------------------------------- |
| **Primitive** | `--usa-*`       | `--usa-color-red-50`, `--usa-spacing-2`     | USWDS. The raw palette and scales.           |
| **Theme**     | `--theme-*`     | `--theme-color-ink`, `--theme-font-size-ui` | The theme. Semantic choices from primitives. |
| **Component** | `--component-*` | `--component-button-padding`                | The component spec in Figma.                 |

Components reach for the highest tier that expresses the intent. A button's background is a theme or component token,
never `--usa-color-blue-60v` directly, because the theme is what changes between `default`, `project-theme` and
`project-theme-dark`.

## Modes

A collection with several modes is switched with its own `data-*` attribute on `<html>` or any element below it:
`data-uswds-theme` picks the theme, `data-font-type-*` and `data-font-role-*` pick the type families. The header of
`tokens.css` lists every attribute and its values. A token that aliases a themed token changes with it, so most
components never need to know which mode is active.

## Rules for component styles

- **Spacing** (padding, margin, gap, offsets, border and outline widths, radii) uses the spacing scale:
  `var(--usa-spacing-1)` is 8px, `--usa-spacing-05` is 4px, `--usa-spacing-1px` and `--usa-spacing-2px` exist for
  hairlines. A value that is not on the scale is a design question, not a magic number.
- **Color** uses theme or component tokens. No hex, no `rgb()`, no primitive unless the design names one.
- **Type** uses the `--usa-font-*` and `--theme-font-*` tokens for family, size and weight.
- **Icon and control sizes** are the exception today: `20px`, `24px` and `28px` boxes are literal until the size
  scale is a token in Figma.
- A component may declare its own custom properties for internal wiring (`--flag-size`), set from a prop, as long as
  they resolve to tokens or to values the component owns.

`npm run check:css-vars` in `@ptrn/react` and `@ptrn/web` verifies every `var(--…)` against the token catalog.

## Naming

Token names are paths, lowercase, hyphenated: `tier / object / property / variant`. `--component-accordion-button-
background-color` reads as the accordion's button's background color. Keep the object before the property
(`button-padding`, not `padding-button`), name the intent over the value (`ink`, not `gray-90`), and never encode a
value in a name that may change (`large`, not `24`).

## Changing a token

1. Change the variable in the Figma file.
2. Export with **pttrn Export Tokens** and replace `packages/styles/tokens/` with the ZIP's `tokens/` folder.
3. Run `npm run build --workspace @ptrn/styles`. The stylesheets and the catalog regenerate; CI fails if they do
   not match the token files.
4. If a token was renamed, the CSS variable check tells you every component that used the old name.

## Use the catalog in code

```ts
import { tokens } from '@ptrn/styles/tokens';

tokens['--theme-color-ink'].figma; // '#-theme/color/ink'
tokens['--theme-color-ink'].modes; // values in the other themes
```
