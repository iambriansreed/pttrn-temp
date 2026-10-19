# Adding a Web Component

`@ptrn/web` is a parallel implementation of `@ptrn/react`: hand-written Lit elements with no React at runtime. The React component is the reference for behavior, accessibility and appearance. The two share no code, so parity is held by the component's spec (`spec.ts` next to the React component: anatomy, keyboard model, accessibility requirements and the behaviors both suites register one test for), by the visual regression baselines in the docs, and by a side-by-side check in the docs.

## The rhythm

Copy this list into the pull request and check each box as it is verified.

1. **Read the spec, or write it.** The React component's `spec.ts` is the contract: its behaviors are the tests you will write. If the React component has none yet, write it there first (and register its behaviors in the React suite); the scaffold refuses to run without one.
2. **Map the API.** Write a table of React prop to attribute, slot or event (the Accordion table in `plans/web-components.md` is the model). Get design and UX engineering to review it before writing the element.
3. **Scaffold.** `npm run newc -- <Name>` (the React component name, for example `TabGroup`).
4. **Build the element and its styles.** Copy the rules from the React SCSS. Start the stylesheet with `@use '../../styles/reset';`.
5. **Write the tests.** `describeBehaviors(spec, …)` in `tests/<name>.spec.ts` with one test per behavior id, mirroring the presets in the React component's example file, plus element-specific cases (events, reflected attributes) and an axe run scoped to the element. `npm run build && npm test`. `npm run lint:specs` in `@ptrn/react` checks that the suite exists and uses the spec.
6. **Register it in the docs.** Add `docs/src/wc/<name>.tsx` (usage HTML, the demo wrapper that turns the React demo state into the element, and the HTML generator), one line in `docs/src/wc/index.ts` and the name in `docs/src/wc/names.ts`. The Web Component tab stays disabled until this exists.
7. **Look at it.** Build the docs and compare the React and Web Component tabs at the same preset: same width, same heights, same states. Then `npm run test:visual:update` in the docs (on Linux) adds the Web Component tab to the visual baselines; commit the new screenshots.
8. **Ship it.** `npm run lint`, `npm run build` at the root, then update the component list in `README.md`.

## Conventions

- **Tag and class.** `ptrn-<kebab-name>`, class `Ptrn<Name>`, registered with `define()` so loading twice is safe.
- **Properties.** Declare them in `static properties` and initialize them in the constructor (no class fields: `useDefineForClassFields` is off so Lit's accessors are not shadowed). Reflect state that CSS or consumers select on (`open`, `disabled`).
- **Booleans.** An HTML boolean attribute is present or absent, so it cannot default to true. When the React prop defaults to true, name the Web Component attribute for the opposite (`singleOpen` is `multiple`).
- **Reserved names.** Do not reuse a global HTML attribute for a different meaning. `title` is the native tooltip, so the accordion uses `heading`. Check `hidden`, `label`, `type`, `role`, `slot` and `id` before naming one.
- **`ReactNode` props are slots.** `children` is the default slot, and `leading`, `trailing`, `icon` and similar are named slots. Track empty slots with `slotchange` when the wrapper should disappear.
- **Arrays of objects become child elements.** `items=[{...}]` becomes repeated `ptrn-<name>-item` children.
- **Events.** `emit(this, 'ptrn-<name>', detail)` from `src/utils/emit.ts` (bubbles and composed). Fire only for user-driven changes, not when a property is set from code.
- **Accessibility.** Keep the button and the panel it controls in the same shadow root, because `aria-controls` and `aria-labelledby` cannot cross a shadow boundary.
- **Icons.** Import the raw file from `@ptrn/icons` (`import arrow from '@ptrn/icons/KeyboardArrowDown.svg'`) and render it with `unsafeSVG`. The build inlines it.
- **Styles.** Tokens are CSS custom properties, so they inherit into the shadow root. Never hard-code a value the React SCSS reads from a token.
- **Form controls (later).** Use `ElementInternals` for form participation. Nothing in the base helpers should get in the way of `static formAssociated`.

## Known gaps

The full log, with the reasoning, is in `plans/web-components.md`. The ones that will come up again: components whose demo presets contain other pttrn components (their generated HTML is React markup until those components exist here), and the docs data for each component being registered by hand.
