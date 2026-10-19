import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';
import { Calendar, CalendarProps } from './Calendar';
import { presets } from './CalendarExample';
import { spec } from './spec';
import { hasNoBasicA11yIssues } from '-/rtl/hasNoBasicA11yIssues';
import { describeBehaviors } from '-/rtl/spec';
import { render, screen, waitFor } from '-/rtl/util';

// Monday 10 June 2024. The grid covers that month in six weeks, from Sunday 26 May to Saturday 6 July.
const JUNE_10 = new Date(2024, 5, 10);

const Subject = (props: Partial<CalendarProps>) => <Calendar onChange={() => {}} value={JUNE_10} {...props} />;

const title = () => document.querySelector('[data-title]') as HTMLElement;
const button = (name: string) => screen.getByRole('button', { name });
// A day is a cell named with its full date.
const day = (label: string) => screen.getByLabelText(label);
const days = () => Array.from(document.querySelectorAll('tbody td'));
// Focus follows the active day a tick after it moves.
const expectActive = (label: string) =>
    waitFor(() => {
        expect(day(label)).toHaveAttribute('data-selected');
        expect(day(label)).toHaveFocus();
    });
// Long enough for the focus the component schedules on mount, when it schedules one.
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Calendar (RTL)', () => {
    presets.forEach((preset) => {
        it(
            `has no basic a11y issues - ${preset.label}`,
            hasNoBasicA11yIssues(<Calendar {...preset.propState} onChange={() => {}} />),
        );
    });

    it('renders', () => {
        const { getByText } = render(<Calendar {...presets[0].propState} onChange={() => {}} />);

        expect(getByText(format(presets[0].propState.value!, 'MMMM yyyy'))).toBeInTheDocument();
    });
});

describeBehaviors(spec, {
    'renders-month': () => {
        render(<Subject />);

        expect(title()).toHaveTextContent('June 2024');
        expect(screen.getByRole('grid', { name: 'June 2024' })).toBeInTheDocument();

        const headers = screen.getAllByRole('columnheader');
        expect(headers.map((header) => header.textContent)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
        expect(headers[0]).toHaveAttribute('abbr', 'Sunday');
        expect(headers[6]).toHaveAttribute('abbr', 'Saturday');

        // One header row and six weeks.
        expect(screen.getAllByRole('row')).toHaveLength(7);
        expect(days()).toHaveLength(42);
        expect(days()[0]).toHaveAttribute('aria-label', '26th May 2024');
        expect(days()[41]).toHaveAttribute('aria-label', '6th July 2024');
        expect(day('1st June 2024')).toBeInTheDocument();
        expect(day('30th June 2024')).toBeInTheDocument();
    },
    'highlights-value': () => {
        const withValue = render(<Subject />);
        expect(day('10th June 2024')).toHaveAttribute('data-selected');
        expect(day('10th June 2024')).toHaveAttribute('role', 'gridcell');
        expect(day('10th June 2024')).toHaveAttribute('tabindex', '0');
        expect(day('11th June 2024')).not.toHaveAttribute('data-selected');
        expect(day('11th June 2024')).toHaveAttribute('tabindex', '-1');
        expect(document.querySelectorAll('[data-selected]')).toHaveLength(1);

        // The value seeds the active day on mount, so each case needs its own mount.
        withValue.unmount();
        const today = new Date();
        const withoutValue = render(<Subject value={undefined} />);
        expect(title()).toHaveTextContent(format(today, 'MMMM yyyy'));
        expect(day(format(today, 'do MMMM yyyy'))).toHaveAttribute('data-selected');

        withoutValue.unmount();
        render(<Subject value={new Date(NaN)} />);
        expect(day(format(today, 'do MMMM yyyy'))).toHaveAttribute('data-selected');
    },
    'choose-day': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.click(day('15th June 2024'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(new Date(2024, 5, 15));

        await user.click(day('26th May 2024'));
        expect(onChange).toHaveBeenLastCalledWith(new Date(2024, 4, 26));
    },
    'month-year-buttons': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        await user.click(button('Next Month'));
        expect(title()).toHaveTextContent('July 2024');
        expect(screen.getByRole('grid', { name: 'July 2024' })).toBeInTheDocument();
        expect(day('10th July 2024')).toHaveAttribute('data-selected');

        await user.click(button('Previous Month'));
        await user.click(button('Previous Month'));
        expect(title()).toHaveTextContent('May 2024');

        await user.click(button('Next Year'));
        expect(title()).toHaveTextContent('May 2025');

        await user.click(button('Previous Year'));
        expect(title()).toHaveTextContent('May 2024');
        expect(day('10th May 2024')).toHaveAttribute('data-selected');
        expect(onChange).not.toHaveBeenCalled();
    },
    'arrow-keys': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        day('10th June 2024').focus();
        await user.keyboard('{ArrowRight}');
        await expectActive('11th June 2024');
        expect(day('11th June 2024')).toHaveAttribute('tabindex', '0');
        expect(day('10th June 2024')).not.toHaveAttribute('data-selected');
        expect(day('10th June 2024')).toHaveAttribute('tabindex', '-1');

        await user.keyboard('{ArrowDown}');
        await expectActive('18th June 2024');
        await user.keyboard('{ArrowLeft}');
        await expectActive('17th June 2024');
        await user.keyboard('{ArrowUp}');
        await expectActive('10th June 2024');

        // Two weeks up crosses into May, and the grid follows.
        await user.keyboard('{ArrowUp}');
        await expectActive('3rd June 2024');
        await user.keyboard('{ArrowUp}');
        await expectActive('27th May 2024');
        expect(title()).toHaveTextContent('May 2024');
        expect(screen.getByRole('grid', { name: 'May 2024' })).toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();
    },
    'home-end-page-keys': async () => {
        const user = userEvent.setup();
        render(<Subject value={new Date(2024, 5, 12)} />);

        day('12th June 2024').focus();
        await user.keyboard('{Home}');
        await expectActive('9th June 2024');
        await user.keyboard('{End}');
        await expectActive('15th June 2024');

        await user.keyboard('{PageDown}');
        await expectActive('15th July 2024');
        expect(title()).toHaveTextContent('July 2024');
        await user.keyboard('{PageUp}');
        await expectActive('15th June 2024');
        expect(title()).toHaveTextContent('June 2024');
    },
    'keyboard-choose': async () => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Subject onChange={onChange} />);

        day('10th June 2024').focus();
        await user.keyboard('{Enter}');
        expect(onChange).toHaveBeenCalledWith(new Date(2024, 5, 10));

        await user.keyboard('{ArrowRight}');
        await expectActive('11th June 2024');
        await user.keyboard(' ');
        expect(onChange).toHaveBeenLastCalledWith(new Date(2024, 5, 11));
        expect(onChange).toHaveBeenCalledTimes(2);
    },
    'focus-trap': async () => {
        const user = userEvent.setup();
        const trapped = render(<Subject focusTrap />);

        await expectActive('10th June 2024');
        await user.tab();
        expect(button('Previous Year')).toHaveFocus();
        await user.tab({ shift: true });
        await expectActive('10th June 2024');

        trapped.unmount();
        render(
            <>
                <Subject />
                <button type="button">After</button>
            </>,
        );
        await tick();
        expect(document.body).toHaveFocus();
        day('10th June 2024').focus();
        await user.tab();
        expect(button('After')).toHaveFocus();
        await user.tab({ shift: true });
        expect(day('10th June 2024')).toHaveFocus();
        await user.tab({ shift: true });
        expect(button('Next Year')).toHaveFocus();
    },
    ids: () => {
        render(<Subject id="cal" />);

        expect(document.getElementById('cal')).toHaveAttribute('data-pttrn', 'calendar');
        expect(title()).toHaveAttribute('id', 'cal-title');
        expect(screen.getByRole('grid')).toHaveAttribute('aria-labelledby', 'cal-title');
        expect(day('10th June 2024')).toHaveAttribute('id', 'cal-option-06-10-2024');
        expect(day('26th May 2024')).toHaveAttribute('id', 'cal-option-05-26-2024');
    },
    'axe-clean': async () => {
        for (const preset of presets) {
            await hasNoBasicA11yIssues(<Calendar {...preset.propState} onChange={() => {}} />)();
        }
    },
});
