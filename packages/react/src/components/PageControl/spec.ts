import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'PageControl',
    summary: 'A row of dots that shows which page of a carousel or pager is current, read as one image.',
    anatomy: [
        { part: 'control', role: 'img', description: 'The pill of dots, flat or floating, named "Page N of M".' },
        {
            part: 'dots',
            description:
                'One dot per page up to five; past five, a window of five around the current page with smaller dots at the edges. The current dot is marked.',
        },
    ],
    keyboard: [],
    accessibility: {
        roles: 'A single role img; the dots are presentational and aria-hidden, so the page count is read once, not dot by dot.',
        labels: 'The name is "Page N of M" and changes with the current page.',
        focus: 'Never focusable; it reports position and takes no input.',
    },
    behaviors: [
        { id: 'image-label', description: 'The control is an image named "Page N of M".' },
        { id: 'dots', description: 'Up to five pages render one dot each, with the current one marked active.' },
        {
            id: 'window',
            description: 'More than five pages render five dots around the current page, smaller toward the edges.',
        },
        { id: 'invalid', description: 'Fewer than two pages, or a current page out of range, renders nothing.' },
        { id: 'variants', description: 'variant is reflected as data-variant; flat is the default.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
