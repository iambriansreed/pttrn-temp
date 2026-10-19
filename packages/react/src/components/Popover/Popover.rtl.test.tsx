import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Popover, PopoverProps } from './Popover';
import { spec } from './spec';
import { Button } from '-/components/Button';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { fireEvent, render, screen, waitFor } from '-/rtl/util';

const base: PopoverProps = {
    header: 'Popover Header',
    content: 'This is a popover content',
    children: (triggerProps) => <Button label="Toggle popover" {...triggerProps} />,
};

const trigger = () => screen.getByRole('button', { name: 'Toggle popover' });
const panel = () => document.querySelector('[data-pttrn="popover"]');
// The panel is positioned a tick after it mounts: role queries skip it and it refuses pointer events until then.
const open = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(trigger());
    await waitFor(() => expect(panel()).toHaveStyle({ pointerEvents: 'auto' }));
};

describe('Popover (RTL)', () => {
    it('renders', () => {
        render(<Popover {...base} />);

        expect(trigger()).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'closed-by-default': () => {
        render(<Popover {...base} />);

        expect(trigger()).toBeInTheDocument();
        expect(panel()).toBeNull();
    },
    'toggle-on-click': async () => {
        const user = userEvent.setup();
        render(<Popover {...base} />);

        await user.click(trigger());
        expect(screen.getByText('Popover Header')).toBeInTheDocument();
        expect(screen.getByText('This is a popover content')).toBeInTheDocument();

        await user.click(trigger());
        await waitFor(() => expect(panel()).toBeNull());
    },
    'close-button': async () => {
        const user = userEvent.setup();
        render(<Popover {...base} />);

        await open(user);
        await user.click(screen.getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(panel()).toBeNull());
    },
    'outside-click-closes': async () => {
        const user = userEvent.setup();
        render(
            <>
                <Popover {...base} />
                <p>Outside</p>
            </>,
        );

        await user.click(trigger());
        expect(panel()).not.toBeNull();

        fireEvent.mouseDown(screen.getByText('Outside'));
        await waitFor(() => expect(panel()).toBeNull());
    },
    'describes-trigger': async () => {
        const user = userEvent.setup();
        render(<Popover {...base} />);

        const id = trigger().getAttribute('aria-describedby');
        expect(id).toBeTruthy();

        await user.click(trigger());
        expect(panel()).toHaveAttribute('id', id!);
        expect(trigger()).toHaveAccessibleDescription(/Popover Header/);
    },
    'calls-to-action': async () => {
        const user = userEvent.setup();
        const primary = jest.fn();
        const secondary = jest.fn();
        render(
            <Popover
                {...base}
                callToAction={{ label: 'Primary', onClick: primary }}
                secondaryCallToAction={{ label: 'Secondary', onClick: secondary }}
            />,
        );

        await open(user);
        await user.click(screen.getByRole('button', { name: 'Primary' }));
        await user.click(screen.getByRole('button', { name: 'Secondary' }));
        expect(primary).toHaveBeenCalledTimes(1);
        expect(secondary).toHaveBeenCalledTimes(1);
    },
    disabled: async () => {
        const user = userEvent.setup();
        render(<Popover {...base} disabled />);

        expect(trigger()).not.toHaveAttribute('aria-describedby');
        await user.click(trigger());
        expect(panel()).toBeNull();
    },
    'focus-moves-in': async () => {
        const user = userEvent.setup();
        render(<Popover {...base} />);

        await user.click(trigger());
        await waitFor(() => expect(panel()).toContainElement(document.activeElement as HTMLElement));
    },
    'axe-clean': async () => {
        await hasNoBasicA11yIssues(<Popover {...base} callToAction={{ label: 'Action', onClick: () => {} }} />)();
    },
});
