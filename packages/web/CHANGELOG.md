# @ptrn/web

## 0.1.0

### Minor Changes

- b8bd7f7: `pttrn-banner-alert`: the BannerAlert as a Web Component. `closable` shows a Close button that fires `pttrn-close`, and `action-label` a call-to-action button that fires `pttrn-action`.
- b8bd7f7: `pttrn-button`: the Button as a Web Component. Label (attribute or slotted text), `icon` slot and `icon-only`, the three variants, four sizes, `destructive`, `width="fill"`, a tooltip that names an icon-only button, `href` for a link with role button, and `type="submit"` or `"reset"` acting on its form.
- b8bd7f7: `pttrn-card`: the Card as a Web Component; the element is the card surface, `elevated` or `outlined`.
- 032eef5: `pttrn-checkbox-group` and `pttrn-checkbox-group-item`: the CheckboxGroup as a form-associated Web Component. Each option is a `pttrn-checkbox-group-item` child; the group submits every checked value under its `name`, `select-all` adds the "All" checkbox (mixed while some options are checked), `required` blocks submission until an option is checked, and `label` with `helper-text` or `error-message` renders the CheckboxGroupField fieldset.
- b8bd7f7: `pttrn-checkbox-option`: a `pttrn-checkbox` with its `label` and `description` on a row that toggles it, with the same form participation and events.
- b8bd7f7: `pttrn-checkbox`: the Checkbox as a form-associated Web Component, with `indeterminate`, `invalid` and `required` (which blocks submission while unchecked). It submits `value` under `name` while checked, resets with its form, is named by aria-label or a `<label>`, and fires `pttrn-change` and `change`.
- b8bd7f7: `pttrn-chip-group`: a row of `pttrn-chip` children that wraps, or scrolls sideways with `overflow="scroll"`.
- b8bd7f7: `pttrn-chip`: the Chip as a Web Component, with `leading-icon` and `trailing-icon` slots, a count badge (`badge-count`, `badge-size`, `badge-surface-border`), `flat`, `disabled`, and `selected` or `toggle` for a chip that carries aria-pressed.
- b8bd7f7: `pttrn-empty-state`: the EmptyState as a Web Component, with the illustration in the default slot and an optional call-to-action button (`action-label`, `action-size`) that fires `pttrn-action`.
- b8bd7f7: `pttrn-fab`: the floating action button as a Web Component, placed in a corner of its positioned container or of the page (`container="page"`), with an `icon` slot, `icon-only` (round), sizes, variants, a tooltip and `href`.
- b8bd7f7: `pttrn-inline-alert`: the InlineAlert as a Web Component, a role alert message (`label` or the slotted text) with the variant icon. Give it an `id` for a field to reference.
- d0be14d: `pttrn-input-number`: the InputNumber as a form-associated Web Component, with stepper buttons that repeat while held and the Field label, helper text and error message built in.
- 06e207d: `pttrn-input-phone`: the InputPhone as a form-associated Web Component: a country button with the calling code and a keyboard-operable country list, a digits-only field formatted for the country as it is typed, and the number and country submitted with the form. Adds `libphonenumber-js` as a dependency.
- 6a6e2f0: `pttrn-input`: the Input as a form-associated Web Component. It submits its `name` and `value` with a form, takes part in validation and form reset, and renders the Field label, helper text and error message from its `label`, `helper-text` and `error-message` attributes.
- f771e5d: `pttrn-otp-input`: the OTPInput as a form-associated Web Component: one cell per character, typing and Backspace move between cells, a paste fills them keeping only accepted characters, and the whole code is submitted with the form.
- c79e1bc: `pttrn-password`: the Password field as a form-associated Web Component, with the Show/Hide toggle and the Field label, helper text and error message built in.
- 4ec529a: `pttrn-radio-group` and `pttrn-radio-group-item`: the RadioGroup as a form-associated Web Component, with native radio keyboard behavior, and with the RadioGroupField fieldset, legend, helper text and error message when given a `label`.
- e815bb9: `pttrn-rating`: the Rating as a Web Component: a read-only image of five stars with half stars, or, with `interactive`, a radio group of stars driven by click and the arrow keys that submits the chosen number with a form.
- 32b901e: `pttrn-search-bar` and `pttrn-search-bar-item`: the SearchBar as a Web Component, a combobox that filters its items as the user types, with the keyboard model, the "No results found" row and its announcement.
- 73c9506: `pttrn-slider`: the Slider as a form-associated Web Component, a single value or a range (`value="70,80"`), with keyboard and pointer input, optional marks, and a `formatNumber` property for the numbers shown and read.
- b8bd7f7: `pttrn-switch-option`: a `pttrn-switch` with its `label` and `description` on a row that toggles it, with the same form participation and events.
- b8bd7f7: `pttrn-switch`: the Switch as a form-associated Web Component. It submits `value` under `name` while on, resets with its form, follows a disabled fieldset, is named by aria-label or a `<label>`, and fires `pttrn-change` and `change`.
- 03ab517: `pttrn-textarea`: the Textarea as a form-associated Web Component that grows with its text between `min-rows` and `max-rows`, with the Field label, helper text and error message built in.
- 3e8a31d: `pttrn-radio-group` with a `label` is the RadioGroupField: a fieldset named by its legend, with helper text or an error message, at the full width of its container.
