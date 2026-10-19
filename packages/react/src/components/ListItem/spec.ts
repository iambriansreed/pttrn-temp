import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'ListItem',
    summary:
        'A row with a label, optional sub text and leading and trailing content; a plain item, a link or a button depending on its props.',
    anatomy: [
        { part: 'item', description: 'A div by default, an anchor with href, or the element given by `as`.' },
        { part: 'leading', description: 'Optional content before the label: an icon, an image or an avatar.' },
        { part: 'label', description: 'The text, truncated to one line, with optional sub text under it.' },
        { part: 'trailing', description: 'Optional content after the label: an icon or a control.' },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Reaches an actionable item.' },
        { keys: ['Enter', 'Space'], description: 'Activate a clickable item.' },
    ],
    accessibility: {
        roles: 'None when static. With onClick it is role button unless rendered as a native button or label; with href it is a link. A role prop (option, menuitem) overrides. Disabled and read-only items drop their action.',
        labels: 'The label is the name; aria-label overrides it. Controls in the trailing slot keep their own labels.',
        focus: 'Only an actionable, enabled item is in the tab order.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-label', description: 'The label and sub text render.' },
        { id: 'leading-trailing', description: 'Leading and trailing content render around the label.' },
        {
            id: 'clickable',
            description: 'With onClick the item is a focusable button that calls onClick on click, Enter and Space.',
        },
        { id: 'link', description: 'With href the item is a link.' },
        {
            id: 'disabled-readonly',
            description: 'Disabled or read-only, the item is marked and does not call onClick.',
        },
        { id: 'role-override', description: 'A role prop replaces the inferred role.' },
        { id: 'empty-label', description: 'Without a label nothing renders.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
