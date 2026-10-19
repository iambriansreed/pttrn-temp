import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'ChipGroup',
    summary: 'A row of chips that wraps onto new lines or scrolls sideways.',
    anatomy: [
        { part: 'group', description: 'The container; wraps by default or scrolls horizontally.' },
        { part: 'chips', role: 'button', description: 'One Chip per item.' },
    ],
    keyboard: [{ keys: ['Tab'], description: 'Moves through the chips in order.' }],
    accessibility: {
        roles: 'A plain container of buttons; each chip keeps its own semantics.',
        labels: 'Each chip is named by its label. Give the group a heading or label in the surrounding content when its purpose is not obvious.',
        focus: 'Every enabled chip is in the tab order.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-chips', description: 'Every item renders as a chip with its props.' },
        { id: 'overflow', description: 'overflow scroll is reflected in the attributes; wrap is the default.' },
        { id: 'empty', description: 'Without items the group is empty.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
