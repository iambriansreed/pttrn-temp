import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Pagination',
    summary:
        'Controls for moving through numbered pages: previous and next, with a button per page or, past seven pages, a page number field.',
    anatomy: [
        { part: 'group', role: 'group', description: 'Wraps the controls; the consumer may name it with aria-label.' },
        {
            part: 'previous and next',
            role: 'button',
            description: 'Icon-only buttons whose labels name the page they go to; disabled at the ends.',
        },
        {
            part: 'page buttons',
            role: 'button',
            description:
                'Up to seven pages, one button each, labelled "Page N"; the current one is primary and aria-current.',
        },
        {
            part: 'page field',
            description:
                'Past seven pages, a number input with "of N"; submitting or leaving it goes to that page, clamped to the range.',
        },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves between the buttons and the field.' },
        { keys: ['Enter'], description: 'On the field, goes to the typed page.' },
    ],
    accessibility: {
        roles: 'A group of buttons. The current page button carries aria-current page. Every page change is announced through a polite live region: "Page N of M".',
        labels: 'Previous and next are labelled with their target ("Previous page (2)", "First page" at the start, "Last page" at the end); page buttons are "Page N".',
        focus: 'Native focus on the buttons and the field.',
        targetSize: 44,
    },
    behaviors: [
        {
            id: 'renders-pages',
            description: 'Up to seven pages render as buttons, with the current one marked aria-current.',
        },
        {
            id: 'previous-next',
            description: 'Previous and next call onChange with the neighboring page and are disabled at the ends.',
        },
        { id: 'click-page', description: 'Clicking a page button calls onChange with that page.' },
        {
            id: 'page-field',
            description:
                'Past seven pages a number field replaces the buttons; Enter or blur goes to that page, clamped to the range.',
        },
        { id: 'announces', description: 'A page change is announced as "Page N of M".' },
        { id: 'single-page', description: 'With one page nothing renders.' },
        { id: 'axe-clean', description: 'Both layouts pass axe-core.' },
    ],
};
