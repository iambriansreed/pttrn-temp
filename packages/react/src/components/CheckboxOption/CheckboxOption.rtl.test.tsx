import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { CheckboxOption, CheckboxOptionProps } from './CheckboxOption';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Subject = (props: Partial<CheckboxOptionProps>) => (
    <CheckboxOption
        checked
        description="This is an example checkbox option."
        label="Example Checkbox"
        name="example-checkbox-name"
        onChange={() => {}}
        value="example-checkbox-value"
        {...props}
    />
);

describe('CheckboxOption (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(screen.getByText('Example Checkbox')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    renders: () => {
        render(<Subject />);

        expect(screen.getByText('This is an example checkbox option.')).toBeInTheDocument();
        expect(
            screen.getByRole('checkbox', { name: 'Example Checkbox - This is an example checkbox option.' }),
        ).toBeChecked();
    },
    toggle: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject checked={false} onChange={onChange} />);

        await user.click(screen.getByText('Example Checkbox'));
        expect(onChange).toHaveBeenLastCalledWith(true, expect.anything());

        screen.getByRole('checkbox').focus();
        await user.keyboard(' ');
        expect(onChange).toHaveBeenCalledTimes(2);
    },
    disabled: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject disabled onChange={onChange} />);

        expect(screen.getByRole('checkbox')).toBeDisabled();
        expect(document.querySelector('[data-pttrn="list-item"]')).toHaveAttribute('data-disabled');
        await user.click(screen.getByText('Example Checkbox'));
        expect(onChange).not.toHaveBeenCalled();
    },
    'axe-clean': hasNoBasicA11yIssues(<Subject />),
});
