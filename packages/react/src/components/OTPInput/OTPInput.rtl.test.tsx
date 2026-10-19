import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { OTPInput, OTPInputProps } from './OTPInput';
import { presets } from './OTPInputExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Subject = (props: Partial<OTPInputProps>) => <OTPInput name="code" onChange={() => {}} {...props} />;

const group = () => document.querySelector('[data-pttrn="otp-input"]') as HTMLElement;
const cells = () => Array.from(document.querySelectorAll<HTMLInputElement>('[data-digit]'));
const values = () => cells().map((input) => input.value);
// Every cell is labelled with its position, counted from one.
const cell = (position: number) => screen.getByLabelText(`OTP input digit ${position}`) as HTMLInputElement;

describe('OTPInput (RTL)', () => {
    it('renders', () => {
        const { getByLabelText } = render(
            <OTPInput aria-label="OTP input" onChange={() => {}} {...presets[0].propState} />,
        );

        expect(getByLabelText('OTP input digit 1')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-cells': () => {
        render(<Subject defaultValue="12" length={4} />);

        expect(screen.getByRole('group', { name: 'OTP input' })).toBeInTheDocument();
        const inputs = screen.getAllByRole('textbox');
        expect(inputs).toHaveLength(4);
        inputs.forEach((input, index) => {
            expect(input).toHaveAccessibleName(`OTP input digit ${index + 1}`);
            expect(input).toHaveAttribute('maxlength', '1');
            expect(input).toHaveAttribute('autocomplete', 'off');
        });
        expect(values()).toEqual(['1', '2', '', '']);
    },
    'field-attributes': () => {
        render(
            <>
                <Subject aria-describedby="hint" aria-errormessage="error" id="code-id" invalid />
                <p id="hint">The six digits we sent you.</p>
                <p id="error">That code is wrong.</p>
            </>,
        );

        expect(cell(1)).toHaveAttribute('id', 'code-id');
        expect(cell(1)).toHaveAttribute('name', 'code');
        expect(cell(1)).toHaveAccessibleDescription('The six digits we sent you.');
        expect(cell(1)).toHaveAttribute('aria-errormessage', 'error');
        expect(cell(1)).toHaveAttribute('aria-invalid', 'true');
        expect(cell(2)).toHaveAttribute('name', 'code-1');
        expect(cell(2)).not.toHaveAttribute('aria-describedby');
        expect(cell(2)).not.toHaveAttribute('aria-errormessage');
        expect(cell(2)).not.toHaveAttribute('aria-invalid');
        expect(cell(6)).toHaveAttribute('name', 'code-5');
    },
    'typing-advances': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        await user.click(cell(1));
        await user.keyboard('12');
        expect(values()).toEqual(['1', '2', '', '', '', '']);
        expect(cell(3)).toHaveFocus();
    },
    'onchange-when-complete': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject length={4} onChange={onChange} />);

        await user.click(cell(1));
        await user.keyboard('123');
        expect(onChange).not.toHaveBeenCalled();

        await user.keyboard('4');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('1234');
        expect(cell(4)).toHaveFocus();
    },
    'numeric-only': async () => {
        const user = userEvent.setup();
        const { rerender } = render(<Subject />);

        expect(cell(1)).toHaveAttribute('inputmode', 'numeric');
        await user.click(cell(1));
        await user.keyboard('a');
        expect(cell(1)).toHaveValue('');
        expect(cell(1)).toHaveFocus();
        await user.keyboard('7');
        expect(cell(1)).toHaveValue('7');
        expect(cell(2)).toHaveFocus();

        rerender(<Subject alphanumeric />);
        expect(cell(2)).toHaveAttribute('inputmode', 'text');
        await user.keyboard('b');
        expect(cell(2)).toHaveValue('b');
        expect(cell(3)).toHaveFocus();
    },
    backspace: async () => {
        const user = userEvent.setup();
        render(<Subject defaultValue="123" length={4} />);

        await user.click(cell(3));
        await user.keyboard('{Backspace}');
        expect(values()).toEqual(['1', '2', '', '']);
        expect(cell(3)).toHaveFocus();

        await user.keyboard('{Backspace}');
        expect(values()).toEqual(['1', '', '', '']);
        expect(cell(2)).toHaveFocus();
    },
    'arrow-keys': async () => {
        const user = userEvent.setup();
        render(<Subject defaultValue="12" length={4} />);

        await user.click(cell(3));
        await user.keyboard('{ArrowRight}');
        expect(cell(3)).toHaveFocus();
        await user.keyboard('{ArrowLeft}');
        expect(cell(2)).toHaveFocus();
        await user.keyboard('{ArrowUp}');
        expect(cell(1)).toHaveFocus();
        await user.keyboard('{ArrowDown}');
        expect(cell(2)).toHaveFocus();
    },
    paste: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.click(cell(1));
        await user.paste('1234');
        expect(values()).toEqual(['1', '2', '3', '4', '', '']);
        expect(cell(5)).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();

        await user.paste('56789');
        expect(values()).toEqual(['1', '2', '3', '4', '5', '6']);
        expect(cell(6)).toHaveFocus();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('123456');
    },
    'focus-order': async () => {
        const user = userEvent.setup();
        render(<Subject defaultValue="12" length={4} />);

        expect(cells().map((input) => input.tabIndex)).toEqual([0, 0, 0, -1]);
        expect(cell(3)).not.toHaveAttribute('data-not-selectable');
        expect(cell(4)).toHaveAttribute('data-not-selectable');

        await user.tab();
        expect(cell(1)).toHaveFocus();
        await user.tab();
        await user.tab();
        expect(cell(3)).toHaveFocus();
        await user.tab();
        expect(document.body).toHaveFocus();

        await user.click(cell(4));
        expect(cell(3)).toHaveFocus();
    },
    secure: () => {
        render(<Subject defaultValue="12" length={4} secure />);

        expect(group()).toHaveAttribute('data-secure');
        cells().forEach((input) => expect(input).toHaveAttribute('type', 'password'));
        const dots = Array.from(document.querySelectorAll('[data-dot]'));
        expect(dots).toHaveLength(4);
        expect(dots.map((dot) => dot.querySelector('svg') !== null)).toEqual([true, true, false, false]);
    },
    states: () => {
        const { rerender } = render(<Subject disabled />);
        expect(group()).toHaveAttribute('data-size', 'medium');
        expect(group()).toHaveAttribute('data-disabled');
        cells().forEach((input) => expect(input).toBeDisabled());

        rerender(<Subject readOnly size="small" />);
        expect(group()).toHaveAttribute('data-size', 'small');
        expect(group()).toHaveAttribute('data-readonly');
        expect(group()).not.toHaveAttribute('data-disabled');
        cells().forEach((input) => expect(input).toHaveAttribute('readonly'));

        rerender(<Subject invalid required />);
        expect(group()).toHaveAttribute('data-invalid');
        expect(group()).not.toHaveAttribute('data-readonly');
        cells().forEach((input) => expect(input).toBeRequired());
    },
    'axe-clean': async () => {
        for (const preset of presets) {
            await hasNoBasicA11yIssues(<OTPInput onChange={() => {}} {...preset.propState} />)();
        }
    },
});
