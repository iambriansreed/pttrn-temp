import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Fab',
    summary:
        'A floating action button pinned to a corner of its container or the page, with a label and an optional icon.',
    anatomy: [
        {
            part: 'button',
            role: 'button',
            description:
                'A button (or the element given by as) in a corner, flat or page-fixed, in a size and variant.',
        },
        { part: 'icon', description: 'The icon, aria-hidden, before the label.' },
        { part: 'label', description: 'The visible label; hidden when iconOnly, which rounds the button.' },
        { part: 'tooltip', description: 'The tooltip text, or the label when iconOnly, shown on hover and focus.' },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Reaches the Fab.' },
        { keys: ['Enter', 'Space'], description: 'Activate it.' },
    ],
    accessibility: {
        roles: 'A native button by default; as="a" with an href makes it a link.',
        labels: 'The name is aria-label, else the label. An icon-only Fab without aria-label is named by its tooltip, which repeats the label. With a visible label the tooltip describes the Fab, so the name stays the text people see.',
        focus: 'In the tab order like any button; a page-fixed Fab stays reachable wherever the page is scrolled.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'labelled-button', description: 'A button named by its label, or by aria-label when given.' },
        {
            id: 'icon',
            description:
                'The icon renders aria-hidden; iconOnly hides the label text and rounds the button, and is ignored without an icon.',
        },
        { id: 'tooltip', description: 'tooltip adds a description; an icon-only Fab is named by its tooltip.' },
        { id: 'click', description: 'Clicking calls onClick.' },
        {
            id: 'placement',
            description: 'placement and container are attributes; a page container pins the Fab with fixed position.',
        },
        { id: 'as-element', description: 'as renders another element, such as a link.' },
        { id: 'variants', description: 'size and variant are attributes; medium and primary are the defaults.' },
        { id: 'axe-clean', description: 'Every preset and the icon-only form pass axe-core.' },
    ],
};
