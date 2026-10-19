import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'TabGroup',
    summary: 'A row of tabs that switches between views; one is selected at a time.',
    anatomy: [
        {
            part: 'list',
            role: 'tablist',
            description: 'The row, named by label. Hugs its tabs or fills the width; showTrail extends the underline.',
        },
        {
            part: 'tab',
            role: 'tab',
            description:
                'A label with an optional icon and badge. The selected one carries aria-selected; a disabled one aria-disabled.',
        },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves focus to the active tab; a single stop for the whole group.' },
        {
            keys: ['ArrowRight', 'ArrowLeft'],
            description: 'Move the active tab, skipping disabled tabs and wrapping at the ends.',
        },
        { keys: ['Enter', 'Space'], description: 'Select the active tab.' },
    ],
    accessibility: {
        roles: "A tablist of tabs with aria-selected; the panel each tab controls is the consumer's. Icons are aria-hidden.",
        labels: 'label names the list; each tab is named by its visible label.',
        focus: 'Roving: only the active tab is in the tab order.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-tabs', description: 'Every option is a tab in a labelled tablist.' },
        { id: 'selected-tab', description: 'The tab whose value matches is selected.' },
        { id: 'click-selects', description: 'Clicking a tab calls onChange with its value.' },
        { id: 'disabled-tab', description: 'A disabled tab is marked and clicking it changes nothing.' },
        { id: 'arrow-keys', description: 'ArrowRight and ArrowLeft move the active tab, skipping disabled tabs.' },
        { id: 'enter-space-select', description: 'Enter or Space selects the active tab.' },
        { id: 'needs-two', description: 'With fewer than two options nothing renders.' },
        { id: 'badge', description: 'A badge count renders on its tab.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
