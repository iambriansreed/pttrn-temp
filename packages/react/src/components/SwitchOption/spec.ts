import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'SwitchOption',
    summary: 'A switch with its label and an optional description, laid out as a list item.',
    anatomy: [
        {
            part: 'option',
            description: 'A label element wrapping the control and its text, so the whole row toggles it.',
        },
        { part: 'switch', role: 'switch', description: 'The Switch control.' },
        { part: 'label and description', description: 'The visible text; the description sits under the label.' },
    ],
    keyboard: [{ keys: ['Space'], description: 'Toggles the switch.' }],
    accessibility: {
        roles: 'A switch inside a label.',
        labels: 'The switch is named by the label, and by the label and description together when there is one.',
        focus: 'Native focus on the switch.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders', description: 'The label and description are visible and name the switch.' },
        { id: 'toggle', description: 'Clicking the row or pressing Space calls onChange with the next state.' },
        { id: 'disabled', description: 'Disabled, the switch is disabled and the row is marked.' },
        { id: 'axe-clean', description: 'A checked option passes axe-core.' },
    ],
};
