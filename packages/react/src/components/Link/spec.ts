import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Link',
    summary: 'A standalone link with an optional trailing icon; an external link opens a new tab and says so.',
    anatomy: [
        { part: 'link', role: 'link', description: 'A native anchor in one of three sizes, default or subtle.' },
        { part: 'label', description: 'The visible text.' },
        { part: 'trailing icon', description: 'Optional: chevron, external or link. Decorative, loaded on demand.' },
    ],
    keyboard: [{ keys: ['Enter'], description: 'Follows the link.' }],
    accessibility: {
        roles: 'A native link; the icon is aria-hidden.',
        labels: 'The label is the name. An external link adds "(opens in a new tab)" for assistive technology, since it changes context.',
        focus: 'Native focus.',
    },
    behaviors: [
        { id: 'renders-link', description: 'A link named by its label points at href.' },
        { id: 'external', description: 'trailingIcon external opens in a new tab and says so in the accessible name.' },
        { id: 'target', description: 'target is _self by default and respected otherwise.' },
        {
            id: 'trailing-icon',
            description: 'The trailing icon renders after the label, hidden from assistive technology.',
        },
        { id: 'variants', description: 'size and variant are reflected in the attributes.' },
        { id: 'axe-clean', description: 'A link with an external icon passes axe-core.' },
    ],
};
