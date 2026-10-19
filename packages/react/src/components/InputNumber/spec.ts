import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'InputNumber',
    summary: 'A number field with buttons that step the value down and up within optional bounds.',
    anatomy: [
        { part: 'input', description: 'A native number input, centered between the buttons or left of them.' },
        {
            part: 'decrease and increase',
            role: 'button',
            description:
                'Labelled "Decrease value" and "Increase value"; each controls the input and is disabled at its bound.',
        },
    ],
    keyboard: [
        {
            keys: ['ArrowUp', 'ArrowDown'],
            description: 'In the input, step the value, as the native number input does.',
        },
        {
            keys: ['Tab'],
            description: 'Moves to and from the input; the buttons are not tab stops because the arrows do their job.',
        },
    ],
    accessibility: {
        roles: 'A native number input with min, max and step. The buttons carry aria-controls naming the input.',
        labels: 'A Field whose controlId matches its id, or an aria-label.',
        focus: 'Native focus on the input; the buttons are reachable by pointer and hold to repeat.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-value', description: 'The value, name, min, max and step reach the input.' },
        {
            id: 'typing',
            description: 'Typing calls onChange with the number typed, or undefined when it is not a number.',
        },
        { id: 'steppers', description: 'The buttons call onChange with the value moved by one step.' },
        { id: 'bounds', description: 'A button is disabled when its step would leave the range.' },
        {
            id: 'disabled-readonly',
            description: 'Disabled or read-only, the input reflects it and both buttons are disabled.',
        },
        { id: 'axe-clean', description: 'A labelled number field passes axe-core.' },
    ],
};
