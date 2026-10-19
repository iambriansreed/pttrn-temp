import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'DatePicker',
    summary: 'A text field for a date, typed as mm/dd/yyyy or chosen from a calendar that opens beside it.',
    anatomy: [
        { part: 'input', description: 'The date as text. Placeholder mm/dd/yyyy unless given another.' },
        {
            part: 'toggle',
            role: 'button',
            description:
                'Labelled "Toggle calendar"; opens and closes the calendar. Absent when disabled or read-only.',
        },
        {
            part: 'calendar',
            role: 'dialog',
            description: 'A modal popup labelled "Choose Date" holding the Calendar, positioned under the field.',
        },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves from the input to the toggle, then into the open calendar.' },
        { keys: ['Enter', 'Space'], description: 'On the toggle, open or close the calendar; on a day, choose it.' },
    ],
    accessibility: {
        roles: 'The input is a text field. The calendar popup is a dialog with aria-modal that holds focus while open.',
        labels: 'The input is named by aria-label ("Enter or choose date" by default); pair it with Field for a visible label. The toggle and the dialog have their own labels.',
        focus: 'Opening the calendar moves focus into it; choosing a date closes it and the field keeps the value.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-input', description: 'The input shows the value with the default label and placeholder.' },
        { id: 'typing', description: 'Typing calls onChange with the text so far.' },
        { id: 'toggle-calendar', description: 'The toggle opens the calendar dialog and closes it again.' },
        { id: 'pick-date', description: 'Choosing a day calls onChange with mm/dd/yyyy and closes the calendar.' },
        { id: 'stays-open', description: 'With closeCalendarOnChange false the calendar stays open after a choice.' },
        { id: 'outside-click-closes', description: 'A click outside the calendar closes it.' },
        {
            id: 'disabled-readonly',
            description: 'Disabled or read-only, the input reflects it and there is no toggle.',
        },
        { id: 'axe-clean', description: 'The field with its calendar open passes axe-core.' },
    ],
};
