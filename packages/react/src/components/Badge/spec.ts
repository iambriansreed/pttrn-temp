import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Badge',
    summary: 'A count of new items, on its own or pinned to the corner of another element; past 99 it shows "99+".',
    anatomy: [
        {
            part: 'badge',
            description:
                'A small filled circle with the count, in the primary or secondary color, optionally bordered in the surface color.',
        },
        {
            part: 'wrapper',
            description: 'When attached to children, an inline wrapper that positions the badge over their corner.',
        },
    ],
    keyboard: [],
    accessibility: {
        roles: 'Plain text in a superscript; no role.',
        labels: 'Assistive technology reads the number alone, so the element the badge is attached to must say what it counts in its own label, for example "Messages, 5 unread".',
        focus: 'Never focusable.',
    },
    behaviors: [
        { id: 'renders-count', description: 'The count renders as text.' },
        { id: 'no-count', description: 'Without a count only the children render.' },
        { id: 'caps-at-99', description: 'A count above 99 shows "99+".' },
        { id: 'attaches-to-child', description: 'With children it renders them with the badge attached after them.' },
        { id: 'variants', description: 'size, color and surfaceBorder are reflected in the attributes.' },
        { id: 'axe-clean', description: 'Attached to a labelled button it passes axe-core.' },
    ],
};
