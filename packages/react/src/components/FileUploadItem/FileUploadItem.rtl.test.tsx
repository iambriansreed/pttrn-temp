import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { FileUploadItem, FileUploadItemProps } from './FileUploadItem';
import { presets } from './FileUploadItemExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen, waitFor } from '-/rtl/util';

const Subject = (props: Partial<FileUploadItemProps>) => (
    <FileUploadItem
        fileName="holiday-photo.png"
        fileSize={1.2}
        id="photo"
        onCancel={() => {}}
        progress={40}
        status="uploading"
        {...props}
    />
);

const item = () => document.querySelector('[data-pttrn="file-upload-item"]') as HTMLElement;
const details = () => item().querySelector('[data-file-details]') as HTMLElement;
const cancelButton = (name = 'Cancel') => screen.getByRole('button', { name });
// The progress element is named by its label, the rounded percentage.
const progressbar = (name: string) => screen.getByRole('progressbar', { name });
// The tooltip names the cancel button. It shows on focus and is positioned a tick later; waiting for it keeps that
// update inside act.
const tooltipOf = (button: HTMLElement) => document.getElementById(button.getAttribute('aria-labelledby') as string);
const tooltipShown = (button: HTMLElement) =>
    waitFor(() => expect(tooltipOf(button)).toHaveStyle({ pointerEvents: 'auto' }));

describe('FileUploadItem (RTL)', () => {
    presets.forEach((preset) => {
        it(
            `has no basic a11y issues - ${preset.label}`,
            hasNoBasicA11yIssues(<FileUploadItem onCancel={() => {}} {...preset.propState} />),
        );
    });

    it('renders', () => {
        const { getByText } = render(<FileUploadItem onCancel={() => {}} {...presets[0].propState} />);

        expect(getByText('Close')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-file': () => {
        render(<Subject />);

        const name = item().querySelector('[data-file-name]');
        expect(name).toHaveTextContent('holiday-photo.png');
        expect(name).toHaveAttribute('data-truncated');
        expect(details()).toHaveTextContent('1.2 MB • uploading');
        expect(item().querySelector('[data-row]')).toContainElement(cancelButton());
        expect(item().querySelector('[data-status]')).toContainElement(progressbar('40%'));
    },
    'formats-size': () => {
        const { rerender } = render(<Subject fileSize={0.5} status={undefined} />);
        expect(details().textContent).toBe('512 KB');

        rerender(<Subject fileSize={1.43} status="complete" />);
        expect(details()).toHaveTextContent('1.43 MB • complete');

        rerender(<Subject fileSize={1536} />);
        expect(details()).toHaveTextContent('1.5 GB • uploading');

        // Rounded up, not off: 1.001 MB reads 1.01 MB.
        rerender(<Subject fileSize={1.001} />);
        expect(details()).toHaveTextContent('1.01 MB • uploading');

        rerender(<Subject fileSize={0} />);
        expect(details()).toHaveTextContent('Unknown size • uploading');
    },
    progress: () => {
        const { rerender } = render(<Subject progress={42.4} />);
        expect(progressbar('42%')).toHaveAttribute('aria-valuenow', '42');
        expect(progressbar('42%')).toHaveAttribute('aria-busy', 'true');
        expect(progressbar('42%').closest('[data-pttrn="progress-bar"]')).toHaveAttribute('data-align', 'left');
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();

        rerender(<Subject progress={100} status="complete" />);
        expect(progressbar('100%')).toHaveAttribute('aria-valuenow', '100');
        expect(progressbar('100%')).toHaveAttribute('aria-busy', 'false');

        rerender(<Subject progress={undefined} />);
        expect(progressbar('0%')).toHaveAttribute('aria-valuenow', '0');

        rerender(<Subject progress={150} />);
        expect(progressbar('100%')).toHaveAttribute('aria-valuenow', '100');
        rerender(<Subject progress={-5} />);
        expect(progressbar('0%')).toHaveAttribute('aria-valuenow', '0');
    },
    'error-alert': () => {
        const { rerender } = render(<Subject errorMessage="File too large." status="error" />);
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('File too large.');
        expect(alert).toHaveAttribute('data-variant', 'error');
        expect(item().querySelector('[data-status]')).toContainElement(alert);
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(details()).toHaveTextContent('1.2 MB • error');

        rerender(<Subject status="error" />);
        expect(screen.getByRole('alert')).toHaveTextContent('There was an error uploading the file. Please try again.');
    },
    cancel: async () => {
        const user = userEvent.setup();
        const onCancel = jest.fn();
        render(<Subject onCancel={onCancel} />);

        const button = cancelButton();
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('data-variant', 'tertiary');
        expect(button).toHaveAttribute('data-size', 'large');
        expect(button.querySelector('[data-button-label]')).toBeNull();

        await user.click(button);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledWith({ fileName: 'holiday-photo.png' });
        await tooltipShown(button);
    },
    'cancel-label': () => {
        const { rerender } = render(<Subject cancelButtonLabel="Remove" />);
        expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
        const button = cancelButton('Remove');
        expect(tooltipOf(button)).toHaveAttribute('role', 'tooltip');
        expect(tooltipOf(button)).toHaveTextContent('Remove');

        rerender(<Subject cancelButtonLabel="" />);
        expect(cancelButton('Cancel')).toBeInTheDocument();
    },
    keyboard: async () => {
        const user = userEvent.setup();
        const onCancel = jest.fn();
        render(<Subject onCancel={onCancel} />);

        await user.tab();
        expect(cancelButton()).toHaveFocus();
        await tooltipShown(cancelButton());
        await user.keyboard('{Enter}');
        expect(onCancel).toHaveBeenCalledTimes(1);
        await user.keyboard(' ');
        expect(onCancel).toHaveBeenCalledTimes(2);
        expect(onCancel).toHaveBeenLastCalledWith({ fileName: 'holiday-photo.png' });

        // The button is the only stop.
        await user.tab();
        expect(document.body).toHaveFocus();
    },
    'icon-decorative': () => {
        const { rerender } = render(<Subject />);
        expect(item().querySelector('[data-icon] svg')).toHaveAttribute('aria-hidden', 'true');
        expect(cancelButton().querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull();

        rerender(<Subject status="error" />);
        item()
            .querySelectorAll('svg')
            .forEach((svg) => expect(svg.closest('[aria-hidden="true"]')).not.toBeNull());
    },
    'axe-clean': async () => {
        for (const preset of presets) {
            await hasNoBasicA11yIssues(<FileUploadItem onCancel={() => {}} {...preset.propState} />)();
        }
    },
});
