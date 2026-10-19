import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { CheckboxGroup, CheckboxGroupProps } from './CheckboxGroup';
import { presets } from './CheckboxGroupExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const OPTIONS = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2', disabled: true },
    { label: 'Option 3', value: '3' },
];
const Subject = (props: Partial<CheckboxGroupProps>) => (
    <CheckboxGroup
        aria-label="Toppings"
        name="toppings"
        onChange={() => {}}
        options={OPTIONS}
        value={['1']}
        {...props}
    />
);
const box = (name: string) => screen.getByRole('checkbox', { name });

describe('CheckboxGroup (RTL)', () => {
    it('renders', () => {
        render(<CheckboxGroup {...presets[1].propState} onChange={() => {}} />);

        expect(screen.getByText('Option 1')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-options': () => {
        render(<Subject />);

        expect(screen.getByRole('group', { name: 'Toppings' })).toBeInTheDocument();
        expect(screen.getAllByRole('checkbox')).toHaveLength(3);
        screen.getAllByRole('checkbox').forEach((input) => expect(input).toHaveAttribute('name', 'toppings'));
    },
    'checked-values': () => {
        render(<Subject value={['1', '3']} />);

        expect(box('Option 1')).toBeChecked();
        expect(box('Option 2')).not.toBeChecked();
        expect(box('Option 3')).toBeChecked();
    },
    toggle: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.click(box('Option 3'));
        expect(onChange).toHaveBeenLastCalledWith(['1', '3']);
        await user.click(box('Option 1'));
        expect(onChange).toHaveBeenLastCalledWith([]);
    },
    'select-all': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        const { rerender } = render(<Subject onChange={onChange} selectAll />);

        const all = () => screen.getByTestId('selectAll-Checkbox') as HTMLInputElement;
        expect(all()).toBePartiallyChecked();
        await user.click(all());
        expect(onChange).toHaveBeenLastCalledWith(['1', '3']);

        rerender(<Subject onChange={onChange} selectAll value={['1', '3']} />);
        expect(all()).toBeChecked();
        expect(all().indeterminate).toBe(false);
        await user.click(all());
        expect(onChange).toHaveBeenLastCalledWith([]);
    },
    disabled: () => {
        const { rerender } = render(<Subject />);
        expect(box('Option 2')).toBeDisabled();
        expect(box('Option 1')).toBeEnabled();

        rerender(<Subject disabled />);
        screen.getAllByRole('checkbox').forEach((input) => expect(input).toBeDisabled());
    },
    'axe-clean': async () => {
        for (const preset of presets)
            await hasNoBasicA11yIssues(<CheckboxGroup onChange={() => {}} {...preset.propState} />)();
    },
});
