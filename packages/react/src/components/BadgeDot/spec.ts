import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'BadgeDot',
    summary:
        'A small dot that marks something as new or signals a status, on its own or attached to the corner of another element.',
    anatomy: [
        {
            part: 'dot',
            description:
                'A filled circle in the primary or secondary color, 6 to 12 pixels, with an optional outline that separates it from what it sits on.',
        },
        {
            part: 'wrapper',
            description: 'When attached to children, an inline wrapper that positions the dot over their corner.',
        },
    ],
    keyboard: [],
    accessibility: {
        roles: 'The dot is decorative: it has no text and no role, so assistive technology does not perceive it.',
        labels: 'What the dot means has to be said in text next to it, for example a visually hidden "new" or a count in the element\'s label.',
        focus: 'Never focusable.',
    },
    behaviors: [
        { id: 'renders-dot', description: 'On its own it renders a primary 6 pixel dot.' },
        { id: 'attaches-to-child', description: 'With children it renders them with the dot attached after them.' },
        {
            id: 'size-and-outline',
            description: 'size sets the dot and its outline width; an unknown size falls back to 6.',
        },
        { id: 'color', description: 'color picks the secondary color.' },
        { id: 'axe-clean', description: 'Attached to a button it passes axe-core.' },
    ],
};
