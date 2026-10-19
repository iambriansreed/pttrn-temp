import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { FileUpload, FileUploadProps } from './FileUpload';
import { presets } from './FileUploadExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { fireEvent, render, screen, within } from '-/rtl/util';
import { FileEntry } from '-/utils/fileUploads';

const MB = 1048576;
const png = (name: string, bytes = 1024) => new File(['x'.repeat(bytes)], name, { type: 'image/png' });

const Subject = (props: Partial<FileUploadProps>) => (
    <FileUpload onCancel={() => {}} onError={() => {}} onUpload={() => {}} {...props} />
);

const zone = () => document.querySelector('[data-pttrn="file-upload"]') as HTMLElement;
const fileInput = () => zone().querySelector('input[type="file"]') as HTMLInputElement;
const browse = () => screen.getByRole('button', { name: 'Browse' });
const items = () => Array.from(document.querySelectorAll<HTMLElement>('[data-pttrn="file-upload-item"]'));

const UPLOADING: FileEntry = { id: 'u1', fileName: 'photo.png', fileSize: 1.5, status: 'uploading', progress: 40 };
const FAILED: FileEntry = {
    id: 'f1',
    fileName: 'notes.txt',
    fileSize: 1,
    status: 'error',
    errorMessage: 'Not allowed',
};
const COMPLETE: FileEntry = { id: 'c1', fileName: 'done.pdf', fileSize: 0.5, status: 'complete', progress: 100 };

describe('FileUpload (RTL)', () => {
    presets.forEach((preset) => {
        it(
            `has no basic a11y issues - ${preset.label}`,
            hasNoBasicA11yIssues(
                <FileUpload onCancel={() => {}} onError={() => {}} onUpload={() => {}} {...preset.propState} />,
            ),
        );
    });
});

describeBehaviors(spec, {
    'renders-zone': () => {
        const { rerender } = render(<Subject uploadSubtitle="PNG or GIF (max. 2MB)" />);

        expect(zone()).toHaveTextContent('Upload a File');
        expect(screen.getByText('PNG or GIF (max. 2MB)')).toBeInTheDocument();
        expect(browse()).toBeInTheDocument();
        expect(zone().querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

        expect(fileInput()).not.toBeVisible();
        expect(fileInput()).not.toHaveAttribute('multiple');
        rerender(<Subject acceptedFileTypes={['image/png', 'image/gif']} />);
        expect(fileInput()).toHaveAttribute('accept', 'image/png, image/gif');

        // A second FileUpload on the page keeps its own input id.
        render(<Subject />);
        const [first, second] = Array.from(document.querySelectorAll('input[type="file"]'));
        expect(first.id).toBeTruthy();
        expect(first.id).not.toBe(second.id);
    },
    browse: async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        render(<Subject />);
        fileInput().addEventListener('click', onClick);

        await user.tab();
        expect(browse()).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(1);

        await user.click(browse());
        expect(onClick).toHaveBeenCalledTimes(2);
    },
    'uploads-selection': async () => {
        const user = userEvent.setup();
        const onUpload = jest.fn();
        const onError = jest.fn();
        render(<Subject onError={onError} onUpload={onUpload} />);

        const file = png('photo.png');
        await user.upload(fileInput(), file);

        expect(onError).not.toHaveBeenCalled();
        expect(onUpload).toHaveBeenCalledTimes(1);
        expect(onUpload).toHaveBeenCalledWith([
            {
                id: expect.any(String),
                fileName: 'photo.png',
                fileSize: 1024 / MB,
                status: 'idle',
                progress: 0,
                errorMessage: '',
                file,
            },
        ]);

        const [item] = items();
        expect(item).toHaveTextContent('photo.png');
        expect(item).toHaveTextContent('1 KB • idle');
        expect(within(item).getByRole('progressbar', { name: '0%' })).toHaveAttribute('aria-valuenow', '0');
    },
    'rejects-type': async () => {
        // user-event would drop the file itself for the input's accept list; the component must do the rejecting.
        const user = userEvent.setup({ applyAccept: false });
        const onUpload = jest.fn();
        const onError = jest.fn();
        render(<Subject acceptedFileTypes={['image/png']} onError={onError} onUpload={onUpload} />);

        const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
        await user.upload(fileInput(), file);

        expect(onUpload).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith([
            expect.objectContaining({
                fileName: 'notes.txt',
                status: 'error',
                errorMessage: 'File type not accepted: notes.txt',
                file,
            }),
        ]);

        const [item] = items();
        expect(within(item).getByRole('alert')).toHaveTextContent('File type not accepted: notes.txt');
        expect(within(item).queryByRole('progressbar')).not.toBeInTheDocument();
        expect(item).toHaveTextContent('• error');
    },
    'rejects-size': async () => {
        const user = userEvent.setup();
        const onUpload = jest.fn();
        const onError = jest.fn();
        render(<Subject maxFileSize={1} onError={onError} onUpload={onUpload} />);

        await user.upload(fileInput(), png('big.png', MB + 1));
        expect(onUpload).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledWith([
            expect.objectContaining({
                fileName: 'big.png',
                status: 'error',
                errorMessage: 'File too large. Please upload a smaller file: big.png',
            }),
        ]);
        expect(screen.getByRole('alert')).toHaveTextContent('File too large. Please upload a smaller file: big.png');

        await user.upload(fileInput(), png('fits.png', MB));
        expect(onUpload).toHaveBeenCalledWith([expect.objectContaining({ fileName: 'fits.png', status: 'idle' })]);
        expect(onError).toHaveBeenCalledTimes(1);
    },
    'multiple-files': async () => {
        const user = userEvent.setup();
        const onUpload = jest.fn();
        render(<Subject multipleFiles onUpload={onUpload} />);

        expect(zone()).toHaveTextContent('Upload Files');
        expect(fileInput()).toHaveAttribute('multiple');

        await user.upload(fileInput(), [png('a.png'), png('b.png')]);
        expect(onUpload).toHaveBeenCalledTimes(1);
        expect(onUpload).toHaveBeenCalledWith([
            expect.objectContaining({ fileName: 'a.png' }),
            expect.objectContaining({ fileName: 'b.png' }),
        ]);
        expect(items().map((item) => item.querySelector('[data-file-name]')?.textContent)).toEqual(['a.png', 'b.png']);
    },
    'drag-and-drop': () => {
        const onUpload = jest.fn();
        const { rerender } = render(<Subject dragAndDrop onUpload={onUpload} />);
        const file = png('dropped.png');

        expect(zone()).toHaveTextContent('Drag and Drop');
        fireEvent.dragOver(zone());
        expect(zone()).toHaveClass('drag-over');
        fireEvent.dragLeave(zone());
        expect(zone()).not.toHaveClass('drag-over');

        fireEvent.dragOver(zone());
        fireEvent.drop(zone(), { dataTransfer: { files: [file] } });
        expect(zone()).not.toHaveClass('drag-over');
        expect(onUpload).toHaveBeenCalledWith([expect.objectContaining({ fileName: 'dropped.png', file })]);
        expect(items()).toHaveLength(1);

        // Without dragAndDrop the zone ignores drags and drops.
        onUpload.mockClear();
        rerender(<Subject onUpload={onUpload} />);
        fireEvent.dragOver(zone());
        expect(zone()).not.toHaveClass('drag-over');
        fireEvent.drop(zone(), { dataTransfer: { files: [png('ignored.png')] } });
        expect(onUpload).not.toHaveBeenCalled();
        expect(items()).toHaveLength(1);
    },
    'lists-files': () => {
        render(<Subject files={[FAILED, UPLOADING, COMPLETE]} />);

        // By name, with failed files after the rest.
        const [done, photo, notes] = items();
        expect(done).toHaveTextContent('done.pdf');
        expect(done).toHaveTextContent('512 KB • complete');
        expect(within(done).getByRole('progressbar', { name: '100%' })).toHaveAttribute('aria-valuenow', '100');
        expect(within(done).getByRole('progressbar')).toHaveAttribute('aria-busy', 'false');

        expect(photo).toHaveTextContent('photo.png');
        expect(photo).toHaveTextContent('1.5 MB • uploading');
        expect(within(photo).getByRole('progressbar', { name: '40%' })).toHaveAttribute('aria-valuenow', '40');
        expect(within(photo).getByRole('progressbar')).toHaveAttribute('aria-busy', 'true');

        expect(notes).toHaveTextContent('notes.txt');
        expect(notes).toHaveTextContent('1 MB • error');
        expect(within(notes).getByRole('alert')).toHaveTextContent('Not allowed');
        expect(within(notes).queryByRole('progressbar')).not.toBeInTheDocument();
        expect(document.querySelector('[data-file-entries]')).toHaveAttribute('data-pttrn-owner', 'file-upload');
    },
    'zone-error': () => {
        // Fresh mounts rather than rerenders: a changed files prop sends the merge effect into an endless re-render.
        const first = render(<Subject files={[FAILED]} />);
        expect(within(zone()).getByRole('alert')).toHaveTextContent('Not allowed');
        expect(screen.getAllByRole('alert')).toHaveLength(2);
        first.unmount();

        const second = render(<Subject files={[{ ...FAILED, errorMessage: undefined }]} />);
        expect(within(zone()).getByRole('alert')).toHaveTextContent(
            'There was an error uploading the file. Please try again.',
        );
        second.unmount();

        render(<Subject files={[FAILED, UPLOADING]} />);
        expect(within(zone()).queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getAllByRole('alert')).toHaveLength(1);
    },
    cancel: async () => {
        const user = userEvent.setup();
        const onCancel = jest.fn();
        const { rerender } = render(<Subject files={[UPLOADING]} onCancel={onCancel} />);

        await user.click(screen.getByRole('button', { name: 'Cancel photo.png' }));
        expect(onCancel).toHaveBeenCalledWith({ fileName: 'photo.png' });

        rerender(<Subject cancelButtonLabel="Remove" files={[UPLOADING]} onCancel={onCancel} />);
        expect(screen.queryByRole('button', { name: /^Cancel/ })).not.toBeInTheDocument();
        screen.getByRole('button', { name: 'Remove photo.png' }).focus();
        await user.keyboard('{Enter}');
        expect(onCancel).toHaveBeenCalledTimes(2);
        expect(onCancel).toHaveBeenLastCalledWith({ fileName: 'photo.png' });
    },
    'tracks-files-prop': () => {
        const { rerender } = render(<Subject files={[UPLOADING]} />);
        expect(screen.getByRole('progressbar', { name: '40%' })).toBeInTheDocument();

        rerender(<Subject files={[{ ...UPLOADING, progress: 80 }]} />);
        expect(screen.getByRole('progressbar', { name: '80%' })).toHaveAttribute('aria-valuenow', '80');
        expect(items()).toHaveLength(1);

        rerender(<Subject files={[{ ...UPLOADING, status: 'complete', progress: 100 }, COMPLETE]} />);
        expect(items()).toHaveLength(2);
        expect(items().map((item) => item.textContent)).toEqual([
            expect.stringContaining('done.pdf'),
            expect.stringContaining('photo.png'),
        ]);
        expect(screen.getAllByRole('progressbar', { name: '100%' })).toHaveLength(2);
    },
    'axe-clean': async () => {
        for (const preset of presets) {
            await hasNoBasicA11yIssues(<Subject {...preset.propState} />)();
        }
        await hasNoBasicA11yIssues(<Subject files={[FAILED, UPLOADING]} />)();
        await hasNoBasicA11yIssues(<Subject files={[FAILED]} />)();
    },
});
