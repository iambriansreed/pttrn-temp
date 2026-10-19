import userEvent from '@testing-library/user-event';
import { Tooltip, TooltipProps } from './Tooltip';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen, waitFor } from '-/rtl/util';

const base: TooltipProps = {
    label: 'Example label',
    placement: 'top',
    children: (triggerProps) => (
        <button type="button" {...triggerProps}>
            Trigger button
        </button>
    ),
};

const trigger = () => screen.getByRole('button');
const tooltip = () => document.querySelector('[role="tooltip"]') as HTMLElement | null;
// The floating hook shows by clearing display and fading in; it hides by fading out, leaving display alone.
const isShown = () => {
    const style = tooltip()?.style;
    return !!style && style.display !== 'none' && style.opacity !== '0';
};

describe('Tooltip (RTL)', () => {
    it('renders the label', () => {
        render(<Tooltip {...base} />);

        expect(screen.getByText('Example label')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'hidden-by-default': () => {
        render(<Tooltip {...base} />);

        expect(tooltip()).not.toBeNull();
        expect(isShown()).toBe(false);
    },
    'shows-on-hover': async () => {
        const user = userEvent.setup();
        render(<Tooltip {...base} />);

        await user.hover(trigger());
        await waitFor(() => expect(isShown()).toBe(true));

        await user.unhover(trigger());
        await waitFor(() => expect(isShown()).toBe(false));
    },
    'shows-on-focus': async () => {
        const user = userEvent.setup();
        render(<Tooltip {...base} />);

        await user.tab();
        expect(trigger()).toHaveFocus();
        await waitFor(() => expect(isShown()).toBe(true));

        await user.tab();
        await waitFor(() => expect(isShown()).toBe(false));
    },
    'labels-trigger': () => {
        render(<Tooltip {...base} />);

        expect(trigger()).toHaveAttribute('aria-labelledby', tooltip()!.id);
        expect(trigger()).toHaveAccessibleName('Example label');
    },
    'no-label': () => {
        render(<Tooltip {...base} label="" />);

        expect(tooltip()).toBeNull();
        expect(trigger()).not.toHaveAttribute('aria-labelledby');
        expect(trigger()).toHaveAccessibleName('Trigger button');
    },
    disabled: () => {
        render(<Tooltip {...base} disabled />);

        expect(tooltip()).toBeNull();
        expect(trigger()).not.toHaveAttribute('aria-labelledby');
    },
    'axe-clean': hasNoBasicA11yIssues(<Tooltip {...base} />),
});
