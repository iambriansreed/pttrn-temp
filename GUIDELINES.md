# Developer guidelines

## TypeScript

- Prefer `type` over `interface` for object shapes. `type` also covers primitives, unions, intersections and tuples, so one keyword does every job.

```typescript
export type CheckboxOptionProps = Pick<
    CheckboxProps,
    'checked' | 'disabled' | 'indeterminate' | 'name' | 'onChange' | 'readOnly' | 'value'
> &
    Pick<ToggleOptionProps, 'description' | 'label'>;
```

- Use `unknown` instead of `any` when the type is not known.
- Use `Object.freeze` for values that must not be reassigned.
- Use `as const` instead of `enum` for related constants.
- Name event handlers `handleClick`, not `onClick`. `onClick` is the prop; `handleClick` is the function. See [Responding to events](https://react.dev/learn/responding-to-events#adding-event-handlers).
- Use `-/hooks/useId` instead of React's `useId`. The library version accepts a default, which is what lets a consumer pass an `id` and still get a generated one when they don't.

## Components

- Every component has JSDoc: a description, `@name`, `@phase`, and an `@example` the docs can render.
- Write `function Component() {}` rather than `const Component = () => {}`.
- Where a component maps onto an HTML element, keep the HTML API: `checked`, `disabled`, `indeterminate`, `invalid`, `name`, `value`. Developers already know it and it is already documented.
- A prop that both turns something on and configures it is an object, not a boolean plus a sibling (`callToAction={{ label, onClick }}`, not `hasCallToAction`).
- `variant`, not `type`, for the visual variant. `type` is a reserved word and collides with the HTML attribute.
- Components take an `owner` prop that renders as a data attribute, so a parent can target its own children without a global selector.

## Styles

- Tokens only. Colors, spacing, radii, shadows and type come from the `@ptrn/styles` custom properties; the build fails on a variable that does not exist.
- No `className` prop and no external restyling. Scoped overrides go through the `style` prop as custom properties.
- Z-index scale:

| Layer             | z-index |
| ----------------- | ------- |
| Tooltip / Popover | 1100    |
| Dialog            | 1000    |
| Dropdown          | 900     |
| Fab               | 800     |
| Navbar            | 700     |
| Footer            | 600     |
