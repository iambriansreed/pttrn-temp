import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Chip } from './Chip';
import { presets } from './ChipExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Icon = ({ id }: { id: string }) => <svg data-testid={id} />;
const chip = () => screen.getByRole('button');

describe('Chip (RTL)', () => {
    it('renders', () => {
        render(<Chip {...presets[0].propState} />);

        expect(screen.getByText('chip')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-label': () => {
        render(<Chip label="Suggestion" />);

        expect(screen.getByRole('button', { name: 'Suggestion' })).toHaveAttribute('type', 'button');
    },
    click: async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        render(<Chip label="Suggestion" onClick={onClick} />);

        await user.click(chip());
        await user.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(2);
    },
    disabled: async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        render(<Chip disabled label="Suggestion" onClick={onClick} />);

        expect(chip()).toBeDisabled();
        await user.click(chip());
        expect(onClick).not.toHaveBeenCalled();
    },
    selected: () => {
        const { rerender } = render(<Chip label="Filter" selected />);
        expect(chip()).toHaveAttribute('aria-pressed', 'true');
        expect(chip()).toHaveAttribute('data-selected');

        rerender(<Chip label="Filter" selected={false} />);
        expect(chip()).toHaveAttribute('aria-pressed', 'false');
        expect(chip()).not.toHaveAttribute('data-selected');

        rerender(<Chip label="Action" />);
        expect(chip()).not.toHaveAttribute('aria-pressed');
    },
    'icons-decorative': () => {
        render(<Chip label="Idea" leadingIcon={<Icon id="lead" />} trailingIcon={<Icon id="trail" />} />);

        expect(screen.getByTestId('lead').parentElement).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByTestId('trail').parentElement).toHaveAttribute('aria-hidden', 'true');
    },
    'trailing-badge': () => {
        const { rerender } = render(<Chip label="Inbox" trailingBadge={{ count: 7 }} />);
        expect(chip().querySelector('[data-pttrn="badge"]')).toHaveTextContent('7');

        rerender(<Chip label="Inbox" trailingBadge={{ count: 7 }} trailingIcon={<Icon id="trail" />} />);
        expect(chip().querySelector('[data-pttrn="badge"]')).toBeNull();
    },
    'axe-clean': async () => {
        for (const preset of presets) {
            await hasNoBasicA11yIssues(
                <Chip
                    {...preset.propState}
                    leadingIcon={preset.propState.leadingIcon && <Icon id="lead" />}
                    trailingIcon={preset.propState.trailingIcon && <Icon id="trail" />}
                />,
            )();
        }
    },
});
