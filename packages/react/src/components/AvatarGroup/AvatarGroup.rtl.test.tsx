import userEvent from '@testing-library/user-event';
import { AvatarGroup } from './AvatarGroup';
import { presets } from './AvatarGroupExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { cleanup, fireEvent, render, screen, waitFor } from '-/rtl/util';

const PEOPLE = ['Fezzik', 'Inigo Montoya', 'Miracle Max', 'Princess Buttercup', 'Westley', 'Valerie'].map((name) => ({
    name,
    showIcon: false,
}));

const overflow = () => screen.getByRole('button', { name: /more avatars/ });

describe('AvatarGroup (RTL)', () => {
    it('renders', () => {
        render(<AvatarGroup {...presets[0].propState} />);

        expect(screen.getByText('IM')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-avatars': () => {
        render(<AvatarGroup items={PEOPLE.slice(0, 3)} />);

        PEOPLE.slice(0, 3).forEach(({ name }) => expect(screen.getByRole('button', { name })).toBeInTheDocument());
        expect(screen.queryByRole('button', { name: /more avatars/ })).not.toBeInTheDocument();
    },
    'overflow-button': () => {
        render(<AvatarGroup items={PEOPLE} max={4} />);

        expect(screen.getAllByRole('button')).toHaveLength(5);
        expect(overflow()).toHaveAccessibleName('+2 more avatars');
        expect(overflow()).toHaveAttribute('aria-haspopup', 'menu');
        expect(overflow()).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('button', { name: 'Westley' })).not.toBeInTheDocument();
    },
    'opens-menu': async () => {
        const user = userEvent.setup();
        render(<AvatarGroup items={PEOPLE} max={4} />);

        await user.click(overflow());
        const menu = await screen.findByRole('menu', { name: '2 more avatars' });
        expect(overflow()).toHaveAttribute('aria-expanded', 'true');
        expect(overflow()).toHaveAttribute('aria-controls', menu.id);
        const names = screen.getAllByRole('menuitem').map((item) => item.getAttribute('aria-label'));
        expect(names).toEqual(['Westley', 'Valerie']);
    },
    'menu-keyboard': async () => {
        const user = userEvent.setup();
        render(<AvatarGroup items={PEOPLE} max={4} />);

        overflow().focus();
        await user.keyboard('{Enter}');
        await screen.findByRole('menu');
        const [first, second] = screen.getAllByRole('menuitem');
        await waitFor(() => expect(first).toHaveFocus());

        await user.keyboard('{ArrowDown}');
        await waitFor(() => expect(second).toHaveFocus());
        await user.keyboard('{ArrowDown}');
        await waitFor(() => expect(first).toHaveFocus());

        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
        expect(overflow()).toHaveFocus();
    },
    'outside-click-closes': async () => {
        const user = userEvent.setup();
        render(
            <>
                <AvatarGroup items={PEOPLE} max={4} />
                <p>Outside</p>
            </>,
        );

        await user.click(overflow());
        await screen.findByRole('menu');
        fireEvent.mouseDown(screen.getByText('Outside'));
        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    },
    variants: () => {
        const { rerender } = render(<AvatarGroup items={PEOPLE.slice(0, 2)} max={5} />);
        const group = () => document.querySelector('[data-pttrn="avatar-group"]');
        expect(group()).toHaveAttribute('data-variant', 'stacked');
        expect(group()).toHaveAttribute('data-size', 'small');
        expect(group()).toHaveAttribute('data-max', '2');

        rerender(<AvatarGroup items={PEOPLE.slice(0, 2)} size="large" variant="spread" />);
        expect(group()).toHaveAttribute('data-variant', 'spread');
        expect(group()).toHaveAttribute('data-size', 'large');
    },
    empty: () => {
        const { container } = render(<AvatarGroup items={[]} />);

        expect(container).toBeEmptyDOMElement();
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<AvatarGroup {...preset.propState} />)();
        cleanup();

        const user = userEvent.setup();
        const { container } = render(<AvatarGroup items={PEOPLE} max={4} />);
        await user.click(overflow());
        await screen.findByRole('menu');
        const { axe } = await import('jest-axe');
        expect(await axe(container)).toHaveNoViolations();
    },
});
