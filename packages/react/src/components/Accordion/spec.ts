import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Accordion',
    summary:
        'A vertical stack of panels; each header toggles its own panel, and by default opening one closes the rest.',
    anatomy: [
        { part: 'item', description: 'One section: a header, its panel and a divider below.' },
        {
            part: 'header',
            role: 'button',
            description:
                'The whole header row toggles the panel. Holds the leading slot, the title, an optional subtitle, the trailing slot and the arrow.',
        },
        { part: 'panel', description: 'The content of the section. In the document only while open.' },
        { part: 'arrow', description: 'Points down when closed and up when open. Decorative.' },
    ],
    keyboard: [
        {
            keys: ['Tab', 'Shift+Tab'],
            description: 'Moves between headers and into the open panels in document order.',
        },
        { keys: ['Enter', 'Space'], description: "Toggles the focused header's panel." },
    ],
    accessibility: {
        roles: "Each header is a native button with aria-expanded for its state and aria-controls naming its panel. A disabled section's button is disabled, not aria-disabled, so it leaves the tab order.",
        labels: "The visible title labels each header; the subtitle, leading and trailing content are part of the button's name.",
        focus: 'Focus stays on the header after toggling. Opening a panel does not move focus into it.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'closed-by-default', description: 'Every panel starts closed.' },
        { id: 'open-initially', description: 'A section marked open starts open.' },
        { id: 'toggle-on-click', description: 'Clicking a header opens its panel, and clicking it again closes it.' },
        { id: 'single-open', description: 'By default, opening a panel closes the others.' },
        { id: 'multiple-open', description: 'When several panels are allowed, opening one leaves the others open.' },
        { id: 'disabled', description: "A disabled section's header is disabled and clicking it changes nothing." },
        { id: 'disabled-ignores-open', description: 'A disabled section stays closed even when marked open.' },
        { id: 'keyboard-toggle', description: 'Enter and Space toggle the focused header.' },
        {
            id: 'aria-controls',
            description: "Each header's aria-controls names the panel it opens, and aria-expanded follows the state.",
        },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
