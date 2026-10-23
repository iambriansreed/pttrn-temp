import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'CheckboxGroupField',
    summary: 'A checkbox group with a visible label and helper text or an error message, as one fieldset.',
    anatomy: [
        { part: 'fieldset', role: 'group', description: 'A fieldset named by its legend.' },
        {
            part: 'legend',
            description: 'The label, then " (Required)" when required, then labelTrailing, which is aria-hidden.',
        },
        { part: 'group', role: 'group', description: 'The CheckboxGroup with its options.' },
        { part: 'helper text', description: 'A paragraph that describes the group, shown when there is no error.' },
        { part: 'error', role: 'alert', description: 'An error alert in place of the helper text.' },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves through the checkboxes.' },
        { keys: ['Space'], description: 'Toggles the focused checkbox.' },
    ],
    accessibility: {
        roles: 'A fieldset (role group) named by its legend, holding the CheckboxGroup (role group) of native checkbox inputs.',
        labels: 'The legend names the fieldset, " (Required)" included. helperText describes the CheckboxGroup through aria-describedby. errorMessage replaces it with an alert and marks every checkbox aria-invalid with aria-errormessage pointing at the alert.',
        focus: 'Native: every checkbox is its own tab stop.',
        targetSize: 24,
    },
    behaviors: [
        { id: 'legend-names-group', description: 'The fieldset is a group named by the label.' },
        { id: 'helper-text', description: 'helperText renders and describes the CheckboxGroup.' },
        {
            id: 'error-message',
            description:
                'errorMessage replaces the helper text with an alert, and every checkbox is aria-invalid with aria-errormessage pointing at it.',
        },
        { id: 'required', description: 'required adds " (Required)" to the label and marks each checkbox required.' },
        {
            id: 'label-trailing',
            description: 'labelTrailing shows after the label and is hidden from assistive technology.',
        },
        { id: 'chooses', description: 'Checking a box calls onChange with the new list of values.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core, with an error too.' },
    ],
};
