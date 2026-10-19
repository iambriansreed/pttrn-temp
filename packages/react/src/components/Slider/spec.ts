import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Slider',
    summary: 'A control for picking a number, or a range between two numbers, by moving a knob along a track.',
    anatomy: [
        {
            part: 'labels',
            description: 'The label and the current value above the track; the minimum and maximum below it.',
        },
        {
            part: 'track',
            description:
                'The full range, with the filled part showing the value; clicking it moves the nearest knob there.',
        },
        {
            part: 'knob',
            role: 'slider',
            description: 'One per value: it carries min, max, the current value and its text, and takes the keyboard.',
        },
        { part: 'marks', description: 'Optional dots at every step.' },
        { part: 'hidden input', description: 'Carries name and the value, or "start,end" for a range.' },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves between the knobs.' },
        { keys: ['ArrowRight', 'ArrowLeft'], description: 'Move the focused knob by one step, within the range.' },
    ],
    accessibility: {
        roles: 'Each knob is a slider with aria-valuemin, aria-valuemax, aria-valuenow and aria-valuetext. A range has two: "label start" and "label end".',
        labels: 'label names the slider and its knobs; formatNumber formats the values that are read and shown.',
        focus: 'Knobs are in the tab order unless disabled; a read-only slider keeps focus but ignores input.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-values', description: 'The label, the formatted value and the minimum and maximum are shown.' },
        { id: 'exposes-value', description: 'The knob reports min, max, the current value and its text.' },
        { id: 'controlled', description: 'A new value from the parent replaces the current one.' },
        {
            id: 'arrow-keys',
            description: 'ArrowRight and ArrowLeft call onChange with the value moved by a step, clamped to the range.',
        },
        {
            id: 'range',
            description: 'Two values make two knobs, each moving its own end; the hidden input carries both.',
        },
        { id: 'disabled', description: 'A disabled slider takes its knobs out of the tab order and ignores the keys.' },
        { id: 'read-only', description: 'A read-only slider keeps its knobs focusable but ignores the keys.' },
        { id: 'hidden-input', description: 'The hidden input carries name and the current value.' },
        { id: 'axe-clean', description: 'Single and range sliders pass axe-core.' },
    ],
};
