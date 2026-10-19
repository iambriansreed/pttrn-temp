import { ComponentSpec } from '-/types/meta';

export const spec: ComponentSpec = {
    name: 'FileUpload',
    summary:
        'A drop zone with a Browse button that takes one or more files, rejects the wrong type or size, hands the rest to onUpload and lists every file with its progress or error.',
    anatomy: [
        {
            part: 'zone',
            description:
                'A dashed box with a cloud icon, a title ("Upload a File", "Upload Files" or "Drag and Drop"), the uploadSubtitle and the Browse button. With dragAndDrop it carries the drag-over class while files hover it.',
        },
        {
            part: 'file input',
            description:
                'A hidden native input of type file with accept from acceptedFileTypes and multiple from multipleFiles; Browse opens it.',
        },
        { part: 'browse button', role: 'button', description: 'Labelled "Browse"; opens the file picker.' },
        {
            part: 'zone alert',
            role: 'alert',
            description:
                'When the only entry in files has failed, its error message, or the default one, inside the zone.',
        },
        {
            part: 'file list',
            description:
                'A FileUploadItem per file, failed files last and the rest by name, each with a progressbar or an error alert and a cancel button.',
        },
    ],
    keyboard: [
        {
            keys: ['Tab'],
            description: 'Moves to the Browse button, then through the cancel buttons of the listed files.',
        },
        {
            keys: ['Enter', 'Space'],
            description: 'On Browse, open the file picker; on a cancel button, call onCancel.',
        },
    ],
    accessibility: {
        roles: 'The zone is a plain container with no role: the title and subtitle are text and the icon is aria-hidden. The native file input is hidden and driven by Browse, a native button. Each listed file has a progressbar whose aria-valuenow is its progress, or an alert with its error; when the only file has failed the zone announces that alert too.',
        labels: 'Browse is named by its label and each cancel button by cancelButtonLabel ("Cancel" by default) through its tooltip; the progress bar is named by its percentage. The accept list is never read aloud, so name the accepted types and the size limit in uploadSubtitle.',
        focus: 'Native focus on the Browse button and on each cancel button; the hidden input is not in the tab order. Nothing moves focus. Dragging is a pointer-only shortcut, with Browse as the alternative.',
        targetSize: 44,
    },
    behaviors: [
        {
            id: 'renders-zone',
            description:
                'The zone shows the title, uploadSubtitle and a Browse button over a hidden file input that carries accept and its own id; the icon is decorative.',
        },
        { id: 'browse', description: 'Clicking Browse, or pressing Enter on it, clicks the hidden file input.' },
        {
            id: 'uploads-selection',
            description:
                'A chosen file that passes the checks reaches onUpload as an entry with an id, its name, its size in MB, status idle and the File, and is listed at 0%.',
        },
        {
            id: 'rejects-type',
            description:
                'A file outside acceptedFileTypes reaches onError, not onUpload, with status error and "File type not accepted: name", and is listed with that alert.',
        },
        {
            id: 'rejects-size',
            description:
                'A file above maxFileSize MB reaches onError with "File too large. Please upload a smaller file: name"; one at the limit uploads.',
        },
        {
            id: 'multiple-files',
            description:
                'multipleFiles titles the zone "Upload Files", lets the input take several files and sends them to onUpload in one call.',
        },
        {
            id: 'drag-and-drop',
            description:
                'dragAndDrop titles the zone "Drag and Drop", marks it drag-over while files hover and takes dropped files; without it drops are ignored.',
        },
        {
            id: 'lists-files',
            description:
                'Entries in files render as items with name, size and status, a progressbar at their progress (busy below 100) or an alert with their error, failed files last.',
        },
        {
            id: 'zone-error',
            description:
                'When the only entry in files has failed, the zone shows its message, or the default one, as an alert.',
        },
        {
            id: 'cancel',
            description:
                'Each item has a cancel button named by cancelButtonLabel that calls onCancel with the file name.',
        },
        { id: 'axe-clean', description: 'Every preset passes axe-core, as does a list with a failed file.' },
    ],
};
