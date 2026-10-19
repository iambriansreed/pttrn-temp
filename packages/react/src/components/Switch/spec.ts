import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Switch',
    summary:
        'A two-state toggle that takes effect immediately; the bare control, to be labelled by its consumer or by SwitchOption.',
    anatomy: [
        {
            part: 'input',
            role: 'switch',
            description: 'A checkbox input with role switch: the state, the label and the keyboard live here.',
        },
        { part: 'track and thumb', description: "The drawn switch, decorative; it follows the input's checked state." },
    ],
    keyboard: [{ keys: ['Space'], description: 'Toggles the switch.' }],
    accessibility: {
        roles: 'The input is role switch; its checked state is the on/off state. The drawing is aria-hidden.',
        labels: 'The consumer labels it: aria-label on the control, or a wrapping label as SwitchOption does.',
        focus: 'Native focus on the input. A disabled switch is disabled and leaves the tab order.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'reflects-checked', description: 'The checked prop is the on/off state.' },
        { id: 'toggle-on-click', description: 'Clicking calls onChange with the next state and the event.' },
        { id: 'keyboard-toggle', description: 'Space calls onChange with the next state.' },
        { id: 'disabled', description: 'A disabled switch is disabled and does not call onChange.' },
        { id: 'labelled', description: 'aria-label names the switch and name and value reach the input.' },
        { id: 'axe-clean', description: 'A labelled switch passes axe-core.' },
    ],
};
