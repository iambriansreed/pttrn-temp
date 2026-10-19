import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'CheckboxOption',
    summary: 'A checkbox with its label and an optional description, laid out as a list item.',
    anatomy: [
        {
            part: 'option',
            description: 'A label element wrapping the control and its text, so the whole row toggles it.',
        },
        { part: 'checkbox', role: 'checkbox', description: 'The Checkbox control.' },
        { part: 'label and description', description: 'The visible text; the description sits under the label.' },
    ],
    keyboard: [{ keys: ['Space'], description: 'Toggles the checkbox.' }],
    accessibility: {
        roles: 'A native checkbox inside a label.',
        labels: 'The checkbox is named by the label, and by the label and description together when there is one.',
        focus: 'Native focus on the checkbox.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders', description: 'The label and description are visible and name the checkbox.' },
        { id: 'toggle', description: 'Clicking the row or pressing Space calls onChange with the next state.' },
        { id: 'disabled', description: 'Disabled, the checkbox is disabled and the row is marked.' },
        { id: 'axe-clean', description: 'A checked option with a description passes axe-core.' },
    ],
};
