import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { DatePicker, DatePickerProps } from './DatePicker';
import { spec } from './spec';
import { describeBehaviors } from '-/rtl/spec';
import { fireEvent, render, screen, waitFor } from '-/rtl/util';

const Subject = (props: Partial<DatePickerProps>) => (
    <DatePicker id="date" name="date" onChange={() => {}} value="06/03/1985" {...props} />
);

const input = () => screen.getByRole('textbox', { name: 'Enter or choose date' });
const toggle = () => screen.getByRole('button', { name: 'Toggle calendar' });
const calendar = () => screen.queryByRole('dialog', { name: 'Choose Date' });
// The popup is positioned a tick after it mounts: role queries skip it and it refuses pointer events until then.
const openCalendar = async () => {
    const dialog = await screen.findByRole('dialog', { name: 'Choose Date' });
    await waitFor(() => expect(dialog).toHaveStyle({ pointerEvents: 'auto' }));
    return dialog;
};
// A day is a cell labelled with its full date.
const day = (label: string) => screen.findByLabelText(label);

describe('DatePicker (RTL)', () => {
    it('renders', () => {
        render(<Subject placeholder="Select Date" />);

        expect(screen.getByPlaceholderText('Select Date')).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-input': () => {
        render(<Subject />);

        expect(input()).toHaveValue('06/03/1985');
        expect(input()).toHaveAttribute('placeholder', 'mm/dd/yyyy');
    },
    typing: async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} value="" />);

        await user.type(input(), '12');
        expect(onChange.mock.calls.map((call) => call[0])).toEqual(['1', '2']);
    },
    'toggle-calendar': async () => {
        const user = userEvent.setup();
        render(<Subject />);

        expect(calendar()).not.toBeInTheDocument();
        await user.click(toggle());
        expect(await openCalendar()).toHaveAttribute('aria-modal', 'true');
        await waitFor(() => expect(calendar()).toContainElement(document.activeElement as HTMLElement));

        await user.click(toggle());
        await waitFor(() => expect(calendar()).not.toBeInTheDocument());
    },
    'pick-date': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.click(toggle());
        await openCalendar();
        await user.click(await day('15 June 1985'));
        expect(onChange).toHaveBeenCalledWith('06/15/1985');
        await waitFor(() => expect(calendar()).not.toBeInTheDocument());
    },
    'stays-open': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject closeCalendarOnChange={false} onChange={onChange} />);

        await user.click(toggle());
        await openCalendar();
        await user.click(await day('15 June 1985'));
        expect(onChange).toHaveBeenCalledWith('06/15/1985');
        expect(calendar()).toBeInTheDocument();
    },
    'calendar-shows-value': async () => {
        const user = userEvent.setup();
        const selected = () => Array.from(calendar()!.querySelectorAll('[data-selected], [aria-selected]'));
        const { unmount } = render(<Subject />);

        await user.click(toggle());
        expect(await openCalendar()).toHaveTextContent('June 1985');
        expect(selected()).toEqual([await day('3 June 1985')]);
        unmount();

        // Today is only where the calendar opens: with nothing typed, nothing is chosen.
        render(<Subject value="" />);
        await user.click(toggle());
        expect(await openCalendar()).toHaveTextContent(format(new Date(), 'MMMM yyyy'));
        expect(await day(format(new Date(), 'd MMMM yyyy'))).toHaveAttribute('tabindex', '0');
        expect(selected()).toHaveLength(0);
    },
    'outside-click-closes': async () => {
        const user = userEvent.setup();
        render(
            <>
                <Subject />
                <p>Outside</p>
            </>,
        );

        await user.click(toggle());
        expect(await openCalendar()).toBeInTheDocument();
        fireEvent.mouseDown(screen.getByText('Outside'));
        await waitFor(() => expect(calendar()).not.toBeInTheDocument());
    },
    'disabled-readonly': () => {
        const { rerender } = render(<Subject disabled />);
        expect(input()).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'Toggle calendar' })).not.toBeInTheDocument();

        rerender(<Subject readOnly />);
        expect(input()).toHaveAttribute('readonly');
        expect(screen.queryByRole('button', { name: 'Toggle calendar' })).not.toBeInTheDocument();
    },
    'axe-clean': async () => {
        const user = userEvent.setup();
        const { container } = render(<Subject />);
        await user.click(toggle());
        const { axe } = await import('jest-axe');
        expect(await axe(container)).toHaveNoViolations();
    },
});
