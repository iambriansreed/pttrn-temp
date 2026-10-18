# @ptrn/web

pttrn as Web Components: framework-free custom elements built with [Lit](https://lit.dev). No React needed.

Components so far: `ptrn-accordion`, `ptrn-accordion-item`.

## Use it from a CDN

No build step. Load the `@ptrn/styles` tokens and a theme so the elements pick up the design tokens, then the elements.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ptrn/styles/tokens.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ptrn/styles/themes/default.css" />
<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web/dist/cdn/ptrn-web.min.js"></script>

<ptrn-accordion>
    <ptrn-accordion-item heading="Lawrence Welk" subtitle="The Champagne Music Maker">
        Lawrence Welk was an American accordionist and bandleader.
    </ptrn-accordion-item>
    <ptrn-accordion-item heading="Myron Floren" subtitle="The Happy Norwegian">
        Myron Floren was an American accordionist.
    </ptrn-accordion-item>
</ptrn-accordion>
```

## Use it from npm

```sh
npm install @ptrn/web
```

```js
import '@ptrn/web/Accordion'; // registers ptrn-accordion and ptrn-accordion-item
```

Importing a component registers its elements, and loading a module twice is safe. Import from `@ptrn/web` to register everything. Bundlers get one ES module per component with `lit` left external so it is deduplicated.

## Accordion

| Element               | Attribute or slot | Notes                                                                        |
| --------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `ptrn-accordion`      | `multiple`        | Lets several panels stay open. By default opening a panel closes the others. |
| `ptrn-accordion-item` | `heading`         | The title. Named `heading` because `title` is the native tooltip attribute.  |
|                       | `subtitle`        | A second line under the heading.                                             |
|                       | `open`            | Whether the panel is open. Ignored while `disabled`.                         |
|                       | `disabled`        | Prevents toggling.                                                           |
|                       | default slot      | The panel content.                                                           |
|                       | `slot="leading"`  | Shown before the heading.                                                    |
|                       | `slot="trailing"` | Shown after the heading, before the arrow.                                   |

The `ptrn-toggle` event fires on an item after the user opens or closes it. It bubbles and is composed, and `event.detail.open` is the new state.

## License

CC-BY-4.0. See the repository for attribution.
