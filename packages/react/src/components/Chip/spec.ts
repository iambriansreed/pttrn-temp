import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Chip',
    summary: 'A compact button for a suggestion, a filter or a choice, with optional icons or a count.',
    anatomy: [
        {
            part: 'chip',
            role: 'button',
            description: 'A pill-shaped native button, elevated unless flat, with a touch target.',
        },
        { part: 'leading icon', description: 'Optional, decorative.' },
        { part: 'label', description: 'The text.' },
        {
            part: 'trailing icon or badge',
            description: 'An icon, or a count when there is no trailing icon. Decorative.',
        },
    ],
    keyboard: [{ keys: ['Enter', 'Space'], description: 'Activate the chip.' }],
    accessibility: {
        roles: 'A native button. When selected is managed it carries aria-pressed, so a filter chip reads as a toggle; without the prop it is a plain action.',
        labels: 'The label is the accessible name; icons are aria-hidden.',
        focus: 'Native focus. A disabled chip is disabled and leaves the tab order.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-label', description: "The label is the button's name." },
        { id: 'click', description: 'Activating the chip calls onClick.' },
        { id: 'disabled', description: 'A disabled chip is disabled and does not call onClick.' },
        {
            id: 'selected',
            description:
                'selected is reflected as aria-pressed and an attribute; an unmanaged chip has no aria-pressed.',
        },
        { id: 'icons-decorative', description: 'Leading and trailing icons render aria-hidden.' },
        { id: 'trailing-badge', description: 'A trailing badge shows its count, unless a trailing icon is present.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
