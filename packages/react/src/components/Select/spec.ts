import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Select',
    summary: 'A field control that opens a list of options and takes one of them as its value.',
    anatomy: [
        {
            part: 'control',
            role: 'combobox',
            description: 'A button showing the selected option or the placeholder, with an arrow. Opens the list.',
        },
        {
            part: 'list',
            role: 'listbox',
            description: 'The options, floating under the control and as wide as it unless menuWidth says otherwise.',
        },
        { part: 'option', role: 'option', description: 'One choice; the selected one carries aria-selected.' },
        { part: 'hidden input', description: 'Carries name and value for form submission.' },
    ],
    keyboard: [
        { keys: ['Enter', 'Space', 'ArrowDown'], description: 'On the closed control, open the list.' },
        { keys: ['ArrowDown', 'ArrowUp'], description: 'Move the active option, wrapping at the ends.' },
        { keys: ['Enter', 'Space'], description: 'On the open list, choose the active option and close.' },
        { keys: ['Tab'], description: 'Leaves the control and closes the list.' },
    ],
    accessibility: {
        roles: 'The control is a combobox with aria-haspopup listbox, aria-expanded, aria-controls naming the open list and aria-activedescendant naming the active option. The list is a listbox of options with aria-selected.',
        labels: 'The accessible name is the consumer aria-label followed by the selected option or the placeholder, so the current value is always read. Pair it with Field for a visible label.',
        focus: 'Focus stays on the control while the list is open; the active option is virtual, through aria-activedescendant. Disabled and read-only controls do not open.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'closed-by-default', description: 'The list is hidden and the control is collapsed.' },
        { id: 'opens-on-click', description: 'Clicking the control opens the list and marks it expanded.' },
        { id: 'select-option', description: 'Clicking an option calls onChange with its value and closes the list.' },
        {
            id: 'shows-selection',
            description:
                'The control shows the selected option, or the placeholder, and the hidden input carries the value.',
        },
        {
            id: 'keyboard',
            description: 'Enter or Space opens the list, the arrows move the active option, and Enter chooses it.',
        },
        { id: 'outside-click-closes', description: 'A click outside the control and the list closes it.' },
        { id: 'disabled-readonly', description: 'A disabled or read-only control does not open.' },
        { id: 'disabled-option', description: 'A disabled option cannot be chosen.' },
        {
            id: 'labelled',
            description:
                'The name is the aria-label plus the current option or placeholder, with no filler when there is no aria-label.',
        },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
