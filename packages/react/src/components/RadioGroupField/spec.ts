import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'RadioGroupField',
    summary: 'A radio group with a visible label and helper text or an error message, as one fieldset.',
    anatomy: [
        { part: 'fieldset', role: 'group', description: 'A fieldset named by its legend.' },
        {
            part: 'legend',
            description: 'The label, then " (Required)" when required, then labelTrailing, which is aria-hidden.',
        },
        { part: 'group', role: 'radiogroup', description: 'The RadioGroup with its options.' },
        { part: 'helper text', description: 'A paragraph that describes the group, shown when there is no error.' },
        { part: 'error', role: 'alert', description: 'An error alert in place of the helper text.' },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves into the group, to the checked radio or the first one.' },
        { keys: ['ArrowDown', 'ArrowUp'], description: 'Move the choice between radios.' },
    ],
    accessibility: {
        roles: 'A fieldset (role group) named by its legend, holding the RadioGroup (role radiogroup) of native radio inputs.',
        labels: 'The legend names the fieldset, " (Required)" included. helperText describes the RadioGroup through aria-describedby. errorMessage replaces it with an alert and marks the radio group aria-invalid with aria-errormessage pointing at the alert (ARIA allows aria-invalid on the group, not on a radio).',
        focus: 'Native: the radios share one tab stop, as native radios with one name do.',
        targetSize: 24,
    },
    behaviors: [
        { id: 'legend-names-group', description: 'The fieldset is a group named by the label.' },
        { id: 'helper-text', description: 'helperText renders and describes the RadioGroup.' },
        {
            id: 'error-message',
            description:
                'errorMessage replaces the helper text with an alert, and the radio group is aria-invalid with aria-errormessage pointing at it.',
        },
        { id: 'required', description: 'required adds " (Required)" to the label.' },
        {
            id: 'label-trailing',
            description: 'labelTrailing shows after the label and is hidden from assistive technology.',
        },
        { id: 'chooses', description: 'Choosing a radio calls onChange with its value.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core, with an error too.' },
    ],
};
