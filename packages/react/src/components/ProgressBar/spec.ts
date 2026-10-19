import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'ProgressBar',
    summary: 'A horizontal bar that shows how far a task has come, from 0 to 100, with a label.',
    anatomy: [
        { part: 'container', description: 'The bar and its label, large or small, label centered or to the left.' },
        {
            part: 'progress',
            role: 'progressbar',
            description: 'A native progress element with max 100 and the completion as its value.',
        },
        { part: 'bar', description: 'The visual fill, sized by the completion, aria-hidden.' },
        { part: 'label', description: 'A label element that names the progress element.' },
    ],
    keyboard: [],
    accessibility: {
        roles: 'A native progress element, so role progressbar with aria-valuemin 0, aria-valuemax 100 and aria-valuenow the completion. It is aria-busy until the completion reaches 100.',
        labels: 'The label prop names the progress element through a label element; it is the only name, so say what is progressing.',
        focus: 'Never focusable.',
        motion: 'The fill animates its width over 0.3s; the value is exposed either way.',
    },
    behaviors: [
        { id: 'renders-label', description: 'The label is the name of the progressbar.' },
        { id: 'value', description: 'The completion, rounded, is the value and aria-valuenow, between 0 and 100.' },
        { id: 'clamps', description: 'A completion below 0 reads 0 and one above 100 reads 100.' },
        { id: 'busy', description: 'The progressbar is aria-busy below 100 and not at 100.' },
        { id: 'layout', description: 'size and align are reflected as attributes; large and center are the defaults.' },
        {
            id: 'success',
            description:
                'successColor marks a complete bar as success, and successHidden renders nothing once complete.',
        },
        { id: 'axe-clean', description: 'A bar in progress and a complete bar pass axe-core.' },
    ],
};
