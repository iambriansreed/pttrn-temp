import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { spec } from './spec';
import { InputNumber, InputNumberProps } from '.';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Subject = (props: Partial<InputNumberProps>) => (
    <InputNumber aria-label="Quantity" name="quantity" onChange={() => {}} value={24} {...props} />
);
const field = () => screen.getByRole('spinbutton', { name: 'Quantity' });
const increase = () => screen.getByRole('button', { name: 'Increase value' });
const decrease = () => screen.getByRole('button', { name: 'Decrease value' });

describe('InputNumber (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(field()).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-value': () => {
        render(<Subject max={30} min={0} step={2} />);

        expect(field()).toHaveValue(24);
        expect(field()).toHaveAttribute('name', 'quantity');
        expect(field()).toHaveAttribute('min', '0');
        expect(field()).toHaveAttribute('max', '30');
        expect(field()).toHaveAttribute('step', '2');
        expect(increase()).toHaveAttribute('aria-controls', field().id);
    },
    typing: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} value={undefined} />);

        await user.type(field(), '7');
        expect(onChange).toHaveBeenLastCalledWith(7);
    },
    steppers: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} step={5} />);

        await user.click(increase());
        expect(onChange).toHaveBeenLastCalledWith(29);
        await user.click(decrease());
        expect(onChange).toHaveBeenLastCalledWith(19);
    },
    bounds: () => {
        const { rerender } = render(<Subject max={24} min={0} />);
        expect(increase()).toBeDisabled();
        expect(decrease()).toBeEnabled();

        rerender(<Subject max={30} min={24} />);
        expect(decrease()).toBeDisabled();
        expect(increase()).toBeEnabled();
    },
    'disabled-readonly': () => {
        const { rerender } = render(<Subject disabled />);
        expect(field()).toBeDisabled();
        expect(increase()).toBeDisabled();
        expect(decrease()).toBeDisabled();

        rerender(<Subject readOnly />);
        expect(field()).toHaveAttribute('readonly');
        expect(increase()).toBeDisabled();
        expect(decrease()).toBeDisabled();
    },
    'axe-clean': hasNoBasicA11yIssues(<Subject />),
});
