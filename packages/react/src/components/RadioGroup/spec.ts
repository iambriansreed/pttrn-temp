import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'RadioGroup',
    summary: 'A set of radio options of which exactly one is chosen.',
    anatomy: [
        { part: 'group', role: 'radiogroup', description: 'The container, named by the consumer.' },
        { part: 'option', description: 'A RadioOption: the radio, its label and an optional description.' },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Enters the group on the chosen radio, or the first one.' },
        {
            keys: ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'],
            description: 'Move the choice to the next or previous enabled option.',
        },
        { keys: ['Space'], description: 'Chooses the focused option when none is chosen.' },
    ],
    accessibility: {
        roles: 'A radiogroup of native radios sharing one name. aria-describedby on the group also reaches each radio; aria-errormessage reaches each radio.',
        labels: 'Name the group with aria-label or a Field. Each option is labelled by its text and described by its description.',
        focus: 'Native roving focus among the radios.',
        targetSize: 44,
    },
    behaviors: [
        {
            id: 'renders-options',
            description: 'Every option is a radio in a labelled radiogroup, with its description.',
        },
        { id: 'checked-value', description: 'The radio whose value matches is checked.' },
        { id: 'choose', description: 'Choosing an option calls onChange with its value.' },
        { id: 'arrow-keys', description: 'The arrow keys move the choice, skipping disabled options.' },
        { id: 'disabled', description: 'A disabled group disables every radio; a disabled option is disabled alone.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
