import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { presets } from './CheckboxGroupFieldExample';
import { spec } from './spec';
import { CheckboxGroupField, CheckboxGroupFieldProps } from '.';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const OPTIONS = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
];
const Subject = (props: Partial<CheckboxGroupFieldProps>) => (
    <CheckboxGroupField
        label="Example field label"
        name="example-field-name"
        onChange={() => {}}
        options={OPTIONS}
        value={[]}
        {...props}
    />
);
const control = () => document.querySelector('[data-pttrn="checkbox-group"]') as HTMLElement;
const inputs = () => screen.getAllByRole('checkbox');

describe('CheckboxGroupField (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(screen.getAllByText('Example field label')[0]).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'legend-names-group': () => {
        render(<Subject />);

        const fieldset = screen.getByRole('group', { name: 'Example field label' });
        expect(fieldset.tagName).toBe('FIELDSET');
        expect(fieldset).toContainElement(control());
        expect(control()).toHaveAttribute('role', 'group');
        expect(inputs()).toHaveLength(3);
    },
    'helper-text': () => {
        render(<Subject helperText="Pick what applies" />);

        expect(screen.getByText('Pick what applies')).toBeInTheDocument();
        expect(control()).toHaveAccessibleDescription('Pick what applies');
    },
    'error-message': () => {
        render(<Subject errorMessage="Choose one" helperText="Pick what applies" />);

        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Choose one');
        expect(screen.queryByText('Pick what applies')).not.toBeInTheDocument();
        inputs().forEach((input) => {
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(input).toHaveAttribute('aria-errormessage', alert.id);
        });
    },
    required: () => {
        render(<Subject required />);

        expect(screen.getByRole('group', { name: 'Example field label (Required)' })).toBeInTheDocument();
        inputs().forEach((input) => expect(input).toBeRequired());
    },
    'label-trailing': () => {
        render(<Subject labelTrailing="Optional" />);

        expect(screen.getByText('Optional')).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByRole('group', { name: 'Example field label' })).toBeInTheDocument();
    },
    chooses: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.click(screen.getByRole('checkbox', { name: 'Option 2' }));
        expect(onChange).toHaveBeenCalledWith(['2']);
    },
    'axe-clean': async () => {
        for (const preset of presets)
            await hasNoBasicA11yIssues(<CheckboxGroupField onChange={() => {}} {...preset.propState} />)();
        await hasNoBasicA11yIssues(<Subject errorMessage="Choose one" />)();
    },
});
