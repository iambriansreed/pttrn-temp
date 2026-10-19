import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'SegmentedControl',
    summary: 'A compact row of segments that switches between views; one is selected at a time.',
    anatomy: [
        {
            part: 'list',
            role: 'tablist',
            description: 'The row, named by label, hugging its segments or filling the width.',
        },
        {
            part: 'segment',
            role: 'tab',
            description:
                'A label, an icon, or both. With iconsOnly and an icon on every segment, the labels hide and become tooltips.',
        },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves focus to the active segment; a single stop for the whole control.' },
        {
            keys: ['ArrowRight', 'ArrowLeft'],
            description: 'Move the active segment, skipping disabled ones and wrapping at the ends.',
        },
        { keys: ['Enter', 'Space'], description: 'Select the active segment.' },
    ],
    accessibility: {
        roles: 'A tablist of tabs with aria-selected. Icons are aria-hidden; with iconsOnly each tab is named by its tooltip.',
        labels: 'label names the list; each segment is named by its label, visible or as a tooltip.',
        focus: 'Roving: only the active segment is in the tab order.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-segments', description: 'Every option is a tab in a labelled tablist.' },
        { id: 'selected-segment', description: 'The segment whose value matches is selected.' },
        { id: 'click-selects', description: 'Clicking a segment calls onChange with its value.' },
        {
            id: 'icons-only',
            description: 'With iconsOnly and icons on every segment, labels hide and still name the segments.',
        },
        { id: 'arrow-keys', description: 'ArrowRight and ArrowLeft move the active segment and Enter selects it.' },
        { id: 'axe-clean', description: 'Text and icon-only controls pass axe-core.' },
    ],
};
