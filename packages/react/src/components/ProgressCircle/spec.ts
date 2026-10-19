import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'ProgressCircle',
    summary: 'A spinning ring that says something is happening, with a label saying what.',
    anatomy: [
        {
            part: 'container',
            role: 'progressbar',
            description: 'The ring and its label, in one of three sizes, label below unless placed elsewhere.',
        },
        { part: 'ring', description: 'An SVG arc that spins, decorative.' },
        { part: 'label', description: 'The label text, sized with the ring.' },
    ],
    keyboard: [],
    accessibility: {
        roles: 'role progressbar with no value, so it reads as indeterminate. Mark the region it stands in for as aria-busy while it shows.',
        labels: 'The label names the progressbar through aria-labelledby; "Loading ..." when none is given. Say what is loading.',
        focus: 'Never focusable.',
        motion: 'The ring turns once every 1.5s without end. Reduced motion is not honored yet; under prefers-reduced-motion the ring should stop or fade instead.',
    },
    behaviors: [
        { id: 'renders-label', description: 'The label renders and names the progressbar.' },
        { id: 'default-label', description: 'Without a label the progressbar is named "Loading ...".' },
        { id: 'indeterminate', description: 'The progressbar has no aria-valuenow.' },
        { id: 'size', description: 'size is reflected as an attribute; medium is the default.' },
        { id: 'label-position', description: 'labelPosition is reflected as an attribute.' },
        { id: 'ring-animated', description: 'The ring is an animated SVG inside the progressbar.' },
        { id: 'axe-clean', description: 'Every size passes axe-core.' },
    ],
};
