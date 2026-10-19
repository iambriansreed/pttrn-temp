import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'ProgressionStepper',
    summary:
        'An ordered list of the steps in a process that marks which are done and which is current, as a horizontal or vertical trail or as a compact widget with a header.',
    anatomy: [
        { part: 'container', description: 'A div carrying data-variant; extra props land on it.' },
        { part: 'list', role: 'list', description: 'An ordered list with one item per step.' },
        {
            part: 'step',
            role: 'listitem',
            description:
                'Carries its number as data-step and data-status complete, current or incomplete; the current one is aria-current step.',
        },
        {
            part: 'circle',
            description:
                'The step number in a ring, joined to its neighbors by lines; a completed step shows an aria-hidden check instead, and in the widget only the current step shows its number.',
        },
        {
            part: 'content',
            description: 'The name and the optional subtext, in the horizontal and vertical variants only.',
        },
        {
            part: 'header',
            description:
                'Widget only: the current step\'s name over its subtext, "Step N of M" without one, or "Completed" once every step is done.',
        },
    ],
    keyboard: [],
    accessibility: {
        roles: 'A plain ordered list with no interactive parts: list items, the current one with aria-current step. The check on a completed step is aria-hidden, so completion is not announced and assistive technology reads a completed step by its place before the current one.',
        labels: 'In the horizontal and vertical variants an item reads its number (none once complete), its name and its subtext. In the widget the items carry only the current step\'s number and the header holds the current name with its subtext or "Step N of M". The component has no name or landmark of its own, so introduce it with a heading or a labelled region; aria-label on the container div has no role to attach to.',
        focus: 'Never focusable.',
    },
    behaviors: [
        {
            id: 'renders-steps',
            description:
                'Each step is a list item in an ordered list, numbered in order, with its name and its subtext when given.',
        },
        {
            id: 'step-status',
            description:
                'completedStep marks the steps up to it complete, the next one current and the rest incomplete, as data-status; none is complete by default.',
        },
        { id: 'current-step', description: 'Only the current step carries aria-current step.' },
        { id: 'complete-check', description: 'A completed step shows an aria-hidden check in place of its number.' },
        {
            id: 'clamps',
            description:
                'A completedStep below zero completes nothing and one past the last step completes every step, leaving none current.',
        },
        {
            id: 'widget-header',
            description:
                'The widget variant adds a header with the current step\'s name and its subtext, or "Step N of M", or "Completed" once every step is done.',
        },
        {
            id: 'widget-list',
            description: 'In the widget variant the items show no names and only the current step shows its number.',
        },
        { id: 'variants', description: 'variant is reflected as data-variant; horizontal is the default.' },
        { id: 'empty', description: 'With no steps nothing renders.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
