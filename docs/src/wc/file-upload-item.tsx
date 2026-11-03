import '@ptrn/web/FileUploadItem';
import { FileUploadItemProps } from '@ptrn/react/FileUploadItem';
import { ComponentType, useEffect, useState } from 'react';
import { version as webVersion } from '../../../packages/web/package.json';
import { WebComponentDemo } from 'src/wc/types';

/** The element as a React component for the demo. */
const PttrnFileUploadItem = 'pttrn-file-upload-item' as unknown as ComponentType<any>;

type Props = Partial<FileUploadItemProps>;

/** The demo state as the element's attributes. */
const attributes = ({ id, fileName, fileSize, status, progress, errorMessage, cancelButtonLabel }: Props) => ({
    id,
    'file-name': fileName,
    'file-size': fileSize,
    status,
    progress,
    'error-message': errorMessage,
    'cancel-button-label': cancelButtonLabel,
});

/**
 * The demo state rendered as the element. Like the React example, a completed upload shows 100% and an uploading one
 * advances by a random step every second.
 */
function FileUploadItemWc(props: Props) {
    const start = props.status === 'complete' ? 100 : (props.progress ?? 0);
    const [progress, setProgress] = useState(start);

    useEffect(() => setProgress(start), [start]);

    useEffect(() => {
        if (props.status !== 'uploading' || progress >= 100) return;
        const timer = setTimeout(() => setProgress(Math.round(Math.min(progress + Math.random() * 20, 100))), 1000);
        return () => clearTimeout(timer);
    }, [props.status, progress]);

    return <PttrnFileUploadItem {...attributes({ ...props, progress })} />;
}

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The HTML a Web Component user writes for the current demo state. */
function fileUploadItemToHtml(props: Props) {
    const attrs = Object.entries(attributes(props))
        .filter(
            ([name, value]) =>
                value !== undefined && value !== '' && !(name === 'cancel-button-label' && value === 'Cancel'),
        )
        .map(([name, value]) => `${name}="${escape(String(value))}"`);
    return `<pttrn-file-upload-item ${attrs.join(' ')}></pttrn-file-upload-item>`;
}

const USAGE = `<script type="module" src="https://cdn.jsdelivr.net/npm/@ptrn/web@${webVersion}/dist/cdn/pttrn-web.min.js"></script>

<pttrn-file-upload-item
    id="dunder"
    file-name="dunder-mifflin-paper-co.jpg"
    file-size="1.43"
    status="uploading"
    progress="40"
></pttrn-file-upload-item>

<script>
    document.getElementById('dunder').addEventListener('pttrn-cancel', (event) => {
        console.log('Cancel', event.detail.fileName);
    });
</script>`;

export const fileUploadItemWc: WebComponentDemo = {
    tag: 'pttrn-file-upload-item',
    usage: USAGE,
    usageDescription:
        'No React needed. Load the elements from the CDN as shown, or run `npm install @ptrn/web` and import the component you need. Also load the `@ptrn/styles` tokens and a theme on the page so the elements pick up the design tokens. The cancel button fires `pttrn-cancel` with the file name.',
    Wrapper: FileUploadItemWc,
    toHtml: fileUploadItemToHtml,
};
