import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Tag',
    summary: 'A short, non-interactive label that categorizes or draws attention to something, in a color and shape.',
    anatomy: [
        {
            part: 'tag',
            description: 'An inline span in one of the system colors, flat, pill-shaped or wrapped around a corner.',
        },
        { part: 'label', description: 'The text, truncated to one line.' },
        { part: 'triangle', description: 'The fold of the corner-wrap variant, decorative.' },
    ],
    keyboard: [],
    accessibility: {
        roles: 'Plain text in a span; no role. A tag never acts, so it is not a button or a link.',
        labels: 'The label is the content. Color alone must not carry meaning the label does not.',
        focus: 'Never focusable.',
    },
    behaviors: [
        { id: 'renders-label', description: 'The label renders as text.' },
        {
            id: 'variants',
            description: 'color, size and variant are reflected as attributes, and corner-wrap adds the fold.',
        },
        { id: 'passes-attributes', description: 'Other attributes reach the span.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
