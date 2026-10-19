import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'TimePicker',
    summary:
        'A field for a time of day, typed into hours, minutes and AM or PM segments or chosen from lists in a popup; its value is a 24-hour "HH:mm" string.',
    anatomy: [
        {
            part: 'group',
            role: 'group',
            description:
                'Wraps the segments and the toggle; named by aria-label ("Time picker" by default) and described by aria-describedby or aria-errormessage. Carries the size, the value and the open, disabled, read-only and invalid states as data attributes.',
        },
        {
            part: 'hidden input',
            description:
                'Carries name and value for form submission. A Field label whose controlId matches the id points at it, so clicking the label focuses the hours segment.',
        },
        {
            part: 'segments',
            role: 'spinbutton',
            description:
                'Editable hours (1 to 12), minutes (0 to 59) and meridiem (AM or PM) segments showing the 12-hour time; aria-valuetext carries the shown value, or "Empty" when the value is not a time.',
        },
        {
            part: 'toggle',
            role: 'combobox',
            description:
                'An icon-only control labelled "Open Time Picker" or "Close Time Picker", with aria-haspopup dialog, aria-expanded and aria-controls naming the open popup.',
        },
        {
            part: 'popup',
            role: 'dialog',
            description:
                'A modal panel labelled "Select time" floating under the field. It holds focus while open and closes once a meridiem is chosen.',
        },
        {
            part: 'listboxes',
            role: 'listbox',
            description:
                '"Select hours" (01 to 12), "Select minutes" (every five minutes) and "Select meridiem" (AM, PM); the chosen option carries aria-selected and the active one is named by aria-activedescendant.',
        },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves through the hours, minutes and meridiem segments, then the toggle.' },
        {
            keys: ['0-9'],
            description:
                'On the hours or minutes segment, type the value; focus moves to the next segment once the digits can only mean one number.',
        },
        { keys: ['A', 'P'], description: 'On the meridiem segment, set AM or PM.' },
        {
            keys: ['ArrowUp', 'ArrowDown'],
            description:
                'Step the focused segment, wrapping at its ends; on the meridiem segment, switch AM and PM. In a listbox, move the active option, wrapping at the ends.',
        },
        { keys: ['ArrowLeft', 'ArrowRight'], description: 'Move between the segments.' },
        { keys: ['Backspace'], description: 'On a segment, clears the value.' },
        { keys: ['Enter', 'Escape'], description: 'On a segment, leave it.' },
        {
            keys: ['Enter', 'Space'],
            description:
                'On the toggle, open or close the popup. In a listbox, choose the active option and move to the next listbox; after the meridiem the popup closes.',
        },
        { keys: ['Escape'], description: 'In the popup, closes it and returns focus to the toggle.' },
    ],
    accessibility: {
        roles: 'A group holding three spinbuttons, with aria-valuemin and aria-valuemax on the numeric ones and aria-valuetext on all, and a combobox toggle with aria-haspopup dialog, aria-expanded and aria-controls naming the popup. The popup is a dialog with aria-modal holding three listboxes; their options carry aria-selected and each listbox names its active option through aria-activedescendant. disabled and readOnly reach the segments as aria-disabled and aria-readonly and the toggle as aria-disabled; invalid is a data attribute for the error border only.',
        labels: 'The group is named by aria-label, "Time picker" unless given another, and described by aria-describedby or, when given, aria-errormessage. The segments are "hours", "minutes" and "meridiem"; the toggle is "Open Time Picker" or "Close Time Picker"; the popup is "Select time" and its listboxes "Select hours", "Select minutes" and "Select meridiem". A Field label points at the hidden input, so it focuses the field but does not name the group.',
        focus: 'Native focus moves through the segments and then the toggle. Opening the popup moves focus to the hours listbox and holds it in the popup; choosing an option moves it to the next listbox, and choosing a meridiem or pressing Escape closes the popup and returns focus to the toggle. Disabled and read-only fields are not in the tab order and do not open.',
        targetSize: 44,
    },
    behaviors: [
        {
            id: 'shows-value',
            description:
                'The HH:mm value shows as 12-hour segments and the hidden input carries name and value; an empty value shows 12:00 AM and a value that is not a time shows empty segments.',
        },
        {
            id: 'labelled',
            description:
                'The group is named by aria-label ("Time picker" by default), the segments and the toggle by their own labels, and clicking a Field label focuses the hours segment.',
        },
        {
            id: 'described',
            description: 'aria-describedby describes the group, and aria-errormessage takes its place when given.',
        },
        {
            id: 'typing',
            description:
                'Digits fill the hours and minutes and move on once complete, A and P set the meridiem, Backspace clears the value and Enter leaves the segment; onChange gets the HH:mm value.',
        },
        {
            id: 'arrow-keys',
            description:
                'ArrowUp and ArrowDown step the focused segment, wrapping at its ends and switching the meridiem; ArrowLeft and ArrowRight move between the segments.',
        },
        {
            id: 'toggle-popup',
            description:
                'Closed by default; the toggle opens the modal popup, whose listboxes mark the current time selected, focuses the hours listbox, and closes it again.',
        },
        {
            id: 'pick-time',
            description:
                'Choosing an hour calls onChange and moves focus to the minutes, a minute to the meridiem, and a meridiem closes the popup and returns focus to the toggle.',
        },
        {
            id: 'listbox-keyboard',
            description:
                'Enter or Space on the toggle opens the popup, the arrows move aria-activedescendant through the options, and Enter or Space chooses the active one.',
        },
        { id: 'escape-closes', description: 'Escape in the popup closes it and returns focus to the toggle.' },
        { id: 'outside-click-closes', description: 'A click outside the popup closes it.' },
        {
            id: 'states',
            description:
                'disabled, readOnly, invalid and size reach the group as data attributes; disabled or read-only segments are neither editable nor in the tab order, and the toggle does not open.',
        },
        {
            id: 'axe-clean',
            description: 'The field on its own, the Usage example inside a Field and the open popup pass axe-core.',
        },
    ],
};
