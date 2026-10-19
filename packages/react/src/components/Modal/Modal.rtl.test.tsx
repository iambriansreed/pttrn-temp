import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Modal, ModalProps } from './Modal';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen, waitFor } from '-/rtl/util';

const base: ModalProps = {
    header: 'Example header',
    description: 'Example description',
    onClose: () => {},
    open: true,
    children: 'Example Modal',
};

describe('Modal (RTL)', () => {
    it('renders', () => {
        render(<Modal {...base} disableFocusTrap />);

        expect(screen.getByText('Example Modal')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'closed-by-default': () => {
        render(<Modal {...base} open={undefined} />);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    },
    'header-and-description': () => {
        render(<Modal {...base} disableFocusTrap />);

        const dialog = screen.getByRole('dialog', { name: 'Example header' });
        expect(dialog).toHaveAttribute('aria-description', 'Example description');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(screen.getByText('Example header')).toBeVisible();
    },
    'close-button': async () => {
        const user = userEvent.setup();
        const onClose = jest.fn();
        render(<Modal {...base} disableFocusTrap onClose={onClose} />);

        await user.click(screen.getByRole('button', { name: 'close' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    },
    'call-to-action': async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        render(<Modal {...base} callToAction={{ label: 'Confirm', onClick }} disableFocusTrap />);

        await user.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(document.querySelector('[data-modal-footer]')).toContainElement(
            screen.getByRole('button', { name: 'Confirm' }),
        );
    },
    'cancel-button': async () => {
        const user = userEvent.setup();
        const onClose = jest.fn();
        const { rerender } = render(
            <Modal
                {...base}
                callToAction={{ label: 'Confirm', onClick: () => {} }}
                cancelButton
                disableFocusTrap
                onClose={onClose}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalledTimes(1);

        rerender(
            <Modal
                {...base}
                callToAction={{ label: 'Confirm', onClick: () => {} }}
                cancelButton="Not now"
                disableFocusTrap
                onClose={onClose}
            />,
        );
        expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument();
    },
    'no-footer': () => {
        render(<Modal {...base} cancelButton disableFocusTrap />);

        expect(document.querySelector('[data-modal-footer]')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    },
    'escape-closes': async () => {
        const user = userEvent.setup();
        const onClose = jest.fn();
        render(<Modal {...base} disableFocusTrap onClose={onClose} />);

        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalledTimes(1);
    },
    'focus-moves-in': async () => {
        render(<Modal {...base} />);

        await waitFor(() => expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement));
    },
    'axe-clean': hasNoBasicA11yIssues(
        <Modal {...base} callToAction={{ label: 'Confirm', onClick: () => {} }} cancelButton disableFocusTrap />,
    ),
});
