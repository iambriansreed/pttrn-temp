import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Dialog',
    summary:
        'A layer over the page that holds focus until it is dismissed; Modal builds its standard header and footer on top of it.',
    anatomy: [
        {
            part: 'container',
            description:
                'Positions the dialog (center, top, bottom, left or right) over the page or inside a container element.',
        },
        {
            part: 'dialog',
            role: 'dialog',
            description:
                'The box with the content. Modal, with aria-modal, and named by the consumer through aria-labelledby or aria-label.',
        },
        {
            part: 'scrim',
            description: 'Dims the page behind the dialog; clicking it closes the dialog. Hidden with showScrim false.',
        },
    ],
    keyboard: [
        { keys: ['Escape'], description: 'Closes the dialog.' },
        {
            keys: ['Tab', 'Shift+Tab'],
            description: "Cycle through the dialog's controls; focus does not leave the dialog.",
        },
    ],
    accessibility: {
        roles: 'The box is role dialog with aria-modal true; the positioning container is presentational. The scrim is aria-hidden.',
        labels: 'The consumer names the dialog: aria-labelledby with the id of its heading, or aria-label. Modal passes its header.',
        focus: 'Focus moves into the dialog when it opens, is held there while it is open, and returns to the element that opened it when it closes. Page scrolling is locked while open.',
    },
    behaviors: [
        { id: 'closed-by-default', description: 'Nothing renders until open is true.' },
        { id: 'opens', description: 'With open true, the dialog renders its content in a portal.' },
        { id: 'escape-closes', description: 'Escape calls onClose.' },
        { id: 'scrim-closes', description: 'Clicking the scrim calls onClose.' },
        { id: 'hide-scrim', description: 'showScrim false renders the scrim hidden.' },
        {
            id: 'labelled',
            description:
                'aria-label, aria-labelledby, aria-describedby and aria-description land on the dialog element.',
        },
        { id: 'placement', description: 'The container carries the placement; center by default.' },
        {
            id: 'focus-moves-in',
            description: 'Focus moves into the dialog when it opens and returns to the opener when it closes.',
        },
        {
            id: 'scroll-lock',
            description: 'The page cannot scroll while the dialog is open, and can again once it closes.',
        },
        { id: 'axe-clean', description: 'An open, labelled dialog passes axe-core.' },
    ],
};
