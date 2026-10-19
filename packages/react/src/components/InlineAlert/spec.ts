import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'InlineAlert',
    summary: 'A short contextual message next to the thing it is about, in one of the four alert colors.',
    anatomy: [
        { part: 'alert', role: 'alert', description: 'An inline block with an icon and a line of text.' },
        { part: 'icon', description: 'The icon for the variant, decorative.' },
        { part: 'label', description: 'The message, in small body text.' },
    ],
    keyboard: [],
    accessibility: {
        roles: 'The block is role alert, so the text is announced when it appears; render it in response to an action. The icon is aria-hidden.',
        labels: 'The label is the content. Give the alert an id when a field points at it with aria-describedby or aria-errormessage; Field does this for you.',
        focus: 'Never focusable.',
    },
    behaviors: [
        { id: 'renders-label', description: 'The label renders inside an alert.' },
        {
            id: 'variant',
            description: 'variant is reflected as an attribute and picks the icon; informational is the default.',
        },
        {
            id: 'identifiable',
            description: 'id reaches the alert so a field can reference it, and owner is reflected.',
        },
        { id: 'icon-decorative', description: 'The icon renders aria-hidden.' },
        { id: 'axe-clean', description: 'Every variant passes axe-core.' },
    ],
};
