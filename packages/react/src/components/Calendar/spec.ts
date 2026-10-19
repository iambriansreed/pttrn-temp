import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Calendar',
    summary: 'A month of days in a grid, with buttons that move the month and the year, for choosing one date.',
    anatomy: [
        {
            part: 'header',
            description:
                'The month and year as text, "June 2024", between the navigation buttons. It also names the grid.',
        },
        {
            part: 'navigation buttons',
            role: 'button',
            description:
                'Icon-only, labelled "Previous Year", "Previous Month", "Next Month" and "Next Year". They move the view and the active day by a month or a year without choosing a date.',
        },
        {
            part: 'grid',
            role: 'grid',
            description:
                'A table of the weeks that cover the month, Sunday to Saturday, with a column header per weekday ("Sun", with "Sunday" as abbr). Days of the neighboring months fill the first and last weeks.',
        },
        {
            part: 'day',
            role: 'gridcell',
            description:
                'One cell per day, named by its full date ("10th June 2024"). The active day carries data-selected and is the only cell in the Tab order. Clicking any day chooses it.',
        },
    ],
    keyboard: [
        {
            keys: ['ArrowLeft', 'ArrowRight'],
            description: 'Move the active day to the previous or next day, into the neighboring month at the edges.',
        },
        {
            keys: ['ArrowUp', 'ArrowDown'],
            description: 'Move the active day to the same weekday one week earlier or later.',
        },
        { keys: ['Home', 'End'], description: 'Move the active day to the Sunday or the Saturday of its week.' },
        { keys: ['PageUp', 'PageDown'], description: 'Move the active day one month back or forward.' },
        { keys: ['Enter', 'Space'], description: 'On the active day, choose it.' },
        {
            keys: ['Tab', 'Shift+Tab'],
            description:
                'Move between the navigation buttons and the active day. With focusTrap, Tab from the grid returns to the Previous Year button and Shift+Tab from that button returns to the active day.',
        },
    ],
    accessibility: {
        roles: 'A table with role grid, named by the month title through aria-labelledby, with a column header per weekday and a gridcell per day. The active day has tabIndex 0 and carries data-selected; every other day has tabIndex -1. The navigation buttons are native buttons.',
        labels: 'Each day is named by aria-label with its ordinal date, "10th June 2024". The column headers show the short weekday with the full name as abbr. The buttons are named "Previous Year", "Previous Month", "Next Month" and "Next Year".',
        focus: 'The active day is the value on mount, or today without a valid value. The arrow keys, Home, End, PageUp and PageDown move it and focus follows. The navigation buttons move it without moving focus. With focusTrap, as inside DatePicker, the active day takes focus on mount and Tab cycles between the grid and the buttons.',
        targetSize: 44,
    },
    behaviors: [
        {
            id: 'renders-month',
            description:
                'The title and the grid name show the month of value, with a column header per weekday and a cell for every day of the weeks that cover the month.',
        },
        {
            id: 'highlights-value',
            description:
                'The day matching value carries data-selected and is the only cell in the Tab order; without a valid value, today is.',
        },
        {
            id: 'choose-day',
            description: 'Clicking a day calls onChange with that Date, also for the days of the neighboring months.',
        },
        {
            id: 'month-year-buttons',
            description:
                'The navigation buttons move the view and the active day by a month or a year without calling onChange.',
        },
        {
            id: 'arrow-keys',
            description:
                'The arrow keys move the active day by a day or a week, focus follows it, and crossing a month edge shows that month.',
        },
        {
            id: 'home-end-page-keys',
            description:
                'Home and End go to the Sunday and the Saturday of the week; PageUp and PageDown move a month.',
        },
        { id: 'keyboard-choose', description: 'Enter or Space on the active day calls onChange with it.' },
        {
            id: 'focus-trap',
            description:
                'With focusTrap the active day is focused on mount and Tab cycles between the grid and the buttons; without it nothing is focused and Tab leaves the grid.',
        },
        {
            id: 'ids',
            description:
                'id names the calendar, the title that labels the grid derives from it, and each day gets an id ending in its date as MM-dd-yyyy.',
        },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
