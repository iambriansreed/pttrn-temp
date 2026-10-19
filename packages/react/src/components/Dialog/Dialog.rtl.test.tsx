/* eslint-disable react/no-multi-comp */
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Dialog, DialogProps } from './Dialog';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen, waitFor } from '-/rtl/util';

const Content = () => (
    <>
        <h1 id="title">Dialog Title</h1>
        <p>This is the content of the dialog.</p>
        <button type="button">Close</button>
    </>
);

/** A button that opens the dialog, so focus has somewhere to come from and return to. */
function Opener(props: Partial<DialogProps>) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button onClick={() => setOpen(true)} type="button">
                Open
            </button>
            <Dialog aria-labelledby="title" onClose={() => setOpen(false)} open={open} {...props}>
                <Content />
            </Dialog>
        </>
    );
}

const scrim = () => document.querySelector('[data-pttrn="scrim"]') as HTMLElement;

describe('Dialog (RTL)', () => {
    it('renders', () => {
        render(
            <Dialog aria-labelledby="title" disableFocusTrap onClose={() => {}} open>
                <Content />
            </Dialog>,
        );

        expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'closed-by-default': () => {
        render(
            <Dialog aria-labelledby="title" onClose={() => {}}>
                <Content />
            </Dialog>,
        );

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(scrim()).toBeNull();
    },
    opens: () => {
        render(
            <Dialog aria-labelledby="title" onClose={() => {}} open>
                <Content />
            </Dialog>,
        );

        const dialog = screen.getByRole('dialog');
        expect(dialog).toContainElement(screen.getByText('This is the content of the dialog.'));
        expect(dialog.closest('[data-pttrn="dialog"]')?.parentElement).toBe(document.body);
    },
    'escape-closes': async () => {
        const user = userEvent.setup();
        const onClose = jest.fn();
        render(
            <Dialog aria-labelledby="title" onClose={onClose} open>
                <Content />
            </Dialog>,
        );

        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalledTimes(1);
    },
    'scrim-closes': async () => {
        const user = userEvent.setup();
        const onClose = jest.fn();
        render(
            <Dialog aria-labelledby="title" onClose={onClose} open>
                <Content />
            </Dialog>,
        );

        await user.click(scrim());
        expect(onClose).toHaveBeenCalledTimes(1);
    },
    'hide-scrim': () => {
        render(
            <Dialog aria-labelledby="title" onClose={() => {}} open showScrim={false}>
                <Content />
            </Dialog>,
        );

        expect(scrim()).toHaveAttribute('data-hidden');
        expect(scrim()).toHaveAttribute('aria-hidden', 'true');
    },
    labelled: () => {
        render(
            <Dialog
                aria-describedby="desc"
                aria-description="A description"
                aria-labelledby="title"
                onClose={() => {}}
                open
            >
                <Content />
                <p id="desc">Described</p>
            </Dialog>,
        );

        const dialog = screen.getByRole('dialog', { name: 'Dialog Title' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-describedby', 'desc');
        expect(dialog).toHaveAttribute('aria-description', 'A description');
        expect(dialog.parentElement?.closest('[data-pttrn="dialog"]')).toHaveAttribute('role', 'presentation');
    },
    placement: () => {
        const { rerender } = render(
            <Dialog aria-labelledby="title" onClose={() => {}} open>
                <Content />
            </Dialog>,
        );
        expect(document.querySelector('[data-pttrn="dialog"]')).toHaveAttribute('data-placement', 'center');

        rerender(
            <Dialog aria-labelledby="title" onClose={() => {}} open placement="right">
                <Content />
            </Dialog>,
        );
        expect(document.querySelector('[data-pttrn="dialog"]')).toHaveAttribute('data-placement', 'right');
    },
    'focus-moves-in': async () => {
        const user = userEvent.setup();
        render(<Opener />);

        const opener = screen.getByRole('button', { name: 'Open' });
        await user.click(opener);
        // jsdom has no layout, so the trap falls back to the dialog box itself; in a browser the first control gets it.
        await waitFor(() => expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement));

        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(opener).toHaveFocus();
    },
    'scroll-lock': async () => {
        const user = userEvent.setup();
        render(<Opener />);

        expect(document.documentElement.style.overflow).toBe('');
        await user.click(screen.getByRole('button', { name: 'Open' }));
        expect(document.documentElement.style.overflow).toBe('hidden');

        await user.keyboard('{Escape}');
        await waitFor(() => expect(document.documentElement.style.overflow).toBe(''));
    },
    'axe-clean': hasNoBasicA11yIssues(
        <Dialog aria-labelledby="title" disableFocusTrap onClose={() => {}} open>
            <Content />
        </Dialog>,
    ),
});
