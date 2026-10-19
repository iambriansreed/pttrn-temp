import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Divider',
    summary: 'A thin line that separates grouped content, horizontally or vertically.',
    anatomy: [
        {
            part: 'line',
            description:
                'A horizontal or vertical rule, light or heavy, with optional padding around it and an inset from its ends.',
        },
    ],
    keyboard: [],
    accessibility: {
        roles: 'Decorative: aria-hidden, so assistive technology does not perceive it. Grouping that matters to a listener comes from headings or list structure, not from the line.',
        labels: 'None.',
        focus: 'Never focusable.',
    },
    behaviors: [
        { id: 'horizontal-by-default', description: 'Renders a horizontal, light line with padding.' },
        { id: 'vertical', description: 'orientation vertical is reflected in the attributes.' },
        {
            id: 'thickness-and-padding',
            description: 'thickness heavy and padding false are reflected in the attributes.',
        },
        { id: 'inset', description: 'inset sets the end margin in half spacing units; out of range means none.' },
        { id: 'axe-clean', description: 'Both orientations pass axe-core.' },
    ],
};
