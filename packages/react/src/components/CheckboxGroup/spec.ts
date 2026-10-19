import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'CheckboxGroup',
    summary: 'A set of checkbox options, any number of which can be chosen, with an optional "All" checkbox.',
    anatomy: [
        { part: 'group', role: 'group', description: 'The container, named by the consumer.' },
        {
            part: 'select all',
            role: 'checkbox',
            description: 'Optional, first: checked when every enabled option is, mixed when some are.',
        },
        { part: 'option', description: 'A CheckboxOption: the checkbox, its label and an optional description.' },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves through the checkboxes in order.' },
        { keys: ['Space'], description: 'Toggles the focused checkbox.' },
    ],
    accessibility: {
        roles: 'A group of native checkboxes sharing one name. The select-all checkbox reports its mixed state as indeterminate. aria-describedby reaches the group, aria-errormessage each checkbox.',
        labels: 'Name the group with aria-label or a Field. Each option is labelled by its text.',
        focus: 'Native focus on each checkbox.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-options', description: 'Every option is a checkbox in a labelled group.' },
        { id: 'checked-values', description: 'The checkboxes whose values are in value are checked.' },
        { id: 'toggle', description: 'Toggling an option calls onChange with the value added or removed.' },
        {
            id: 'select-all',
            description:
                'The All checkbox is mixed with some chosen, checked with all; it chooses every enabled option or none.',
        },
        {
            id: 'disabled',
            description:
                'A disabled group disables every checkbox; a disabled option is disabled alone and left out of All.',
        },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
