import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Avatar } from './Avatar';
import { presets } from './AvatarExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const avatar = () => document.querySelector('[data-pttrn="avatar"]') as HTMLElement;

describe('Avatar (RTL)', () => {
    it('renders', () => {
        render(<Avatar {...presets[2].propState} />);

        expect(screen.getByText('AG')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    named: () => {
        render(<Avatar name="Andre Giant" showIcon={false} />);

        const image = screen.getByRole('img', { name: 'Andre Giant' });
        expect(image).toBe(avatar());
        expect(image).toHaveAttribute('aria-roledescription', 'person');
    },
    initials: () => {
        const { rerender } = render(<Avatar name="Andre The Giant" showIcon={false} />);
        expect(avatar().querySelector('[data-initials]')).toHaveTextContent('AT');

        rerender(<Avatar name="Andre" showIcon={false} />);
        expect(avatar().querySelector('[data-initials]')).toHaveTextContent('A');

        rerender(<Avatar initials="xyz" name="Andre Giant" showIcon={false} />);
        expect(avatar().querySelector('[data-initials]')).toHaveTextContent('xy');
    },
    'image-and-icon': () => {
        const { rerender } = render(<Avatar image="/avatar-01.png" name="Andre Giant" showIcon />);
        const image = avatar().querySelector('img');
        expect(image).toHaveAttribute('src', '/avatar-01.png');
        expect(image).toHaveAttribute('aria-hidden', 'true');
        expect(avatar().querySelector('[data-icon]')).toBeNull();

        rerender(<Avatar name="Andre Giant" showIcon />);
        expect(avatar().querySelector('[data-icon]')).toHaveAttribute('aria-hidden', 'true');
        expect(avatar().querySelector('[data-initials]')).toBeNull();

        rerender(<Avatar name="Andre Giant" showIcon={false} />);
        expect(avatar().querySelector('[data-initials]')).toHaveAttribute('aria-hidden', 'true');
    },
    clickable: async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        render(<Avatar name="Andre Giant" onClick={onClick} showIcon />);

        const button = screen.getByRole('button', { name: 'Andre Giant' });
        expect(button).toHaveAttribute('tabindex', '0');
        await user.click(button);
        expect(onClick).toHaveBeenCalledTimes(1);
    },
    disabled: async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        render(<Avatar disabled name="Andre Giant" onClick={onClick} showIcon />);

        const button = screen.getByRole('button', { name: 'Andre Giant' });
        expect(button).toHaveAttribute('aria-disabled', 'true');
        expect(button).not.toHaveAttribute('tabindex');
        await user.click(button);
        expect(onClick).not.toHaveBeenCalled();
    },
    tooltip: () => {
        const { rerender } = render(<Avatar name="Andre Giant" showIcon={false} />);
        expect(document.querySelector('[role="tooltip"]')).toHaveTextContent('Andre Giant');
        expect(avatar()).toHaveAttribute('aria-labelledby', document.querySelector('[role="tooltip"]')!.id);

        rerender(<Avatar hideTooltip name="Andre Giant" showIcon={false} />);
        expect(document.querySelector('[role="tooltip"]')).toBeNull();
    },
    'label-in-name': () => {
        render(<Avatar name="Andre Giant" onClick={() => {}} showIcon={false} />);

        const button = screen.getByRole('button', { name: 'AG, Andre Giant' });
        const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement;
        expect(button).toHaveAttribute('aria-describedby', tooltip.id);
        expect(button).not.toHaveAttribute('aria-labelledby');
        expect(button).toHaveAccessibleDescription('Andre Giant');
    },
    focusable: () => {
        render(<Avatar focusable name="Andre Giant" showIcon={false} />);

        expect(screen.getByRole('img', { name: 'Andre Giant' })).toHaveAttribute('tabindex', '0');
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    },
    'axe-clean': async () => {
        for (const preset of presets) await hasNoBasicA11yIssues(<Avatar {...preset.propState} />)();
        await hasNoBasicA11yIssues(<Avatar name="Andre Giant" onClick={() => {}} showIcon={false} />)();
    },
});
