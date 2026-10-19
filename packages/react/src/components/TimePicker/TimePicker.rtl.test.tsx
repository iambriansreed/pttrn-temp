import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { Usage } from './TimePickerExample';
import { spec } from './spec';
import { TimePicker, TimePickerProps } from '.';
import { Field } from '-/components/Field';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { act, fireEvent, render, screen, waitFor, within } from '-/rtl/util';

const Subject = (props: Partial<TimePickerProps>) => (
    <TimePicker aria-label="Time" name="time" onChange={() => {}} value="13:45" {...props} />
);
/** A controlled TimePicker that keeps what the user types or picks, since the field resets to its value prop. */
// eslint-disable-next-line react/no-multi-comp
const Stateful = ({ onChange, value: initial = '13:45', ...props }: Partial<TimePickerProps>) => {
    const [value, setValue] = useState<string | undefined>(initial);
    return (
        <Subject
            {...props}
            onChange={(next) => {
                onChange?.(next);
                setValue(next);
            }}
            value={value}
        />
    );
};

const group = () => screen.getByRole('group', { name: 'Time' });
const segment = (name: string) => screen.getByRole('spinbutton', { name });
const toggle = () => screen.getByRole('combobox');
const popup = () => screen.queryByRole('dialog', { name: 'Select time' });
const listbox = (name: string) => screen.getByRole('listbox', { name });
const option = (list: string, name: string) => within(listbox(list)).getByRole('option', { name });
const hidden = () => document.querySelector('input[name="time"]') as HTMLInputElement;
const isOpen = () => toggle().getAttribute('aria-expanded') === 'true';
// The popup is positioned a tick after it opens and refuses pointer events until then.
const openPopup = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(toggle());
    const dialog = await screen.findByRole('dialog', { name: 'Select time' });
    await waitFor(() => expect(dialog).toHaveStyle({ pointerEvents: 'auto' }));
    return dialog;
};

describe('TimePicker (RTL)', () => {
    it('renders', () => {
        render(<Subject aria-label="Example label" />);

        expect(screen.getByLabelText('Example label')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'shows-value': () => {
        const { rerender } = render(<Subject />);
        expect(segment('hours')).toHaveTextContent('01');
        expect(segment('hours')).toHaveAttribute('aria-valuetext', '01');
        expect(segment('hours')).toHaveAttribute('aria-valuemin', '1');
        expect(segment('hours')).toHaveAttribute('aria-valuemax', '12');
        expect(segment('minutes')).toHaveTextContent('45');
        expect(segment('minutes')).toHaveAttribute('aria-valuemin', '0');
        expect(segment('minutes')).toHaveAttribute('aria-valuemax', '59');
        expect(segment('meridiem')).toHaveTextContent('PM');
        expect(segment('meridiem')).toHaveAttribute('aria-valuetext', 'PM');
        expect(hidden()).toHaveValue('13:45');
        expect(hidden()).toHaveAttribute('name', 'time');
        expect(group()).toHaveAttribute('data-value', '13:45');

        rerender(<Subject value="" />);
        expect(segment('hours')).toHaveTextContent('12');
        expect(segment('minutes')).toHaveTextContent('00');
        expect(segment('meridiem')).toHaveTextContent('AM');
        expect(hidden()).toHaveValue('');
        expect(group()).not.toHaveAttribute('data-value');

        rerender(<Subject value="later" />);
        expect(segment('hours')).toHaveTextContent('--');
        expect(segment('hours')).toHaveAttribute('aria-valuetext', 'Empty');
        expect(segment('minutes')).toHaveTextContent('--');
        expect(segment('minutes')).toHaveAttribute('aria-valuetext', 'Empty');
    },
    labelled: async () => {
        const user = userEvent.setup();
        const { rerender } = render(<Subject aria-label={undefined} />);
        expect(screen.getByRole('group', { name: 'Time picker' })).toBeInTheDocument();

        rerender(<Subject aria-label="Arrival" />);
        expect(screen.getByRole('group', { name: 'Arrival' })).toBeInTheDocument();
        expect(screen.getAllByRole('spinbutton').map((node) => node.getAttribute('aria-label'))).toEqual([
            'hours',
            'minutes',
            'meridiem',
        ]);
        expect(toggle()).toHaveAccessibleName('Open Time Picker');

        rerender(
            <Field controlId="arrival" label="Arrival time">
                <TimePicker id="arrival" name="time" onChange={() => {}} value="13:45" />
            </Field>,
        );
        await user.click(screen.getByText('Arrival time'));
        expect(segment('hours')).toHaveFocus();
    },
    described: () => {
        const { rerender } = render(
            <Field controlId="depart" helperText="Boarding closes ten minutes before." label="Departure">
                <TimePicker
                    aria-describedby="depart-description"
                    id="depart"
                    name="time"
                    onChange={() => {}}
                    value="13:45"
                />
            </Field>,
        );
        const picker = () => screen.getByRole('group', { name: 'Time picker' });
        expect(picker()).toHaveAttribute('aria-describedby', 'depart-description');
        expect(picker()).toHaveAccessibleDescription('Boarding closes ten minutes before.');

        rerender(
            <Field controlId="depart" errorMessage="Choose a time." label="Departure">
                <TimePicker
                    aria-describedby="depart-description"
                    aria-errormessage="depart-field-error"
                    id="depart"
                    invalid
                    name="time"
                    onChange={() => {}}
                    value="13:45"
                />
            </Field>,
        );
        expect(picker()).toHaveAttribute('aria-describedby', 'depart-field-error');
        expect(picker()).toHaveAccessibleDescription('Choose a time.');
    },
    typing: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Stateful onChange={onChange} value="" />);

        segment('hours').focus();
        // A 3 can only be three o'clock, so the hours are complete and focus moves on.
        await user.keyboard('3');
        expect(onChange).toHaveBeenLastCalledWith('03:00');
        expect(segment('minutes')).toHaveFocus();
        await user.keyboard('45');
        expect(onChange).toHaveBeenLastCalledWith('03:45');
        expect(segment('meridiem')).toHaveFocus();
        await user.keyboard('p');
        expect(onChange).toHaveBeenLastCalledWith('15:45');
        expect(segment('meridiem')).toHaveTextContent('PM');
        expect(hidden()).toHaveValue('15:45');

        // A 1 may begin 10, 11 or 12, so the hours wait for a second digit.
        segment('hours').focus();
        await user.keyboard('1');
        expect(onChange).toHaveBeenLastCalledWith('13:45');
        expect(segment('hours')).toHaveFocus();
        await user.keyboard('2');
        expect(onChange).toHaveBeenLastCalledWith('12:45');
        expect(segment('minutes')).toHaveFocus();

        segment('hours').focus();
        await user.keyboard('{Backspace}');
        expect(onChange).toHaveBeenLastCalledWith('');
        expect(hidden()).toHaveValue('');
        await user.keyboard('{Enter}');
        expect(segment('hours')).not.toHaveFocus();
    },
    'arrow-keys': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Stateful onChange={onChange} value="12:59" />);

        segment('hours').focus();
        await user.keyboard('{ArrowUp}');
        expect(onChange).toHaveBeenLastCalledWith('13:59');
        expect(segment('hours')).toHaveTextContent('01');
        await user.keyboard('{ArrowDown}');
        expect(onChange).toHaveBeenLastCalledWith('12:59');

        await user.keyboard('{ArrowRight}');
        expect(segment('minutes')).toHaveFocus();
        await user.keyboard('{ArrowUp}');
        expect(onChange).toHaveBeenLastCalledWith('12:00');
        expect(segment('minutes')).toHaveTextContent('00');

        await user.keyboard('{ArrowRight}');
        expect(segment('meridiem')).toHaveFocus();
        await user.keyboard('{ArrowUp}');
        expect(onChange).toHaveBeenLastCalledWith('00:00');
        expect(segment('meridiem')).toHaveTextContent('AM');

        await user.keyboard('{ArrowLeft}{ArrowLeft}');
        expect(segment('hours')).toHaveFocus();
    },
    'toggle-popup': async () => {
        const user = userEvent.setup();
        render(<Subject />);
        expect(isOpen()).toBe(false);
        expect(toggle()).toHaveAttribute('aria-haspopup', 'dialog');
        expect(toggle()).not.toHaveAttribute('aria-controls');
        expect(popup()).not.toBeInTheDocument();
        expect(group()).not.toHaveAttribute('data-open');

        const dialog = await openPopup(user);
        expect(isOpen()).toBe(true);
        expect(toggle()).toHaveAttribute('aria-controls', dialog.id);
        expect(toggle()).toHaveAccessibleName('Close Time Picker');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(group()).toHaveAttribute('data-open');
        await waitFor(() => expect(listbox('Select hours')).toHaveFocus());
        expect(within(listbox('Select hours')).getAllByRole('option')).toHaveLength(12);
        expect(within(listbox('Select minutes')).getAllByRole('option')).toHaveLength(12);
        expect(within(listbox('Select meridiem')).getAllByRole('option')).toHaveLength(2);
        expect(option('Select hours', '01')).toHaveAttribute('aria-selected', 'true');
        expect(option('Select hours', '02')).toHaveAttribute('aria-selected', 'false');
        expect(option('Select minutes', '45')).toHaveAttribute('aria-selected', 'true');
        expect(option('Select meridiem', 'PM')).toHaveAttribute('aria-selected', 'true');

        await user.click(toggle());
        await waitFor(() => expect(isOpen()).toBe(false));
        expect(popup()).not.toBeInTheDocument();
        expect(toggle()).not.toHaveAttribute('aria-controls');
    },
    'pick-time': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Stateful onChange={onChange} />);

        await openPopup(user);
        await user.click(option('Select hours', '03'));
        expect(onChange).toHaveBeenLastCalledWith('15:45');
        await waitFor(() => expect(listbox('Select minutes')).toHaveFocus());

        await user.click(option('Select minutes', '30'));
        expect(onChange).toHaveBeenLastCalledWith('15:30');
        await waitFor(() => expect(listbox('Select meridiem')).toHaveFocus());

        await user.click(option('Select meridiem', 'AM'));
        expect(onChange).toHaveBeenLastCalledWith('03:30');
        await waitFor(() => expect(isOpen()).toBe(false));
        await waitFor(() => expect(toggle()).toHaveFocus());
        expect(hidden()).toHaveValue('03:30');
        expect(segment('hours')).toHaveTextContent('03');
        expect(segment('minutes')).toHaveTextContent('30');
        expect(segment('meridiem')).toHaveTextContent('AM');
    },
    'listbox-keyboard': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Stateful onChange={onChange} />);

        await user.tab();
        await user.tab();
        await user.tab();
        await user.tab();
        expect(toggle()).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(isOpen()).toBe(true);
        const hours = await screen.findByRole('listbox', { name: 'Select hours' });
        await waitFor(() => expect(hours).toHaveFocus());
        expect(hours).toHaveAttribute('aria-activedescendant', option('Select hours', '01').id);

        await user.keyboard('{ArrowDown}');
        expect(hours).toHaveAttribute('aria-activedescendant', option('Select hours', '02').id);
        await user.keyboard('{ArrowUp}{ArrowUp}');
        expect(hours).toHaveAttribute('aria-activedescendant', option('Select hours', '12').id);
        await user.keyboard('{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('12:45');
        await waitFor(() => expect(listbox('Select minutes')).toHaveFocus());

        await user.keyboard('{ArrowDown}');
        expect(listbox('Select minutes')).toHaveAttribute('aria-activedescendant', option('Select minutes', '50').id);
        await user.keyboard(' ');
        expect(onChange).toHaveBeenLastCalledWith('12:50');
        await waitFor(() => expect(listbox('Select meridiem')).toHaveFocus());

        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('00:50');
        await waitFor(() => expect(isOpen()).toBe(false));
        await waitFor(() => expect(toggle()).toHaveFocus());

        await user.keyboard(' ');
        expect(isOpen()).toBe(true);
    },
    'escape-closes': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        // Focusing the toggle shows its tooltip, so the focus call needs act.
        act(() => toggle().focus());
        await user.keyboard('{Enter}');
        await screen.findByRole('dialog', { name: 'Select time' });
        await waitFor(() => expect(listbox('Select hours')).toHaveFocus());

        await user.keyboard('{Escape}');
        await waitFor(() => expect(isOpen()).toBe(false));
        expect(popup()).not.toBeInTheDocument();
        await waitFor(() => expect(toggle()).toHaveFocus());
    },
    'outside-click-closes': async () => {
        const user = userEvent.setup();
        render(
            <>
                <Subject />
                <p>Outside</p>
            </>,
        );

        await openPopup(user);
        fireEvent.mouseDown(screen.getByText('Outside'));
        await waitFor(() => expect(isOpen()).toBe(false));
        expect(popup()).not.toBeInTheDocument();
    },
    states: async () => {
        const user = userEvent.setup();
        const { rerender } = render(<Subject disabled />);
        expect(group()).toHaveAttribute('data-disabled');
        screen.getAllByRole('spinbutton').forEach((node) => {
            expect(node).toHaveAttribute('aria-disabled', 'true');
            expect(node).toHaveAttribute('contenteditable', 'false');
            expect(node).toHaveAttribute('tabindex', '-1');
        });
        expect(toggle()).toHaveAttribute('aria-disabled', 'true');
        expect(toggle()).toHaveAttribute('tabindex', '-1');
        await user.click(toggle());
        expect(isOpen()).toBe(false);

        rerender(<Subject readOnly />);
        expect(group()).toHaveAttribute('data-readonly');
        expect(group()).not.toHaveAttribute('data-disabled');
        screen.getAllByRole('spinbutton').forEach((node) => {
            expect(node).toHaveAttribute('aria-readonly', 'true');
            expect(node).toHaveAttribute('contenteditable', 'false');
            expect(node).toHaveAttribute('tabindex', '-1');
        });
        expect(toggle()).toHaveAttribute('aria-disabled', 'true');
        await user.click(toggle());
        expect(isOpen()).toBe(false);

        rerender(<Subject invalid size="small" />);
        expect(group()).toHaveAttribute('data-invalid');
        expect(group()).toHaveAttribute('data-size', 'small');
        expect(group()).not.toHaveAttribute('data-readonly');
        expect(segment('hours')).toHaveAttribute('contenteditable', 'true');
        expect(segment('hours')).toHaveAttribute('tabindex', '0');
        expect(toggle()).not.toHaveAttribute('aria-disabled');
    },
    'axe-clean': async () => {
        // The popup renders in a portal, so the open field is checked on the whole page before anything else renders.
        const user = userEvent.setup();
        const { unmount } = render(<Subject />);
        await openPopup(user);
        expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
        unmount();

        await hasNoBasicA11yIssues(<Subject />)();
        await hasNoBasicA11yIssues(<Usage />)();
    },
});
