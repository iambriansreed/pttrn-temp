import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Switch } from './Switch';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const control = () => screen.getByRole('switch');

describe('Switch (RTL)', () => {
    it('renders', () => {
        render(<Switch aria-label="Example aria-label" checked name="example-name" onChange={() => {}} value="on" />);

        expect(screen.getByLabelText('Example aria-label')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'reflects-checked': () => {
        const { rerender } = render(<Switch aria-label="Dark mode" name="dark" onChange={() => {}} value="on" />);
        expect(control()).not.toBeChecked();

        rerender(<Switch aria-label="Dark mode" checked name="dark" onChange={() => {}} value="on" />);
        expect(control()).toBeChecked();
    },
    'toggle-on-click': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        const { rerender } = render(<Switch aria-label="Dark mode" name="dark" onChange={onChange} value="on" />);

        await user.click(control());
        expect(onChange).toHaveBeenLastCalledWith(true, expect.anything());

        rerender(<Switch aria-label="Dark mode" checked name="dark" onChange={onChange} value="on" />);
        await user.click(control());
        expect(onChange).toHaveBeenLastCalledWith(false, expect.anything());
    },
    'keyboard-toggle': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Switch aria-label="Dark mode" name="dark" onChange={onChange} value="on" />);

        await user.tab();
        expect(control()).toHaveFocus();
        await user.keyboard(' ');
        expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    },
    disabled: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Switch aria-label="Dark mode" disabled name="dark" onChange={onChange} value="on" />);

        expect(control()).toBeDisabled();
        await user.click(control());
        expect(onChange).not.toHaveBeenCalled();
    },
    labelled: () => {
        render(<Switch aria-label="Dark mode" name="dark" onChange={() => {}} value="on" />);

        const input = screen.getByRole('switch', { name: 'Dark mode' });
        expect(input).toHaveAttribute('name', 'dark');
        expect(input).toHaveAttribute('value', 'on');
        expect(input.nextElementSibling).toHaveAttribute('aria-hidden', 'true');
    },
    'axe-clean': hasNoBasicA11yIssues(
        <Switch aria-label="Dark mode" checked name="dark" onChange={() => {}} value="on" />,
    ),
});
