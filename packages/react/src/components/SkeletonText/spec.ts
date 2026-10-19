import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'SkeletonText',
    summary: 'Placeholder lines in the shape of text that is still loading; shows the text itself once it arrives.',
    anatomy: [
        { part: 'placeholder', role: 'status', description: 'A block labelled "Loading" and marked busy.' },
        {
            part: 'lines',
            description: "One bar per line, sized to the text variant's size and line height; the last is shorter.",
        },
    ],
    keyboard: [],
    accessibility: {
        roles: 'A status region with aria-busy true while loading, so the wait is announced once and not repeated.',
        labels: 'aria-label "Loading".',
        focus: 'Never focusable.',
        motion: 'The shimmer animation follows prefers-reduced-motion.',
    },
    behaviors: [
        { id: 'shows-lines', description: 'Without children it renders as many lines as asked, sized to the variant.' },
        { id: 'at-least-one-line', description: 'Fewer than one line still renders one.' },
        { id: 'announces-loading', description: 'The placeholder is a busy status labelled "Loading".' },
        { id: 'shows-content', description: 'With children it renders them and no placeholder.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
