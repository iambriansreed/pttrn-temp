import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { RadioGroup, RadioGroupProps } from './RadioGroup';
import { presets } from './RadioGroupExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const OPTIONS = [
    { value: '1', label: 'Option 1', description: 'First' },
    { value: '2', label: 'Option 2', disabled: true },
    { value: '3', label: 'Option 3' },
];
const Subject = (props: Partial<RadioGroupProps>) => (
    <RadioGroup aria-label="Choices" name="choice" onChange={() => {}} options={OPTIONS} value="1" {...props} />
);
// RadioOption folds the description into the control's name, so the first option reads "Option 1 - First".
const radio = (name: string) => screen.getByRole('radio', { name });

describe('RadioGroup (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(screen.getByLabelText('Choices')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-options': () => {
        render(<Subject />);

        expect(screen.getByRole('radiogroup', { name: 'Choices' })).toBeInTheDocument();
        expect(screen.getAllByRole('radio')).toHaveLength(3);
        expect(screen.getByText('First')).toBeInTheDocument();
        expect(radio('Option 1 - First')).toBeInTheDocument();
        screen.getAllByRole('radio').forEach((input) => expect(input).toHaveAttribute('name', 'choice'));
    },
    'checked-value': () => {
        render(<Subject value="3" />);

        expect(radio('Option 3')).toBeChecked();
        expect(radio('Option 1 - First')).not.toBeChecked();
    },
    choose: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.click(radio('Option 3'));
        expect(onChange).toHaveBeenCalledWith('3');
    },
    'arrow-keys': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        radio('Option 1 - First').focus();
        await user.keyboard('{ArrowDown}');
        expect(onChange).toHaveBeenLastCalledWith('3');
    },
    disabled: () => {
        const { rerender } = render(<Subject />);
        expect(radio('Option 2')).toBeDisabled();
        expect(radio('Option 1 - First')).toBeEnabled();

        rerender(<Subject disabled />);
        screen.getAllByRole('radio').forEach((input) => expect(input).toBeDisabled());
    },
    'axe-clean': async () => {
        for (const preset of presets)
            await hasNoBasicA11yIssues(<RadioGroup onChange={() => {}} {...preset.propState} />)();
    },
});
