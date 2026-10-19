import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { spec } from './spec';
import { Input, InputProps } from '.';
import { Field } from '-/components/Field';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Subject = (props: Partial<InputProps>) => (
    <Input aria-label="Example label" name="input-name" onChange={() => {}} value="text value" {...props} />
);
const input = () => screen.getByRole('textbox');
const container = () => document.querySelector('[data-pttrn="input"]') as HTMLElement;
const clearButton = () => screen.queryByRole('button', { name: 'Clear' });

describe('Input (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(screen.getByLabelText('Example label')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-value': () => {
        render(<Subject placeholder="Type here" />);

        expect(input()).toHaveValue('text value');
        expect(input()).toHaveAttribute('name', 'input-name');
        expect(input()).toHaveAttribute('placeholder', 'Type here');
    },
    typing: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} value="" />);

        await user.type(input(), 'ab');
        expect(onChange.mock.calls.map((call) => call[0])).toEqual(['a', 'b']);
        expect(onChange.mock.calls[0][1]).toHaveProperty('target');
    },
    'clear-button': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.click(clearButton()!);
        expect(onChange).toHaveBeenCalledWith('');
        expect(input()).toHaveFocus();
    },
    'no-clear-button': () => {
        const { rerender } = render(<Subject value="" />);
        expect(clearButton()).toBeNull();

        rerender(<Subject showClearButton={false} />);
        expect(clearButton()).toBeNull();

        rerender(<Subject disabled />);
        expect(clearButton()).toBeNull();

        rerender(<Subject readOnly />);
        expect(clearButton()).toBeNull();
    },
    'leading-trailing': () => {
        render(<Subject leading="$" trailing="%" />);

        expect(container().querySelector('[data-leading]')).toHaveTextContent('$');
        expect(container().querySelector('[data-trailing]')).toHaveTextContent('%');
    },
    states: () => {
        const { rerender } = render(<Subject disabled />);
        expect(input()).toBeDisabled();
        expect(container()).toHaveAttribute('data-disabled');

        rerender(<Subject readOnly />);
        expect(input()).toHaveAttribute('readonly');
        expect(container()).toHaveAttribute('data-readonly');

        rerender(<Subject invalid />);
        expect(input()).toHaveAttribute('aria-invalid', 'true');
        expect(container()).toHaveAttribute('data-invalid');
    },
    labelled: () => {
        const { rerender } = render(
            <Field controlId="email" label="Email address">
                <Input id="email" name="email" onChange={() => {}} value="" />
            </Field>,
        );
        expect(screen.getByRole('textbox', { name: 'Email address' })).not.toHaveAttribute('aria-label');

        rerender(<Subject aria-label="Search" />);
        expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
    },
    'axe-clean': async () => {
        await hasNoBasicA11yIssues(<Subject />)();
        await hasNoBasicA11yIssues(
            <Field controlId="email" helperText="We never share it." label="Email address">
                <Input id="email" name="email" onChange={() => {}} value="a@b.co" />
            </Field>,
        )();
    },
});
