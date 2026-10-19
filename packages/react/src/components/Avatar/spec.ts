import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Avatar',
    summary: 'A person or entity as an image, an icon or initials, named for assistive technology and in a tooltip.',
    anatomy: [
        {
            part: 'avatar',
            role: 'img',
            description: 'A circle in a system color and size. Role img, or role button when it has onClick.',
        },
        {
            part: 'content',
            description:
                'The image when given, else the person icon when showIcon, else up to two initials from the name. All decorative; the name carries the meaning.',
        },
        { part: 'tooltip', description: 'The name, shown on hover and focus unless hideTooltip.' },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Reaches a clickable avatar.' },
        { keys: ['Enter', 'Space'], description: 'Activate a clickable avatar.' },
    ],
    accessibility: {
        roles: 'Role img with the role description "person", or role button when clickable. A disabled clickable avatar is aria-disabled and out of the tab order. The image, icon and initials are aria-hidden.',
        labels: 'The name is the accessible name through aria-label, and the tooltip text.',
        focus: 'Only a clickable, enabled avatar is in the tab order.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'named', description: 'The avatar is an image named after the person.' },
        {
            id: 'initials',
            description:
                'Without an image or icon it shows the first letters of the first two words, or the initials given, at most two characters.',
        },
        {
            id: 'image-and-icon',
            description:
                'An image wins over the icon, which wins over the initials; all three are hidden from assistive technology.',
        },
        { id: 'clickable', description: 'With onClick it is a focusable button that calls onClick.' },
        {
            id: 'disabled',
            description:
                'A disabled clickable avatar is aria-disabled, out of the tab order and does not call onClick.',
        },
        { id: 'tooltip', description: 'The name is a tooltip unless hideTooltip.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
