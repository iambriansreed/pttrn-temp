import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Checkbox',
    summary:
        'A control for choosing one or more items, or an on/off setting; the bare control, to be labelled by its consumer or by CheckboxOption.',
    anatomy: [
        {
            part: 'input',
            role: 'checkbox',
            description: 'A native checkbox: the state, the label and the keyboard live here.',
        },
        { part: 'box', description: 'The drawn box with the check or the indeterminate bar, decorative.' },
    ],
    keyboard: [{ keys: ['Space'], description: 'Toggles the checkbox.' }],
    accessibility: {
        roles: "A native checkbox. Indeterminate sets the input's indeterminate state, which assistive technology reports as mixed. Invalid sets aria-invalid.",
        labels: 'The consumer labels it: aria-label on the control, or a wrapping label as CheckboxOption does.',
        focus: 'Native focus on the input. A disabled checkbox is disabled and leaves the tab order.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'reflects-checked', description: 'The checked prop is the checked state.' },
        { id: 'toggle-on-click', description: 'Clicking calls onChange with the next state and the event.' },
        {
            id: 'indeterminate',
            description: "indeterminate sets the input's indeterminate state and draws the bar instead of the check.",
        },
        { id: 'disabled', description: 'A disabled checkbox is disabled and does not call onChange.' },
        { id: 'invalid-required', description: 'invalid sets aria-invalid and required sets required on the input.' },
        { id: 'labelled', description: 'aria-label names the checkbox and name and value reach the input.' },
        { id: 'axe-clean', description: 'A labelled checkbox passes axe-core.' },
    ],
};
