import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'OTPInput',
    summary:
        'A row of one-character cells for a one-time code, filled one keystroke at a time or by pasting the whole code.',
    anatomy: [
        {
            part: 'group',
            role: 'group',
            description:
                'Wraps the cells; named by aria-label, "OTP input" by default, and reflects size, disabled, read-only, invalid and secure in data attributes.',
        },
        {
            part: 'cell',
            description:
                'One native input per character, maxLength 1 and autocomplete off; numeric input mode unless alphanumeric, type password when secure. Each is labelled "<aria-label> digit N".',
        },
        {
            part: 'first cell',
            description:
                'Also carries the id, the name, aria-describedby, aria-errormessage and aria-invalid for the whole code; the other cells are named "<name>-N".',
        },
        { part: 'dots', description: 'When secure, a decorative dot drawn over each filled cell.' },
    ],
    keyboard: [
        {
            keys: ['Tab'],
            description: 'Moves through the filled cells and the next empty one; the cells after it are skipped.',
        },
        {
            keys: ['0-9'],
            description: 'Fills the cell and moves to the next one; letters are accepted too when alphanumeric.',
        },
        {
            keys: ['Backspace'],
            description: 'Clears the cell, or, when it is already empty, clears the previous cell and moves to it.',
        },
        { keys: ['ArrowLeft', 'ArrowUp'], description: 'Move to the previous cell.' },
        { keys: ['ArrowRight', 'ArrowDown'], description: 'Move to the next cell once the current one is filled.' },
    ],
    accessibility: {
        roles: 'A group of native single-character inputs. invalid sets aria-invalid on the first cell, and aria-describedby and aria-errormessage pass through to it; disabled, readOnly and required reach every cell.',
        labels: 'The group and every cell are named from aria-label, "OTP input" by default; a cell adds its position, as "OTP input digit 3". Pair it with OTPInputField for a visible label, whose helper and error text reach the first cell.',
        focus: 'Native focus. Typing moves to the next cell and Backspace on an empty cell moves back; only the filled cells and the next empty one are in the tab order, and a click on a later cell lands on the next empty one. A paste leaves focus after the last pasted character.',
    },
    behaviors: [
        {
            id: 'renders-cells',
            description:
                'One single-character input per length, in a group named by aria-label, each labelled with its position and filled from defaultValue.',
        },
        {
            id: 'field-attributes',
            description:
                'The id, name, aria-describedby, aria-errormessage and aria-invalid land on the first cell; the other cells are named name-N.',
        },
        { id: 'typing-advances', description: 'Typing a character fills the cell and moves focus to the next one.' },
        {
            id: 'onchange-when-complete',
            description: 'onChange is called with the whole code once the last cell fills, and not before.',
        },
        {
            id: 'numeric-only',
            description:
                'Letters are rejected and the input mode is numeric unless alphanumeric, which accepts them with a text input mode.',
        },
        {
            id: 'backspace',
            description:
                'Backspace clears the cell and stays; on an empty cell it clears the previous cell and moves to it.',
        },
        {
            id: 'arrow-keys',
            description:
                'Left and Up move to the previous cell; Right and Down move to the next one only when the current cell is filled.',
        },
        {
            id: 'paste',
            description:
                'Pasting fills the cells from the focused one on, drops what does not fit, moves focus after the last pasted character and calls onChange when the code is complete.',
        },
        {
            id: 'focus-order',
            description:
                'Only the filled cells and the next empty one are in the tab order; clicking a cell past them focuses the next empty one.',
        },
        {
            id: 'secure',
            description:
                'secure makes every cell a password input, marks the group data-secure and draws a dot over each filled cell.',
        },
        {
            id: 'states',
            description:
                'disabled, readOnly and required reach every cell; disabled, readOnly, invalid and size are reflected on the group.',
        },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
