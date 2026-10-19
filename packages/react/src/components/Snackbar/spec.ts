import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Snackbar',
    summary: 'A brief message about something the user did, shown over the page until it is dismissed or times out.',
    anatomy: [
        { part: 'container', description: 'Rendered in a portal at the end of the document while open.' },
        {
            part: 'content',
            role: 'alert',
            description: 'The icon, the text and the dismiss button. Holds focus while open.',
        },
        { part: 'icon', description: 'Optional, decorative.' },
        { part: 'text', description: 'The message, truncated to its line.' },
        {
            part: 'dismiss button',
            role: 'button',
            description: 'Labelled "Dismiss" unless closeButtonLabel says otherwise; calls onClose.',
        },
    ],
    keyboard: [
        { keys: ['Tab', 'Shift+Tab'], description: 'Stay within the snackbar while it is open.' },
        { keys: ['Enter', 'Space'], description: 'On the dismiss button, dismiss the snackbar.' },
    ],
    accessibility: {
        roles: 'The content is role alert, so the text is announced when it appears. The icon is aria-hidden.',
        labels: 'The text is the message. The dismiss button has a visible label.',
        focus: 'Focus moves into the snackbar when it opens and is held there; a snackbar with no dismiss button and no timeout cannot be dismissed, so give it one of the two.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'closed-by-default', description: 'Nothing renders until open is true.' },
        { id: 'shows-text', description: 'With open true, the text renders in an alert.' },
        { id: 'dismiss-button', description: 'The dismiss button calls onClose, and closeButtonLabel renames it.' },
        { id: 'no-dismiss-button', description: 'closeButton false renders no button.' },
        { id: 'auto-dismiss', description: 'With a timeout, onClose is called after that many milliseconds.' },
        { id: 'icon-decorative', description: 'The icon renders aria-hidden.' },
        { id: 'focus-moves-in', description: 'Focus moves into the snackbar when it opens.' },
        {
            id: 'managed',
            description:
                'sendSnackbar shows a snackbar through SnackbarManager, a string is its text, and clearSnackbar removes it.',
        },
        { id: 'axe-clean', description: 'An open snackbar passes axe-core.' },
    ],
};
