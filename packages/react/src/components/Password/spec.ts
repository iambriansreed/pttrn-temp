import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Password',
    summary: 'A password field with a button that shows or hides what was typed.',
    anatomy: [
        {
            part: 'input',
            description:
                'An Input of type password, or text while shown; never offers the clear button or autocomplete.',
        },
        {
            part: 'toggle',
            role: 'button',
            description: 'Labelled "Show", then "Hide"; absent when disabled or read-only.',
        },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves from the input to the toggle.' },
        { keys: ['Enter', 'Space'], description: 'On the toggle, show or hide the password.' },
    ],
    accessibility: {
        roles: 'A native password input; the toggle is a button whose label states what it will do.',
        labels: 'A Field whose controlId matches its id, or an aria-label.',
        focus: 'Native focus; toggling keeps focus on the button.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'hidden-by-default', description: 'The field is type password.' },
        {
            id: 'show-hide',
            description: 'The toggle switches the field to text and back, and its label from Show to Hide.',
        },
        { id: 'typing', description: 'Typing calls onChange with the new value.' },
        { id: 'no-toggle-when-locked', description: 'Disabled or read-only, there is no toggle.' },
        { id: 'no-clear-or-autocomplete', description: 'No clear button, and autocomplete is off.' },
        { id: 'axe-clean', description: 'A labelled password field passes axe-core.' },
    ],
};
