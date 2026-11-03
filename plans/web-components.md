# Web Components for pttrn: design (Accordion first)

Status: Accordion is built end to end (steps 0 to 6 below). Nothing is committed or published yet.

## Goal

Every component page gets a `React | Web Component` tab so a consumer can use pttrn without React. We build a Web Component version of Accordion end to end first, to learn the pipeline (package, build, docs, tests, publish), then turn what we learn into a repeatable rhythm for the rest of the components.

## Decisions

| Decision          | Choice                                                                       | Why                                                                                                                                                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Relation to React | Parallel implementations, hand-written, no React at runtime                  | Existing React components stay untouched. Behavior parity is enforced by shared tests, not shared code. Wrapping React (r2wc) would ship React to every Web Component user. Making React wrap the Web Component would rewrite working components and change their DOM for existing users. |
| Packaging         | New workspace `packages/web`, published as `@ptrn/web` | `@ptrn/react` has React peer dependencies and React-only dependencies (`focus-trap-react`), a React-only `exports` map, and a build that compiles JSX. Making React peers optional fixes the warning only. It does not fix version coupling or the mixed entry points.                    |
| Authoring         | Lit                                                                          | Reactive properties, templates, slots and events without maintaining our own render layer across 100+ components. The runtime dependency is Lit (about 5 KB), not React.                                                                                                                  |
| DOM               | Shadow DOM                                                                   | Consumer CSS cannot break components, native `<slot>` covers `leading`, `trailing` and content, and the design tokens are CSS custom properties, which inherit through the shadow boundary, so brand themes keep working.                                                                 |
| Tab label         | "Web Component" (two words, singular)                                        | Matches the spec and MDN wording. Each tab is one implementation, so singular.                                                                                                                                                                                                            |
| Code button label | "Edit code" / "Hide code"                                                    | The panel is a live editor, so "Expand code" undersells it.                                                                                                                                                                                                                               |
| Tag prefix        | `pttrn-`                                                                      | Matches the `data-pttrn` convention and the npm scope.                                                                                                                                                                                                                                    |
| Demo wiring       | Docs-only React wrapper around the Lit elements                              | Lets the existing prop controls, presets and error handling drive the Web Component preview. It is not shipped.                                                                                                                                                                           |
| Playground        | Edit real HTML, render it live                                               | What a non-React user pastes is what they edit. Preview is the HTML set as `innerHTML` into a container where the elements are registered.                                                                                                                                                |

## The tab and what it changes

A tab bar under the page title in `ComponentPage.tsx`: `React | Web Component`. The choice lives in the URL (`?framework=web-component`, so it is linkable) and in `localStorage`, so a Web Component user lands on Web Component on every page. A component with no Web Component version shows the tab greyed out with a "not yet available" tooltip, so the gap stays visible and the layout does not jump.

Changes with the tab:

- The code in Basic usage and in the edit area (and what the copy button copies).
- The live preview (the Lit element through the demo wrapper instead of the React component).

Does not change: the description, the props table and its controls, the presets, the stylesheet section.

## Packages: `@ptrn/react` and `@ptrn/web`

`@ptrn/ui` is renamed `@ptrn/react` (directory `packages/ui` to `packages/react`) because "ui" stops meaning anything once there is a second UI package. Nothing is published yet, so the rename has no consumers to break. It is about 483 references in 117 files, mostly the docs site, and ships as its own commit before any Web Component work. `@ptrn/icons` and `@ptrn/styles` stay as they are.

The new package:

- `packages/web`, covered by the root `packages/*` workspace glob. The docs site is the separate `docs/` workspace (`ptrn-docs`, private, never published).
- Source per component: `src/components/Accordion/` with `accordion.ts`, `accordion-item.ts`, a stylesheet, and `index.ts`.
- Output: one ESM entry per component (`@ptrn/web/Accordion`), plus one bundled file for CDN use with no build step (`<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web/...">`).
- Importing an entry registers the elements. Registration is guarded (`customElements.get`), so loading twice is safe.
- Styles come from the same `@ptrn/styles` tokens. Brand CSS is loaded by the page, not bundled into the elements.
- Added to the root `build` script and to the npm release/publish workflow with the other three packages.

## Accordion element API

```html
<pttrn-accordion multiple>
    <pttrn-accordion-item heading="Myron Floren" subtitle="The Happy Norwegian" open>
        <img slot="leading" src="..." alt="" />
        Content goes here.
        <span slot="trailing">Trailing</span>
    </pttrn-accordion-item>
</pttrn-accordion>
```

React to Web Component mapping:

| React                            | Web Component                                                   | Note                                                                                      |
| -------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `items[]`                        | child `<pttrn-accordion-item>` elements                          | The `items` array is a React idiom. The wrapper and the HTML code generator translate.    |
| `singleOpen` (default `true`)    | `multiple` (boolean attribute, default off)                     | Inverted. An HTML boolean attribute cannot default to true.                               |
| `item.title`                     | `heading` attribute                                             | `title` collides with the native `HTMLElement.title` tooltip.                             |
| `item.subtitle`                  | `subtitle` attribute                                            |                                                                                           |
| `item.leading` / `item.trailing` | `slot="leading"` / `slot="trailing"`                            |                                                                                           |
| `item.children`                  | default slot                                                    |                                                                                           |
| `item.isOpen`                    | `open` (attribute and property, reflected)                      | Ignored when `disabled`, as in React.                                                     |
| `item.disabled`                  | `disabled` (reflected)                                          |                                                                                           |
| `item.id`                        | `id` on the item                                                | Generated if missing.                                                                     |
| none                             | `pttrn-toggle` event (`bubbles`, `composed`, `detail: { open }`) | React has no change callback. Decide during the spike whether React gains one for parity. |

Structure: each item renders its header button and content panel inside its own shadow root, so `aria-controls` and `aria-labelledby` stay valid (IDs cannot be referenced across shadow roots). The parent listens for `pttrn-toggle` from its items and closes the others unless `multiple` is set. Keyboard behavior and disabled behavior match React.

## Gaps found so far

Each one gets a recorded decision during the Accordion work.

1. **Boolean default inversion** (`singleOpen` to `multiple`). Decide the naming convention once, because every default-true boolean in the library has the same problem.
2. **Reserved attribute names** (`title`, and likely `hidden`, `label`-like names on other components). Keep a list.
3. **`ReactNode` props become slots.** Every `leading`, `trailing`, `icon` and `children` prop across the library maps this way.
4. **Icons.** `@ptrn/icons` exports React components. The Web Component needs the raw `.svg` files, inlined at build time or through a small icon element.
5. **Shared styles.** The React SCSS uses `> [data-pttrn='accordion-item']` child selectors, which stop matching across per-item shadow roots. Recommendation: extract the item-internal rules into a shared SCSS partial used by both packages, plus a small `:host` layer for the Web Component. The spike confirms this is workable before we commit to it.
6. **Mounted content.** React renders the panel only while open. A slotted panel is always in the light DOM and hidden with CSS. Anything lazy or expensive in the content behaves differently.
7. **Meta pipeline.** Component metadata is generated from JSDoc (`@name`, `@phase`, `@example`) in `packages/react`. The Web Component needs an HTML `@example` and a `webComponent` entry (tag name, usage snippet, HTML generator) feeding the same meta.
8. **Playground evaluation.** `react-live` evaluates JSX. The Web Component tab needs an HTML playground with its own error display (unknown or unregistered elements).
9. **Form participation.** Later components (Input, Checkbox, Select) need `ElementInternals`. Not needed for Accordion, but the base class should not block it.
10. **Global reset.** `@ptrn/react` relies on a global base stylesheet (`box-sizing: border-box`, zeroed margins). Page-level resets do not reach a shadow root and a custom element host is not in `[data-pttrn]`, so each element carries its own reset. Found because the first Web Component demo measured 16 px wider than the React one.
11. **Cross-component content.** Accordion `leading` and `trailing` in the demo presets are other pttrn components (Avatar). The generated HTML for them is the React-rendered markup until Avatar has a Web Component. Presets that compose components need their own Web Component variant, or the generator needs a mapping.
12. **Where the Web Component docs data lives.** The usage HTML, the demo wrapper and the HTML generator live in `docs/src/wc/` and are registered by hand in `docs/src/wc/index.ts`, not generated from JSDoc like the React meta. Revisit once there are three or four components and the shape is clear.

## Docs site changes

- Tab bar and framework state in `ComponentPage.tsx` and `globalState.tsx`.
- `docs/src/wc/`: docs-only React wrapper for each Web Component (Accordion wrapper maps `items` to child elements and `singleOpen` to `multiple`).
- `componentToHtml(name, propState)`: HTML counterpart of `componentToString`, used by Basic usage, the presets, and the editor's initial content.
- `HtmlPlayground`: reuses the existing editor component with `language="html"`, renders the edited HTML as `innerHTML` into a preview container, shows unregistered-element errors.
- `CodePlayground` and `HtmlPlayground` both use the "Edit code" / "Hide code" labels.
- A hand-registered `webComponents` map (`docs/src/wc/index.ts`) decides which components get the tab. The usage HTML, wrapper and generator sit beside it.

## Tests

Two layers, run against both implementations for Accordion:

- Shared behavior cases: open and close, single vs multiple, disabled, `open` initial state, keyboard (Enter and Space on the header), ID relationships.
- axe-core in a real browser. Playwright is already in the repo, and shadow DOM support in jsdom is not reliable enough for accessibility checks.

The React tests (`Accordion.rtl.test.tsx`) stay as they are. The shared cases are written as a description both suites implement, so the two cannot drift silently.

## Pipeline exit criteria for Accordion

Done when all of these are true:

- [x] `npm run build` at the root builds `@ptrn/web`.
- [x] The package is in the release/publish workflow (`.github/workflows/publish.yml`, written and not yet run: it needs `NPM_TOKEN` and a release), and `npm pack` produces a correct tarball (entries, bundle, types, no stray files).
- [x] A bare HTML file loads the bundle from the packed tarball and renders a working accordion with no bundler and no React.
- [x] The Accordion docs page shows both tabs: preview, usage code, and the editable playground work on the Web Component tab.
- [x] Shared behavior tests and axe pass for both implementations (226 React tests, 16 Web Component tests).
- [x] A written gaps log with a decision for each item above. Items 1 to 3 and 9 are recorded as conventions in `packages/web/CONTRIBUTING.md`, 4 to 8 and 10 to 12 are resolved or logged where they occur.

## Rhythm for the remaining components

For each component:

1. API mapping table (React prop to attribute, slot or event), reviewed by design and UX engineering.
2. Element and styles.
3. Shared behavior tests plus axe.
4. HTML example, generator, and demo wrapper.
5. Meta `webComponent` entry, which enables the tab.
6. Accessibility pass on the docs page.

A `newwc` scaffold script (modeled on the existing `newc`) generates the file set. The Accordion retro decides which helpers move into a shared base class (attribute reflection, ID generation, event helper, style loading).

Suggested order after Accordion: simple stateless or leaf components first (Badge, Tag, Divider), then components with one piece of state (Switch, Checkbox), then composition-heavy ones (Menu, Popover, Dialog, Select).

## Build order for Accordion

Check each box when it is verified, not when it is written.

- [x] 0. Rename `@ptrn/ui` to `@ptrn/react` and the docs workspace to `docs/` (`ptrn-docs`). Verified: build, docs build, lint and 226 tests pass.
- [x] 1. Scaffold `packages/web`, build, and a stub element. Verified: `npm run build` at the root builds it (per-component ESM with `lit` external, a 22 KB self-contained CDN bundle, and type declarations), and `npm run lint` passes.
- [x] 2. `pttrn-accordion` and `pttrn-accordion-item` with styles. Shared-SCSS decision: the Web Component keeps its own SCSS (the two packages stay independent), and visual parity is checked side by side in the docs (step 4) instead of by a shared partial.
- [x] 3. Shared behavior tests and axe. Verified: 16 Playwright tests pass in Chromium against the built CDN bundle (behavior, keyboard, events, aria relationships, and axe for all three React presets).
- [x] 4. Docs: tab bar, framework state, wrapper, HTML generator, `HtmlPlayground`, and a side-by-side visual check of the React and Web Component Accordion. Verified in a browser against the built site: both tabs render, the tab lives in `?framework=`, the choice is remembered across pages, components without a Web Component show the tab disabled, "Edit code" opens an editable HTML editor, the demo has a Code tab with the generated HTML, and the React and Web Component demos measure the same (368 px wide, 48 px items). Docs lint (eslint and tsc) passes.
- [x] 5. `npm pack` and the bare-HTML consumer check. Verified with the real tarball extracted outside the workspace: `@ptrn/web` and `@ptrn/web/Accordion` resolve through the `exports` map and an esbuild consumer bundles them with the elements defined once and `lit` deduplicated, and a plain HTML file loading `dist/cdn/pttrn-web.min.js` renders and toggles the accordion. No console errors and no React requests in either. Code splitting was added to the build because `index.js` and `Accordion/index.js` each carried their own copy of the code.
- [x] 6. Retro: gaps log (above, 12 items), base helpers (`define`, `uniqueId`, `emit`, and the shared shadow reset in `src/styles/_reset.scss`), rhythm and conventions doc (`packages/web/CONTRIBUTING.md`), and the `npm run newc -- <Name>` scaffold. The scaffold was exercised with a throwaway component: it built, linted and passed its skeleton tests, then was removed.

## Out of scope for now

- Framework wrappers other than the docs-only React wrapper.
- Server-side rendering and declarative shadow DOM.
- A Web Component version of any component other than Accordion.
- Changes to the React components (except the optional `pttrn-toggle` parity decision).
- Screenshot note: a stray "Text" label overlaps the Accordion heading on the component page. Unrelated to this plan, worth a separate look.

## Open items

- Confirm `@ptrn/react` and `@ptrn/web` are free on npm (`@ptrn/ui` was, per `plan.md`).
- Whether the shared SCSS partial is worth it or the Web Component keeps its own copy with a diff check (decided in step 2 of the build order).

## Text inputs and form controls (Input, Textarea, Password, InputNumber, RadioGroup, RadioGroupField, SearchBar, OTPInput, InputPhone, Rating, Slider)

Conventions these elements share, decided while porting Input:

- **`FieldControl` base** (`packages/web/src/utils/field-control.ts`). A form-associated custom element (`static formAssociated`, `ElementInternals`): it submits `name` and its value with a `<form>`, mirrors the validity of its native control (so `required` blocks submission and `:invalid` and `checkValidity()` work), follows a disabled `<fieldset>`, goes back to its `value` attribute on form reset and restores on back navigation. `delegatesFocus` sends focus and label clicks to the native control. The manifest analyzes `src/utils` too, so the inherited attributes appear on every element's API table.
- **The Field is built in.** A `Field` or `<label for>` outside the element cannot name or describe the native control inside its shadow root (ids do not cross the boundary), so the text controls take the Field's props as attributes and render the label, helper text and error alert in their own shadow root: `label`, `helper-text`, `error-message`, `label-trailing`. The `*Field` React components (InputField, PasswordField, ...) need no separate element. `error-message` also sets the invalid state, which the React `InputField` misses (it puts `aria-invalid` on the container `div`).
- **`aria-label`** on the element names the native control and wins over `label`, as the React prop does. axe reports nothing for the attribute on the host, which has no role.
- **Events.** `pttrn-change` (`detail.value`) for every user-driven change, the counterpart of `onChange`, plus a plain `change` so code that listens the native way works. Neither fires when `value` is set from code.
- **`value`.** The attribute is the default value (what a form reset goes back to), the property is the current value, as on a native input.
- **Not ported.** `id`, `aria-describedby` and `aria-errormessage` (ids cannot cross the boundary: use `helper-text` and `error-message`), refs and `inputProps`, `owner`.
- **Private pieces.** The clear button and the other buttons inside a control are plain `<button>`s styled as the tertiary Button (`src/styles/_button.scss`), and the error alert is the InlineAlert markup (`src/styles/_field.scss`), because Button and InlineAlert belong to other elements. The icon-only clear button has no tooltip until a Tooltip element exists; its name is still "Clear".

### Input

| React                                                          | Web Component                                                              |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `value`, `onChange(value, event)`                              | `value`, `pttrn-change` (`detail.value`) and `change`                      |
| `name`, `placeholder`, `type`, `size`                          | `name`, `placeholder`, `type`, `size`                                      |
| `autoComplete`                                                 | `autocomplete`                                                             |
| `disabled`, `readOnly`, `required`, `invalid`                  | `disabled`, `readonly`, `required`, `invalid` (reflected)                  |
| `leading`, `trailing`                                          | `slot="leading"`, `slot="trailing"`                                        |
| `showClearButton` (default `true`)                             | `hide-clear-button` (inverted)                                             |
| `aria-label`                                                   | `aria-label`                                                               |
| Field `label`, `helperText`, `errorMessage`, `labelTrailing`   | `label`, `helper-text`, `error-message`, `label-trailing`                  |
| `id`, `aria-describedby`, `aria-errormessage`, refs, `inputProps`, `owner` | none                                                           |

### Textarea

| React                                                        | Web Component                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `value`, `onChange(value, event)`                            | `value`, `pttrn-change` (`detail.value`) and `change`                        |
| `name`, `placeholder`, `size`, `maxLength`                   | `name`, `placeholder`, `size`, `maxlength`                                   |
| `minRows`, `maxRows`                                         | `min-rows`, `max-rows`                                                       |
| `disabled`, `readOnly`, `required`, `invalid`, `aria-label`  | `disabled`, `readonly`, `required`, `invalid`, `aria-label`                  |
| Field `label`, `helperText`, `errorMessage`, `labelTrailing` | `label`, `helper-text`, `error-message`, `label-trailing`                    |
| `id`, `aria-describedby`, `aria-errormessage`, `innerRef`    | none                                                                         |

The React Textarea marks read-only with `data-read-only` while its stylesheet selects `data-readonly`, so its read-only style never applies. The element uses `data-readonly` and shows the read-only style, as Input does. The replica that sizes the field is rendered from `value`, so a value set from code sizes the field too (React updates it only on input).

### Password

Built on the same Input box as `pttrn-input` (`src/utils/input-base.ts`, shared with SearchBar and InputPhone too).

| React                                                        | Web Component                                               |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| `value`, `onChange(value, event)`                            | `value`, `pttrn-change` (`detail.value`) and `change`       |
| `name`, `size`                                               | `name`, `size`                                              |
| `disabled`, `readOnly`, `required`, `invalid`, `aria-label`  | `disabled`, `readonly`, `required`, `invalid`, `aria-label` |
| Field `label`, `helperText`, `errorMessage`, `labelTrailing` | `label`, `helper-text`, `error-message`, `label-trailing`   |
| `id`, `aria-describedby`, `aria-errormessage`, refs, `inputProps` | none                                                   |

The React Password passes an `onClick` that focuses the input to the Input container, so clicking Show moves focus from the toggle to the input; its spec says toggling keeps focus on the button, and the element does that. The React `password.scss` selects `[data-pttrn-owner='password'] [data-pttrn='input']` (a descendant) while the Input carries the owner on the same element, so none of its rules apply; the element matches what React renders (a medium tertiary button, the field's own padding).

### InputNumber

| React                                                        | Web Component                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `value` (number), `onChange(number \| undefined)`            | `value` (number, empty for none), `pttrn-change` (`detail.value`) and `change`        |
| `min`, `max`, `step`, `align`, `size`, `name`                | `min`, `max`, `step`, `align`, `size`, `name`                                         |
| `disabled`, `readOnly`, `required`, `invalid`, `aria-label`  | `disabled`, `readonly`, `required`, `invalid`, `aria-label`                           |
| Field `label`, `helperText`, `errorMessage`, `labelTrailing` | `label`, `helper-text`, `error-message`, `label-trailing`                             |
| `id`, `aria-describedby`, `aria-errormessage`                | none                                                                                  |

The field is "Input number" only when it has neither `aria-label` nor `label`: the React default `aria-label` also overrides a Field label, so the React InputNumberField's visible label never names its input. A button activated without a pointer press (a screen reader's click, `element.click()`) steps once; the React buttons answer only to pointer presses.

### RadioGroup

| React                                                         | Web Component                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `options[]` (`value`, `label`, `description`, `disabled`)     | `pttrn-radio-group-item` children with the same attributes               |
| `value`, `onChange(value)`                                    | `value`, `pttrn-change` (`detail.value`) and `change`                    |
| `name`, `disabled`, `required`, `invalid`, `aria-label`       | `name`, `disabled`, `required`, `invalid`, `aria-label`                  |
| `id`, `aria-describedby`, `aria-errormessage`                 | none (`helper-text` and `error-message` describe the group)              |

The items render nothing; the group draws every option as React's RadioOption (a ListItem label holding a Radio) in its own shadow root, because native radios form a keyboard group (Tab to the chosen one, arrows to move) only inside one tree. A group without `name` gives its radios a generated one so the keyboard still works. The truncated option label has no tooltip until a Tooltip element exists.

### RadioGroupField

No element of its own: `pttrn-radio-group` with a `label` renders the React Fieldset (a fieldset named by its legend, " (Required)" and `label-trailing` in the legend, then `helper-text` or the `error-message` alert), and an error marks the radiogroup `aria-invalid` with `aria-errormessage`, as the text controls do with their Field. `tests/radio-group-field.spec.ts` holds it to the RadioGroupField spec, and the docs page's Web Component tab uses `pttrn-radio-group`. With the field the element takes the full width, as the React Field does (`:state(field)`, a custom state set by FieldControl).

The React demo of RadioGroupField gives every example on the page the same radio `name`, so the variants below the demo uncheck the demo's radio (RadioGroupExample makes the name unique; RadioGroupFieldExample does not). The element's radios are scoped to its shadow root and keep their choice.

### SearchBar

| React                                                    | Web Component                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `items[]` (`label`, `leading`, `trailing`)               | `pttrn-search-bar-item` children with `label`                                   |
| `value`, `onChange(value, item)`                         | `value`, `pttrn-change` (`detail.value`, and `detail.item` when one is chosen)  |
| `placeholder` (default "Search"), `size`, `name`         | `placeholder`, `size`, `name`                                                   |
| `noResultsMessage`, `scrollLimit`                        | `no-results-message`, `scroll-limit`                                            |
| `trailing`                                               | `slot="trailing"`                                                               |
| `disabled`, `aria-label`                                 | `disabled`, `aria-label` (and the Field attributes, as the other controls)      |
| `id`, `inputRef`                                         | none                                                                            |

The results list is drawn in the element's shadow root (so `aria-controls` and `aria-activedescendant` reach it) as the Menu and ListItem markup (`src/styles/_menu.scss`, shared with InputPhone). It is a manual popover in the top layer, placed with CSS anchor positioning under the field at its width and flipped above it when there is no room, where React uses floating-ui; it fades in as React's does. The "No results found" announcement is an assertive live region inside the element. Not ported yet: an item's `leading` and `trailing` content.

### OTPInput

| React                                                        | Web Component                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `defaultValue`, `onChange(code)` (once complete)             | `value` (the default), `pttrn-change` (`detail.value`) once complete         |
| `length`, `alphanumeric`, `secure`, `size`, `name`           | `length`, `alphanumeric`, `secure`, `size`, `name`                           |
| `disabled`, `readOnly`, `required`, `invalid`, `aria-label`  | `disabled`, `readonly`, `required`, `invalid`, `aria-label`                  |
| OTPInputField `label`, `helperText`, `errorMessage`          | `label`, `helper-text`, `error-message`, `label-trailing`                    |
| `id`, `aria-describedby`, `aria-errormessage`                | none                                                                         |

The form gets the whole code under `name` (the React cells post one character each, as `name`, `name-1`, ...), and `required` blocks submission until every cell is filled. With a `label` and no `aria-label` the group and the cells are named from the label ("Verification code digit 1"); the React default `aria-label` "OTP input" overrides an OTPInputField label. The tag is `pttrn-otp-input`: the scaffold, the spec lint and the docs now keep an acronym as one word (OTPInput is `otp-input`, as the docs slug).

### InputPhone

| React                                                        | Web Component                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `value`, `onChange(value, countryCode)`                      | `value`, `pttrn-change` (`detail.value`, `detail.countryCode`) and `change`            |
| `initialCountryCode`                                         | `country-code` (the attribute is the initial country; the property is the current one) |
| `disableFormatting`, `scrollLimit` (default 5), `size`       | `disable-formatting`, `scroll-limit`, `size`                                           |
| `renderFlag(countryCode)`                                    | the `renderFlag` JavaScript property (returns a string, a node or a Lit template)      |
| `disabled`, `readOnly`, `required`, `invalid`, `aria-label`  | `disabled`, `readonly`, `required`, `invalid`, `aria-label`                            |
| InputPhoneField `label`, `helperText`, `errorMessage`        | `label`, `helper-text`, `error-message`, `label-trailing`                              |
| `id`, `aria-describedby`, `aria-errormessage`, `inputRef`    | none                                                                                   |

The country list reuses the SearchBar's `_menu.scss` popover, anchored to the field; it exists only while open, when `aria-controls` and `aria-owns` name it. Its options are not tab stops (focus stays on the country button and the active option is `aria-activedescendant`), where the React ListItems without a `tabIndex` become tab stops. The list also closes when focus leaves the element by Tab, not only on an outside click. The form gets the number under `name` and the country under `<name>-country-code`. `libphonenumber-js` becomes a dependency of `@ptrn/web` for the formatting, as it is of `@ptrn/react`; it adds about 140 KB (minified) to the all-in-one CDN bundle, while the per-component entries keep it in the InputPhone chunk. The country names are a copy of `@ptrn/react/utils/countryCodes` (`src/utils/country-codes.ts`): keep the two in step.

### Rating

| React                                   | Web Component                                                           |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `value`, `size`                         | `value`, `size`                                                         |
| `onChange(value)` (makes it interactive) | `interactive`, and `pttrn-change` (`detail.value`) when a star is chosen |
| none                                    | `name`: an interactive rating submits the chosen number with its form  |

A function prop cannot be an attribute, so `interactive` turns the image into the radio group of stars. The element follows `value` when it changes; the React Rating keeps the value it mounted with (`useControlledState` reads its initial value only), so its docs demo shows the previous stars after a preset switch.

### Slider

| React                                               | Web Component                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| `label`, `min`, `max`, `step`, `marks`, `name`      | `label`, `min`, `max`, `step`, `marks`, `name`                             |
| `value` (number or `[start, end]`)                  | `value` (`"30"` or `"70,80"` as an attribute, a number or array as a property) |
| `onChange(value)`                                   | `pttrn-change` (`detail.value`)                                            |
| `formatNumber(value, context)`                      | the `formatNumber` JavaScript property                                     |
| `disabled`, `readOnly`                              | `disabled`, `readonly`                                                     |
| hidden input with `name`                            | the form value (ElementInternals): the value, or "start,end"               |

Where React and the spec differ, the element follows the spec: the range knobs' `aria-valuetext` is formatted with `formatNumber` too ("formatNumber formats the values that are read and shown"; React reads them raw). The marks are placed from `min` and are white inside the filled part for a range as well (React's dots count from 0 and, for a range, whiten those below the start). A press on the track moves the nearest knob and keeps dragging it, with pointer events, so touch works too.
