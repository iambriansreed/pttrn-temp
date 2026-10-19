import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Tooltip',
    summary: 'A short text that appears next to a trigger while it is hovered or focused.',
    anatomy: [
        {
            part: 'trigger',
            description: 'Rendered by the consumer from the trigger props: the hover, focus and labelling wiring.',
        },
        {
            part: 'tooltip',
            role: 'tooltip',
            description:
                'The text, floating next to the trigger, with an arrow pointing at it unless showTail is false.',
        },
    ],
    keyboard: [{ keys: ['Tab'], description: 'Focusing the trigger shows the tooltip; leaving it hides it.' }],
    accessibility: {
        roles: "The floating element is role tooltip. The trigger receives aria-labelledby for it, so the tooltip text is the trigger's name; a trigger with a visible label of its own may pass the id on as aria-describedby instead, as Button does.",
        labels: 'The label prop is the tooltip text. Without a label, or when disabled, the trigger renders alone.',
        focus: "The tooltip never takes focus; it follows the trigger's hover and focus.",
    },
    behaviors: [
        { id: 'hidden-by-default', description: 'The tooltip is hidden until the trigger is hovered or focused.' },
        { id: 'shows-on-hover', description: 'Hovering the trigger shows the tooltip, and leaving it hides it.' },
        { id: 'shows-on-focus', description: 'Focusing the trigger shows the tooltip, and blurring it hides it.' },
        { id: 'labels-trigger', description: "The trigger's aria-labelledby names the tooltip." },
        { id: 'no-label', description: 'Without a label the trigger renders with no tooltip wiring.' },
        { id: 'disabled', description: 'When disabled the trigger renders with no tooltip wiring.' },
        { id: 'axe-clean', description: 'The trigger with its tooltip passes axe-core.' },
    ],
};
