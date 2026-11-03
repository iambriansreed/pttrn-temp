import '@ptrn/web/FileUpload';
import { FileUploadProps } from '@ptrn/react/FileUpload';
import { FileEntry } from '@ptrn/react/utils/fileUploads';
import { ComponentType, useEffect, useRef } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnFileUploadElement = 'pttrn-file-upload' as unknown as ComponentType<any>;

type Props = Partial<FileUploadProps>;

/** What the React example fixes for every state: the image types, a 1 MB limit and the subtitle that names them. */
const EXAMPLE = {
    accept: 'image/png, image/gif, image/svg+xml, image/jpeg',
    'max-file-size': 1,
    'upload-subtitle': 'SVG, PNG, JPG or GIF (max. 1MB)',
};

const flag = (on?: boolean) => (on ? '' : undefined);

/**
 * The demo state as the element. Like the React example it fakes the upload: each accepted file starts uploading in
 * turn and climbs to complete, reported back through the `files` property.
 */
function FileUploadWc({ dragAndDrop, multipleFiles }: Props) {
    const ref = useRef<HTMLElement & { files: FileEntry[] }>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const timers: number[] = [];
        const update = (entry: FileEntry) => {
            element.files = [...element.files.filter((file) => file.id !== entry.id), entry];
        };
        const onUpload = (event: Event) => {
            const { files } = (event as CustomEvent<{ files: FileEntry[] }>).detail;
            files.forEach((file, index) => {
                timers.push(
                    window.setTimeout(() => {
                        const entry: FileEntry = { ...file, status: 'uploading', progress: 0 };
                        update({ ...entry });
                        const interval = window.setInterval(() => {
                            entry.progress = Math.min((entry.progress || 0) + 10 + Math.round(Math.random() * 5), 100);
                            if (entry.progress === 100) {
                                window.clearInterval(interval);
                                entry.status = 'complete';
                            }
                            update({ ...entry });
                        }, 350);
                        timers.push(interval);
                    }, index * 400),
                );
            });
        };
        element.addEventListener('pttrn-upload', onUpload);
        return () => {
            element.removeEventListener('pttrn-upload', onUpload);
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, []);

    return (
        <PttrnFileUploadElement
            {...EXAMPLE}
            drag-and-drop={flag(dragAndDrop)}
            multiple={flag(multipleFiles)}
            name="attachments"
            ref={ref}
        />
    );
}

/** The HTML a Web Component user writes for the current demo state. */
function fileUploadToHtml({ dragAndDrop, multipleFiles }: Props) {
    const attrs = [
        'name="attachments"',
        dragAndDrop && 'drag-and-drop',
        multipleFiles && 'multiple',
        ...Object.entries(EXAMPLE).map(([name, value]) => `${name}="${value}"`),
    ].filter(Boolean);
    return `<pttrn-file-upload ${attrs.join(' ')}></pttrn-file-upload>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<form>
    <pttrn-file-upload
        name="attachments"
        drag-and-drop
        multiple
        accept="image/png, image/gif, image/svg+xml"
        max-file-size="5"
        upload-subtitle="SVG, PNG, JPG or GIF (max. 5MB)"
    ></pttrn-file-upload>
</form>

<script>
    const upload = document.querySelector('pttrn-file-upload');
    // Send the accepted files, then report progress through the files property.
    upload.addEventListener('pttrn-upload', (event) => {
        upload.files = event.detail.files.map((entry) => ({ ...entry, status: 'uploading', progress: 50 }));
    });
    upload.addEventListener('pttrn-error', (event) => console.log('Rejected', event.detail.files));
</script>`;

export const fileUploadWc: WebComponentDemo = {
    tag: 'pttrn-file-upload',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. It is a form control: in a form it submits the accepted files under its `name`.',
    Wrapper: FileUploadWc,
    toHtml: fileUploadToHtml,
};
