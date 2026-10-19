import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { clearSnackbar, sendSnackbar, SnackbarManager } from './Manager';
import { Snackbar } from './Snackbar';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { act, render, screen, waitFor } from '-/rtl/util';

describe('Snackbar (RTL)', () => {
    it('renders', () => {
        render(<Snackbar disableFocusTrap onClose={() => {}} open text="Saved" />);

        expect(screen.getByText('Saved')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'closed-by-default': () => {
        render(<Snackbar onClose={() => {}} text="Saved" />);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
    'shows-text': () => {
        render(<Snackbar disableFocusTrap onClose={() => {}} open text="Saved" />);

        expect(screen.getByRole('alert')).toHaveTextContent('Saved');
        expect(document.querySelector('[data-pttrn="snackbar"]')?.parentElement).toBe(document.body);
    },
    'dismiss-button': async () => {
        const user = userEvent.setup();
        const onClose = jest.fn();
        const { rerender } = render(<Snackbar disableFocusTrap onClose={onClose} open text="Saved" />);

        await user.click(screen.getByRole('button', { name: 'Dismiss' }));
        expect(onClose).toHaveBeenCalledTimes(1);

        rerender(<Snackbar closeButtonLabel="Got it" disableFocusTrap onClose={onClose} open text="Saved" />);
        expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
    },
    'no-dismiss-button': () => {
        render(<Snackbar closeButton={false} disableFocusTrap onClose={() => {}} open text="Saved" timeout={1000} />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
    'auto-dismiss': () => {
        jest.useFakeTimers();
        try {
            const onClose = jest.fn();
            render(<Snackbar disableFocusTrap onClose={onClose} open text="Saved" timeout={2000} />);

            act(() => jest.advanceTimersByTime(1999));
            expect(onClose).not.toHaveBeenCalled();
            act(() => jest.advanceTimersByTime(1));
            expect(onClose).toHaveBeenCalledTimes(1);
        } finally {
            jest.useRealTimers();
        }
    },
    'icon-decorative': () => {
        render(<Snackbar disableFocusTrap icon={<svg data-testid="icon" />} onClose={() => {}} open text="Saved" />);

        expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    },
    'focus-moves-in': async () => {
        // Without a dismiss button there is nothing tabbable, so the trap must fall back to the content itself.
        render(<Snackbar closeButton={false} onClose={() => {}} open text="Saved" timeout={5000} />);

        await waitFor(() => expect(screen.getByRole('alert')).toContainElement(document.activeElement as HTMLElement));
    },
    managed: async () => {
        render(<SnackbarManager />);

        act(() => sendSnackbar({ text: 'Managed message', disableFocusTrap: true }));
        expect(screen.getByRole('alert')).toHaveTextContent('Managed message');

        act(() => sendSnackbar('Just text'));
        expect(screen.getByRole('alert')).toHaveTextContent('Just text');

        act(() => clearSnackbar());
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
    'axe-clean': hasNoBasicA11yIssues(<Snackbar disableFocusTrap onClose={() => {}} open text="Saved" />),
});
