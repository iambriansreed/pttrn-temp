# Building UI with pttrn

Follow this when generating UI. Look components up with `search_components` and `get_component` instead of guessing, and run `validate_code` on the result.

## Setup

- Install `@ptrn/react`, `@ptrn/icons` and `@ptrn/styles`.
- Render `<UIProvider>` once at the root of the app. It holds theme, responsive state and aria live messages, and components read from it.
- Load the styles by rendering `<StylesProvider />` (from `@ptrn/react/StylesProvider`), or import `@ptrn/styles/tokens.css` and one theme from `@ptrn/styles/themes/` directly.

## Imports

- One component per path: `import { Button } from '@ptrn/react/Button';`. Never import from the package root.
- Icons are one per path and exported with an `Svg` prefix: `import { SvgPerson } from '@ptrn/icons/Person';`. Find them with `search_icons`, and never invent an icon name.

## Use components, not raw HTML

- Reach for a pttrn component before writing an element: `Button` not `<button>`, `Input` or `InputField` not `<input>`, `Txt` for text, `Link` not `<a>`, `Divider` not `<hr>`, `Table` not `<table>`.
- Prefer the `*Field` variant (`InputField`, `SelectField`) when a control needs a label, description or error message.
- Lay out with `Flex` and `Grid` rather than hand-written flexbox or grid CSS.
- Only pass props the component documents. Union props (`variant`, `size`) accept only their listed values.

## Tokens, not hardcoded values

- Colors, spacing, radii, shadows and type sizes come from the USWDS CSS variables: `var(--usa-spacing-2)`, not `16px`; a `--theme-color-*` variable, not `#fff`. Look them up with `get_tokens`.
- Theme tokens change with the USWDS theme (`data-uswds-theme`, including `project-theme-dark`), so using them keeps every theme working. A hardcoded color breaks it.
- Prefer a component prop over custom CSS. When custom CSS is unavoidable, use tokens in it.

## Accessibility

- Give icon-only buttons a `label` (with `iconOnly`) so they get an accessible name.
- Give form controls a visible label or an `aria-label`.
- Do not remove focus outlines.
