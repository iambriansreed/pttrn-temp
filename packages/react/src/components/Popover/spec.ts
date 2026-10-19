import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Popover',
    summary:
        'A small panel anchored to a trigger, with a header, a short message, optional actions and a close button.',
    anatomy: [
        {
            part: 'trigger',
            description: 'Rendered by the consumer from the trigger props; clicking it toggles the popover.',
        },
        {
            part: 'panel',
            description: 'Floats next to the trigger with an arrow pointing at it. Rendered in a portal while open.',
        },
        { part: 'header', description: 'The title and the close button.' },
        { part: 'close button', role: 'button', description: 'Labelled "Close".' },
        { part: 'content', description: 'The message and, below it, the secondary and primary calls to action.' },
    ],
    keyboard: [
        { keys: ['Enter', 'Space'], description: 'On the trigger, toggle the popover.' },
        {
            keys: ['Tab', 'Shift+Tab'],
            description: 'Cycle through the close button and the actions while the popover is open.',
        },
    ],
    accessibility: {
        roles: 'The trigger carries aria-describedby naming the panel, so the message describes it.',
        labels: 'The header is visible text; the close button and the actions have visible labels.',
        focus: 'Focus moves into the panel when it opens and is held there; clicking outside closes it and releases focus.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'closed-by-default', description: 'Only the trigger renders until it is clicked.' },
        {
            id: 'toggle-on-click',
            description: 'Clicking the trigger opens the popover, and clicking it again closes it.',
        },
        { id: 'close-button', description: 'The close button closes the popover.' },
        { id: 'outside-click-closes', description: 'A click outside the panel closes it.' },
        { id: 'describes-trigger', description: "The trigger's aria-describedby names the panel." },
        {
            id: 'calls-to-action',
            description: 'The primary and secondary actions render with their labels and call their onClick.',
        },
        { id: 'disabled', description: 'When disabled, the trigger renders without popover behavior.' },
        { id: 'focus-moves-in', description: 'Focus moves into the panel when it opens.' },
        { id: 'axe-clean', description: 'The trigger and the open popover pass axe-core.' },
    ],
};
