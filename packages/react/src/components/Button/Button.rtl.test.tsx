import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';
import { presets } from './ButtonExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen, waitFor } from '-/rtl/util';

const Icon = () => <svg data-testid="icon" />;

describe('Button (RTL)', () => {
    it('renders', () => {
        render(<Button {...presets[1].propState} />);

        expect(screen.getByText('Add')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-label': () => {
        render(<Button label="Save" />);

        const button = screen.getByRole('button', { name: 'Save' });
        expect(button).toHaveTextContent('Save');
        expect(button).toHaveAttribute('type', 'button');
    },
    click: async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        render(<Button label="Save" onClick={onClick} />);

        await user.click(screen.getByRole('button', { name: 'Save' }));
        expect(onClick).toHaveBeenCalledTimes(1);

        await user.keyboard('{Enter}');
        expect(onClick).toHaveBeenCalledTimes(2);
    },
    disabled: async () => {
        const user = userEvent.setup();
        const onClick = jest.fn();
        render(<Button disabled label="Save" onClick={onClick} />);

        const button = screen.getByRole('button', { name: 'Save' });
        expect(button).toBeDisabled();
        await user.click(button);
        expect(onClick).not.toHaveBeenCalled();
    },
    'icon-only': async () => {
        const user = userEvent.setup();
        render(<Button icon={<Icon />} iconOnly label="Add" />);

        const button = screen.getByRole('button', { name: 'Add' });
        expect(button.querySelector('[data-button-label]')).toBeNull();
        expect(screen.getByTestId('icon')).toBeInTheDocument();

        await user.hover(button);
        await waitFor(() => expect(document.querySelector('[role="tooltip"]')).toHaveStyle({ opacity: '1' }));
        expect(document.querySelector('[role="tooltip"]')).toHaveTextContent('Add');
    },
    'icon-decorative': () => {
        render(<Button icon={<Icon />} label="Add" />);

        expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    },
    tooltip: () => {
        render(
            <>
                <Button label="Save" tooltip="Saves the draft" />
                <Button icon={<Icon />} iconOnly label="Add" />
            </>,
        );

        const save = screen.getByRole('button', { name: 'Save' });
        expect(save).toHaveAccessibleDescription('Saves the draft');
        expect(save).not.toHaveAttribute('aria-labelledby');

        const add = screen.getByRole('button', { name: 'Add' });
        expect(add).toHaveAttribute('aria-labelledby');
    },
    'aria-label-wins': () => {
        render(<Button aria-label="Next slide" icon={<Icon />} iconOnly label="Next" />);

        const button = screen.getByRole('button', { name: 'Next slide' });
        expect(button).not.toHaveAttribute('aria-labelledby');
    },
    'as-element': () => {
        render(<Button as="a" href="#somewhere" label="Go" />);

        const link = screen.getByRole('button', { name: 'Go' });
        expect(link.tagName).toBe('A');
        expect(link).not.toHaveAttribute('type');
        expect(link).toHaveAttribute('href', '#somewhere');
    },
    'children-label': () => {
        render(<Button label="Ignored">From children</Button>);

        expect(screen.getByRole('button', { name: 'From children' })).toHaveTextContent('From children');
    },
    'axe-clean': async () => {
        for (const preset of presets) {
            await hasNoBasicA11yIssues(<Button {...preset.propState} icon={preset.propState.icon && <Icon />} />)();
        }
    },
});
