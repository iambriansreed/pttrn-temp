import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'FileUploadItem',
    summary:
        'One file in an upload list: its name, size and status over a progress bar or an error alert, with a button that cancels it.',
    anatomy: [
        {
            part: 'container',
            description: 'A plain block with no role: a row for the file and a status line under it.',
        },
        { part: 'icon', description: 'A document icon, decorative.' },
        {
            part: 'file name',
            description:
                'The name, through Truncated: cut to its line with the full name in a tooltip when it does not fit.',
        },
        {
            part: 'details',
            description:
                'The size, formatted from MB ("512 KB", "1.2 MB", "1.5 GB", or "Unknown size" when missing), then the status after a bullet.',
        },
        {
            part: 'cancel button',
            role: 'button',
            description:
                'A large tertiary icon-only button whose tooltip is cancelButtonLabel, "Cancel" by default, and whose name adds the file: "Cancel holiday-photo.png". Calls onCancel with the file name.',
        },
        {
            part: 'progress',
            role: 'progressbar',
            description:
                'A left-aligned ProgressBar at progress, labelled with the rounded percentage, for every status but error.',
        },
        {
            part: 'error alert',
            role: 'alert',
            description:
                'When status is error, an InlineAlert in the error variant with errorMessage, or "There was an error uploading the file. Please try again."',
        },
    ],
    keyboard: [
        { keys: ['Tab'], description: 'Moves to the cancel button, the only stop.' },
        { keys: ['Enter', 'Space'], description: 'On the cancel button, call onCancel.' },
    ],
    accessibility: {
        roles: 'The container has no role. The status line holds a native progress element, role progressbar with aria-valuenow at the rounded progress and aria-busy until it reaches 100, or, when status is error, an alert that announces the message when it appears. The cancel button is a native button; both icons are aria-hidden.',
        labels: 'The name and details are text. The cancel button is named by cancelButtonLabel followed by the file name, so each button in a list says which file it cancels and the name still starts with the visible tooltip text. The progress bar is named by its percentage and follows the file name in reading order.',
        focus: 'Native focus on the cancel button only; nothing moves focus. The alert and the progress bar are never focusable.',
        targetSize: 44,
        motion: 'Only the progress fill animates, through ProgressBar: its width over 0.3s. Nothing else moves.',
    },
    behaviors: [
        {
            id: 'renders-file',
            description: 'The file name and the size with the status render as text, over the status line.',
        },
        {
            id: 'formats-size',
            description:
                'fileSize in MB reads in KB below one MB, MB below one GB and GB past it, rounded up to two decimals; a missing size reads "Unknown size", and without a status the details are the size alone.',
        },
        {
            id: 'progress',
            description:
                'A progressbar named by the rounded percentage carries aria-valuenow at the progress, clamped to 0..100, aria-busy below 100 and not at 100; progress defaults to 0.',
        },
        {
            id: 'error-alert',
            description:
                'status error replaces the progressbar with an error alert holding errorMessage, or the default message.',
        },
        {
            id: 'cancel',
            description: 'The cancel button, named "Cancel <file name>" by default, calls onCancel with the file name.',
        },
        {
            id: 'cancel-label',
            description:
                'cancelButtonLabel is the tooltip and starts the button name; an empty label falls back to "Cancel".',
        },
        { id: 'keyboard', description: 'Tab reaches the cancel button alone, and Enter or Space calls onCancel.' },
        { id: 'icon-decorative', description: 'The file icon and the button icon render aria-hidden.' },
        { id: 'axe-clean', description: 'Every preset passes axe-core.' },
    ],
};
