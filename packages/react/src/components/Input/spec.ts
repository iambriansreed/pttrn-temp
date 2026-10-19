import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Input',
    summary: 'A single-line text field with optional leading and trailing content and a button that clears it.',
    anatomy: [
        {
            part: 'container',
            description: 'Wraps the field; carries the size, state and whether the clear button shows.',
        },
        { part: 'input', description: 'A native input of type text, number or password.' },
        {
            part: 'leading and trailing',
            description: 'Optional content on either side: a symbol, an icon or a button.',
        },
        {
            part: 'clear button',
            role: 'button',
            description:
                'Labelled "Clear"; shown while there is a value and the field is editable. Empties the field and returns focus to it.',
        },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves between the input, the trailing control and the clear button.' },
        { keys: ['Enter', 'Space'], description: 'On the clear button, clear the field.' },
    ],
    accessibility: {
        roles: 'A native input. invalid sets aria-invalid; aria-describedby and aria-errormessage pass through to it.',
        labels: 'The input needs a name: a Field whose controlId matches its id (its label then names the input), or an aria-label. aria-label overrides the Field label, so pass it only when there is no visible label.',
        focus: 'Native focus. Clearing returns focus to the input. Disabled and read-only fields show no clear button.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-value', description: 'The value, placeholder and name reach the input.' },
        { id: 'typing', description: 'Typing calls onChange with the new value and the event.' },
        {
            id: 'clear-button',
            description: 'With a value, the clear button empties the field and refocuses the input.',
        },
        {
            id: 'no-clear-button',
            description:
                'No clear button without a value, when showClearButton is false, or when disabled or read-only.',
        },
        { id: 'leading-trailing', description: 'Leading and trailing content render around the input.' },
        { id: 'states', description: 'disabled, readOnly and invalid reach the input and the container.' },
        {
            id: 'labelled',
            description:
                'A Field label names the input; aria-label names it when given, and nothing is invented otherwise.',
        },
        { id: 'axe-clean', description: 'A labelled input passes axe-core.' },
    ],
};
