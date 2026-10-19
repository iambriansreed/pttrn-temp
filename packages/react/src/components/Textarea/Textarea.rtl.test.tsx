import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Textarea, TextareaProps } from './Textarea';
import { spec } from './spec';
import { Field } from '-/components/Field';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen } from '-/rtl/util';

const Subject = (props: Partial<TextareaProps>) => (
    <Textarea aria-label="Example label" name="example-name" onChange={() => {}} value="text value" {...props} />
);
/** A controlled Textarea that keeps what the user types, so the replica sees the whole value. */
// eslint-disable-next-line react/no-multi-comp
const Stateful = (props: Partial<TextareaProps>) => {
    const [value, setValue] = useState('');
    return <Subject {...props} onChange={(next) => setValue(next || '')} value={value} />;
};
const field = () => screen.getByRole('textbox');
const container = () => document.querySelector('[data-pttrn="textarea"]') as HTMLElement;

describe('Textarea (RTL)', () => {
    it('renders', () => {
        render(<Subject />);

        expect(screen.getByLabelText('Example label')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-value': () => {
        render(<Subject placeholder="Notes" />);

        expect(field()).toHaveValue('text value');
        expect(field()).toHaveAttribute('name', 'example-name');
        expect(field()).toHaveAttribute('placeholder', 'Notes');
    },
    typing: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} value="" />);

        await user.type(field(), 'ab');
        expect(onChange.mock.calls.map((call) => call[0])).toEqual(['a', 'b']);
    },
    'auto-grow': async () => {
        const user = userEvent.setup();
        render(<Stateful maxRows={8} minRows={3} />);

        expect(container()).toHaveStyle({ '--min-rows': '3', '--max-rows': '8' });
        await user.type(field(), 'hello');
        // The replica mirrors the value through innerText (jsdom stores it as a plain property).
        const replica = container().querySelector('[data-replicated-value]') as HTMLElement;
        expect(replica.innerText).toContain('hello');
    },
    states: () => {
        const { rerender } = render(<Subject disabled />);
        expect(field()).toBeDisabled();
        expect(container()).toHaveAttribute('data-disabled');

        rerender(<Subject readOnly />);
        expect(field()).toHaveAttribute('readonly');
        expect(container()).toHaveAttribute('data-read-only');

        rerender(<Subject invalid required />);
        expect(field()).toHaveAttribute('aria-invalid', 'true');
        expect(field()).toBeRequired();
        expect(container()).toHaveAttribute('data-invalid');
    },
    labelled: () => {
        render(
            <Field controlId="notes" label="Notes">
                <Textarea id="notes" name="notes" onChange={() => {}} value="" />
            </Field>,
        );

        expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument();
    },
    'axe-clean': hasNoBasicA11yIssues(<Subject />),
});
