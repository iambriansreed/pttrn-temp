import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'InputPhone',
    summary:
        'A phone number field: a country button showing the calling code, in front of a digits-only input that formats the number for that country as it is typed.',
    anatomy: [
        {
            part: 'container',
            description:
                'Wraps an Input owned by input-phone; the Input container carries the size and the disabled, read-only and invalid states.',
        },
        {
            part: 'country button',
            role: 'combobox',
            description:
                'A tertiary button in the leading slot, labelled "select country code", showing "+" and the calling code of the current country, a flag when renderFlag is given, and an arrow. Opens the list.',
        },
        {
            part: 'input',
            description:
                'A native text input, "Phone number input" unless aria-label says otherwise, with autocomplete off and the Input clear button while there is a value. Only digits can be typed; the value shown is formatted for the country unless disableFormatting.',
        },
        {
            part: 'list',
            role: 'listbox',
            description:
                'Every supported country, labelled "Select country code", floating under the field and as wide as it; present only while open, scrolling past scrollLimit rows.',
        },
        {
            part: 'option',
            role: 'option',
            description: 'A country name with its "(+code)" trailing; the current country carries aria-selected.',
        },
    ],
    keyboard: [
        {
            keys: ['Tab'],
            description: 'Moves from the country button to the input, then to the clear button while there is a value.',
        },
        {
            keys: ['Enter', 'Space', 'ArrowDown'],
            description: 'On the closed country button, open the list with the first country active.',
        },
        { keys: ['ArrowDown', 'ArrowUp'], description: 'Move the active country, wrapping at the ends.' },
        { keys: ['Enter', 'Space'], description: 'On the open list, choose the active country and close.' },
        { keys: ['Escape'], description: 'Closes the list.' },
        { keys: ['0-9'], description: 'In the input, type a digit; any other character is ignored.' },
    ],
    accessibility: {
        roles: 'The country button is a combobox with aria-haspopup listbox and aria-expanded. aria-owns names the list, which exists only while open, when aria-controls also names it and aria-activedescendant names the active option. The list is a listbox of options with aria-selected. The input is a native text field: invalid sets aria-invalid, and aria-describedby and aria-errormessage pass through to it. Choosing a country is announced through a polite live region: "Selected country code France".',
        labels: 'aria-label names the input and defaults to "Phone number input", so a Field label is visible but does not name the input unless the same text is passed as aria-label. The country button is "select country code" and the list "Select country code"; the calling code and the flag are hidden from assistive technology, and each option is named by its country and calling code.',
        focus: 'Native focus on the country button, then the input. Focus stays on the button while the list is open; the active option is virtual, through aria-activedescendant. Choosing a country closes the list and moves focus to the input. Disabled and read-only fields disable the button, so the list does not open.',
        targetSize: 44,
    },
    behaviors: [
        {
            id: 'renders-input',
            description: 'The value, name and required reach a text input with autocomplete off.',
        },
        {
            id: 'country-button',
            description:
                'A collapsed combobox labelled "select country code" shows the calling code of initialCountryCode.',
        },
        {
            id: 'opens-on-click',
            description:
                'Clicking the country button opens a listbox of every supported country, the current one selected and the first one active.',
        },
        {
            id: 'choose-country',
            description:
                'Clicking a country updates the calling code, announces it, closes the list and focuses the input; the next change reports the new country code.',
        },
        {
            id: 'keyboard',
            description:
                'Enter, Space or ArrowDown opens the list, the arrows move the active country and wrap, Enter chooses it and Escape closes.',
        },
        { id: 'outside-click-closes', description: 'A click outside the field and the list closes it.' },
        {
            id: 'formats-as-typed',
            description:
                'Typing digits calls onChange with the number formatted for the country and the country code; disableFormatting passes the digits through.',
        },
        { id: 'digits-only', description: 'Keys other than digits are ignored by the input.' },
        {
            id: 'states',
            description:
                'disabled and readOnly disable the input and the country button; invalid and size reach the input and its container.',
        },
        {
            id: 'labelled',
            description:
                'aria-label names the input, "Phone number input" by default; aria-describedby and aria-errormessage reach it.',
        },
        {
            id: 'render-flag',
            description:
                'renderFlag draws a decorative flag in the country button and beside each option; none without it.',
        },
        { id: 'axe-clean', description: 'The field, in a Field and with its list open, passes axe-core.' },
    ],
};
