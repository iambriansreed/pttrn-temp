import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Skeleton',
    summary: 'A placeholder in the shape of content that is still loading; shows the content itself once it arrives.',
    anatomy: [
        {
            part: 'placeholder',
            role: 'status',
            description:
                'A shape (rectangular, circular, photo, profile or thumbnail) of the given size, animated, labelled "Loading" and marked busy.',
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
        { id: 'shows-placeholder', description: 'Without children it renders the labelled, busy placeholder.' },
        { id: 'size', description: 'width and height set the placeholder size; numbers are pixels.' },
        { id: 'variant', description: 'variant is reflected in the attributes.' },
        { id: 'shows-content', description: 'With children it renders them and no placeholder.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
