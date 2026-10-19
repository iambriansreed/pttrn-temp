import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Table',
    summary:
        'Tabular data from column definitions and row objects, with a caption, sortable columns and, past the page size, paging.',
    anatomy: [
        {
            part: 'container',
            description:
                'The root; carries data-size and, when the rows outnumber the page size, data-has-pagination. A scroll container inside it lets a wide table scroll sideways.',
        },
        {
            part: 'table',
            role: 'table',
            description:
                'A native table laid out as a grid of the column widths, with aria-colcount and aria-rowcount for the whole data set.',
        },
        { part: 'caption', role: 'caption', description: 'The title, when given; it names the table.' },
        {
            part: 'header cell',
            role: 'columnheader',
            description:
                'A th with scope col per column. A sortable column carries aria-sort and holds a sort button; the others show the label as text.',
        },
        {
            part: 'sort button',
            role: 'button',
            description:
                'Named by the column label, with an arrow while the column is sorted. Each press advances the sort: ascending, descending, then none.',
        },
        {
            part: 'cell',
            role: 'cell',
            description:
                'A td per column and row, with data-cell naming the column, data-align and data-valign. Shows the value as text, an array joined with commas, an element as it is, or the output of the column formatter.',
        },
        {
            part: 'footer',
            role: 'group',
            description:
                'Only past the page size: "Showing a-b of n results", a visually hidden sentence describing the controls, and a Pagination named by that sentence.',
        },
    ],
    keyboard: [
        {
            keys: ['Tab', 'Shift+Tab'],
            description:
                'Move between the sort buttons and the paging controls in document order; cells take no focus.',
        },
        {
            keys: ['Enter', 'Space'],
            description:
                'On a sort button, advance that column through ascending, descending and unsorted; on a page button, go to that page.',
        },
    ],
    accessibility: {
        roles: 'A native table: th scope col headers, td cells, a caption from title, and aria-colcount and aria-rowcount that count the whole data set rather than the page shown. A sortable header carries aria-sort (none, ascending or descending) and holds a native button. Every sort change and page change is announced through a polite live region.',
        labels: 'The caption names the table, so give it a title. Each sort button is named by its column label; the sort arrow is hidden from assistive technology. The paging controls are a group named by a visually hidden sentence saying they page through the table above, N rows at a time.',
        focus: 'Native focus on the sort buttons and the paging controls, which are as tall as the header row and grow with size. Sorting keeps focus on the header button; nothing moves focus.',
    },
    behaviors: [
        {
            id: 'renders-table',
            description:
                'Columns render as th scope col headers, each row as a tr of td cells carrying data-cell, and title as the caption that names the table.',
        },
        {
            id: 'aria-counts',
            description:
                'aria-colcount counts the columns (a false column is skipped) and aria-rowcount counts every row, not only the page shown.',
        },
        {
            id: 'formats-cells',
            description:
                'A cell shows its value as text, joins an array with commas, renders an element as it is, and uses the column formatter with the row and the size when there is one.',
        },
        {
            id: 'sort-cycle',
            description:
                'Clicking a sortable header sorts ascending, then descending, then removes the sort and restores the given order, with aria-sort and the arrow following; the data array passed in is never reordered. A header without sort has no button and no aria-sort.',
        },
        {
            id: 'sorters',
            description:
                'The number sorter orders by value rather than by text, and a function sorter compares the two cell values itself.',
        },
        {
            id: 'multi-sort',
            description:
                'Sorting a second column keeps the first as the primary order and breaks its ties with the second.',
        },
        {
            id: 'announces-sort',
            description:
                'Each sort change is announced: "Sorted ascending by State", "Sorted descending by State", then "Removed sorting by State".',
        },
        {
            id: 'keyboard-sort',
            description:
                'Tab reaches the sort buttons in column order; Enter and Space advance the sort and keep focus on the button.',
        },
        {
            id: 'paginates',
            description:
                'With more rows than pageSize, one page of rows renders with "Showing 1-5 of 12 results" and paging controls named by a hidden sentence; choosing a page shows its rows and announces it.',
        },
        { id: 'resets-page', description: 'When the number of rows changes the table returns to the first page.' },
        {
            id: 'variants',
            description:
                'data-size reflects size, medium by default; data-has-pagination is present only when the rows outnumber the page size.',
        },
        { id: 'axe-clean', description: 'Every preset and the paged Usage example pass axe-core.' },
    ],
};
