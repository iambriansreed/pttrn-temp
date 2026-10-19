import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'EmptyState',
    summary: 'A centered message for a place with nothing to show yet, with an optional illustration and a next step.',
    anatomy: [
        { part: 'container', description: 'A vertical stack, centered.' },
        { part: 'illustration', description: 'The children, an image or icon above the text.' },
        { part: 'header', description: 'The header, styled as a small heading.' },
        { part: 'body', description: 'The body text.' },
        {
            part: 'call to action',
            role: 'button',
            description: 'A primary button named by callToAction.label; medium unless its size says otherwise.',
        },
    ],
    keyboard: [{ keys: ['Enter', 'Space'], description: 'On the call to action, activate it.' }],
    accessibility: {
        roles: 'Plain text in a group. The header is styled as a heading but is not a heading element, so it does not change the page outline.',
        labels: 'The header and body are the content. An illustration is decorative, so give it an empty alt or aria-hidden; the text carries the meaning.',
        focus: 'Only the call to action is focusable.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'renders-text', description: 'The header and body render.' },
        { id: 'illustration', description: 'The children render above the text.' },
        {
            id: 'call-to-action',
            description: 'callToAction renders a primary button with its label and size that calls its onClick.',
        },
        { id: 'no-call-to-action', description: 'Without callToAction there is no button.' },
        {
            id: 'body-align',
            description: 'bodyAlign left aligns the text to the start; center is the default.',
        },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
