import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Checkbox } from './Checkbox';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const control = () => screen.getByRole('checkbox') as HTMLInputElement;

describe('Checkbox (RTL)', () => {
    it('renders inside a label', () => {
        render(
            <label htmlFor="sample-checkbox">
                <Checkbox checked id="sample-checkbox" name="sample-checkbox" onChange={() => {}} value="sample" />
                Checkbox Label
            </label>,
        );

        expect(screen.getByRole('checkbox', { name: 'Checkbox Label' })).toBeChecked();
    });
});

describeBehaviors(spec, {
    'reflects-checked': () => {
        const { rerender } = render(<Checkbox aria-label="Agree" name="agree" onChange={() => {}} value="yes" />);
        expect(control()).not.toBeChecked();

        rerender(<Checkbox aria-label="Agree" checked name="agree" onChange={() => {}} value="yes" />);
        expect(control()).toBeChecked();
        expect(control().nextElementSibling?.querySelector('[data-checked]')).not.toBeNull();
    },
    'toggle-on-click': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        const { rerender } = render(<Checkbox aria-label="Agree" name="agree" onChange={onChange} value="yes" />);

        await user.click(control());
        expect(onChange).toHaveBeenLastCalledWith(true, expect.anything());

        rerender(<Checkbox aria-label="Agree" checked name="agree" onChange={onChange} value="yes" />);
        await user.keyboard(' ');
        expect(onChange).toHaveBeenLastCalledWith(false, expect.anything());
    },
    indeterminate: () => {
        render(<Checkbox aria-label="Agree" indeterminate name="agree" onChange={() => {}} value="yes" />);

        expect(control().indeterminate).toBe(true);
        expect(control()).toHaveAttribute('data-indeterminate');
        expect(control()).toBePartiallyChecked();
        expect(control().nextElementSibling?.querySelector('[data-indeterminate]')).not.toBeNull();
        expect(control().nextElementSibling?.querySelector('[data-checked]')).toBeNull();
    },
    disabled: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Checkbox aria-label="Agree" disabled name="agree" onChange={onChange} value="yes" />);

        expect(control()).toBeDisabled();
        await user.click(control());
        expect(onChange).not.toHaveBeenCalled();
    },
    'invalid-required': () => {
        render(<Checkbox aria-label="Agree" invalid name="agree" onChange={() => {}} required value="yes" />);

        expect(control()).toHaveAttribute('aria-invalid', 'true');
        expect(control()).toBeRequired();
    },
    labelled: () => {
        render(<Checkbox aria-label="Agree" name="agree" onChange={() => {}} value="yes" />);

        const input = screen.getByRole('checkbox', { name: 'Agree' });
        expect(input).toHaveAttribute('name', 'agree');
        expect(input).toHaveAttribute('value', 'yes');
    },
    'axe-clean': hasNoBasicA11yIssues(
        <Checkbox aria-label="Agree" checked name="agree" onChange={() => {}} value="yes" />,
    ),
});
