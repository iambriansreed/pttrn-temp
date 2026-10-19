import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'Modal',
    summary: 'A Dialog with a standard header, close button and footer, for information the user has to acknowledge.',
    anatomy: [
        {
            part: 'dialog',
            role: 'dialog',
            description: 'The Dialog underneath: modal, named by the header and described by the description.',
        },
        { part: 'header', description: 'The title and the close button.' },
        { part: 'close button', role: 'button', description: 'Labelled "close"; calls onClose.' },
        { part: 'main', description: 'The content.' },
        {
            part: 'footer',
            description:
                'The call to action and, next to it, the cancel button. Rendered only when there is a call to action.',
        },
    ],
    keyboard: [
        { keys: ['Escape'], description: 'Closes the modal.' },
        {
            keys: ['Tab', 'Shift+Tab'],
            description: 'Cycle through the close button, the content and the footer buttons.',
        },
    ],
    accessibility: {
        roles: 'Inherits Dialog: role dialog with aria-modal true.',
        labels: 'The header is the accessible name (aria-label) and the description is the accessible description (aria-description); both are required.',
        focus: 'Inherits Dialog: focus moves in on open, is held, and returns to the opener on close.',
        targetSize: 44,
    },
    behaviors: [
        { id: 'closed-by-default', description: 'Nothing renders until open is true.' },
        {
            id: 'header-and-description',
            description: 'The dialog is named by the header and described by the description.',
        },
        { id: 'close-button', description: 'The close button calls onClose.' },
        { id: 'call-to-action', description: 'The call to action renders in the footer and calls its onClick.' },
        {
            id: 'cancel-button',
            description:
                'With a call to action, cancelButton adds a cancel button that calls onClose; a string sets its label.',
        },
        { id: 'no-footer', description: 'Without a call to action there is no footer.' },
        { id: 'escape-closes', description: 'Escape calls onClose.' },
        { id: 'focus-moves-in', description: 'Focus moves into the modal when it opens.' },
        { id: 'axe-clean', description: 'An open modal passes axe-core.' },
    ],
};
