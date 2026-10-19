import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Textarea',
    summary: 'A multi-line text field that grows with its content between a minimum and a maximum number of rows.',
    anatomy: [
        {
            part: 'container',
            description: 'Wraps the field; carries the size and state, and the row limits as custom properties.',
        },
        { part: 'textarea', description: 'The native textarea.' },
        { part: 'replica', description: 'A hidden copy of the text that gives the field its height, decorative.' },
    ],
    keyboard: [{ keys: ['Tab'], description: 'Moves to and from the field; Enter inserts a line break.' }],
    accessibility: {
        roles: 'A native textarea. invalid sets aria-invalid; aria-describedby and aria-errormessage pass through.',
        labels: 'A Field whose controlId matches its id, or an aria-label.',
        focus: 'Native focus; leaving the field scrolls it back to the top.',
    },
    behaviors: [
        { id: 'renders-value', description: 'The value, placeholder and name reach the textarea.' },
        { id: 'typing', description: 'Typing calls onChange with the new value and the event.' },
        {
            id: 'auto-grow',
            description: 'The replica mirrors the text so the field grows with it, within minRows and maxRows.',
        },
        { id: 'states', description: 'disabled, readOnly, required and invalid reach the textarea and the container.' },
        { id: 'labelled', description: 'A Field label or aria-label names the textarea.' },
        { id: 'axe-clean', description: 'A labelled textarea passes axe-core.' },
    ],
};
