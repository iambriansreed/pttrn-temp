import './calendar.scss';
import { SvgChevronLeft } from '@ptrn/icons/ChevronLeft';
import { SvgChevronRight } from '@ptrn/icons/ChevronRight';
import { SvgKeyboardDoubleArrowLeft } from '@ptrn/icons/KeyboardDoubleArrowLeft';
import { SvgKeyboardDoubleArrowRight } from '@ptrn/icons/KeyboardDoubleArrowRight';
import {
    addMonths,
    addYears,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isValid,
    startOfMonth,
    startOfToday,
    startOfWeek,
} from 'date-fns';
import { useMemo, useRef, useState } from 'react';
import { useKeyDownCaptures, optionIdGenerator } from './utils';
import { Button } from '-/components/Button';
import { useId } from '-/hooks/useId';
import { getEventCode } from '-/utils/handleKeyDown';

export type CalendarProps = {
    /**
     * The currently selected date
     *
     * @type Date
     */
    value: Date | undefined;
    /** Fires when the date changes with the new date */
    onChange: (newDate: Date) => void;
    /**
     * When true, keyboard focus is trapped within the calendar component on initial render.
     *
     * Only applicable if the Calendar is used in a popover like in DatePicker.
     *
     * @default false
     */
    focusTrap?: boolean;
    /** The id of the calendar component. */
    id?: string;
};

/**
 * Allows customers to select the date, month, and year.
 *
 * @name Calendar
 * @phase Stable
 */
export function Calendar({ id, value: valueProp, onChange, focusTrap = false }: CalendarProps) {
    const baseId = useId(id);
    const gridId = `${baseId}-grid`;
    const titleId = `${baseId}-title`;
    const generateOptionId = useMemo(() => optionIdGenerator(baseId), [baseId]);

    const firstButtonRef = useRef<HTMLButtonElement | null>(null);
    const lastButtonRef = useRef<HTMLButtonElement | null>(null);
    const gridRef = useRef<HTMLTableSectionElement | null>(null);

    const [activeDate, setActiveDate] = useState<Date>(valueProp && isValid(valueProp) ? valueProp : startOfToday());

    const rows = useMemo(
        () =>
            // generate all days to be shown in the month view
            eachDayOfInterval({
                start: startOfWeek(startOfMonth(activeDate)!, { weekStartsOn: 0 }),
                end: endOfWeek(endOfMonth(activeDate!), { weekStartsOn: 0 }),
            })
                // create groups of 7 for each week
                .reduce<Date[][]>((row, item) => {
                    const previousRow = row[row.length - 1];
                    if (row.length === 0 || previousRow.length === 7) return [...row, [item]];
                    previousRow.push(item);
                    return row;
                }, []),
        [activeDate],
    );

    const [focusDay, setFocusDay] = useState<boolean>(focusTrap);

    const { handleKeyDownCapture } = useKeyDownCaptures({
        activeDate,
        setActiveDate,
        rows,
        focusActiveDay: () => setFocusDay(true),
    });

    return (
        <div data-pttrn="calendar" id={baseId}>
            <div data-header>
                <Button
                    icon={<SvgKeyboardDoubleArrowLeft />}
                    iconOnly={true}
                    innerRef={(node) => (firstButtonRef.current = node)}
                    label="Previous Year"
                    onClick={() => setActiveDate(addYears(activeDate, -1))}
                    onKeyDown={(event: React.KeyboardEvent) => {
                        if (focusTrap && getEventCode(event) === 'Shift+Tab') {
                            event.preventDefault();
                            event.stopPropagation();
                            setFocusDay(true);
                        }
                    }}
                    size="large"
                    variant="tertiary"
                />
                <Button
                    icon={<SvgChevronLeft />}
                    iconOnly={true}
                    label="Previous Month"
                    onClick={() => setActiveDate(addMonths(activeDate, -1))}
                    size="large"
                    variant="tertiary"
                />
                <span data-title id={titleId}>
                    {format(activeDate, 'MMMM yyyy')}
                </span>
                <Button
                    icon={<SvgChevronRight />}
                    iconOnly={true}
                    label="Next Month"
                    onClick={() => setActiveDate(addMonths(activeDate, 1))}
                    size="large"
                    variant="tertiary"
                />
                <Button
                    icon={<SvgKeyboardDoubleArrowRight />}
                    iconOnly={true}
                    innerRef={(node) => (lastButtonRef.current = node)}
                    label="Next Year"
                    onClick={() => setActiveDate(addYears(activeDate, 1))}
                    size="large"
                    variant="tertiary"
                />
            </div>
            {/* The month title names the grid, so assistive technology reads the month before the days. */}
            <table aria-labelledby={titleId} role="grid">
                <thead>
                    <tr>
                        <th abbr="Sunday" scope="col">
                            Sun
                        </th>
                        <th abbr="Monday" scope="col">
                            Mon
                        </th>
                        <th abbr="Tuesday" scope="col">
                            Tue
                        </th>
                        <th abbr="Wednesday" scope="col">
                            Wed
                        </th>
                        <th abbr="Thursday" scope="col">
                            Thu
                        </th>
                        <th abbr="Friday" scope="col">
                            Fri
                        </th>
                        <th abbr="Saturday" scope="col">
                            Sat
                        </th>
                    </tr>
                </thead>
                <tbody
                    id={gridId}
                    onKeyDownCapture={(event) => {
                        handleKeyDownCapture(event);
                        if (focusTrap && getEventCode(event) === 'Tab') {
                            event.preventDefault();
                            event.stopPropagation();
                            firstButtonRef.current?.focus();
                        }
                    }}
                    ref={(node) => (gridRef.current = node)}
                >
                    {rows.map((week) => (
                        <tr key={`week${week[0].toString()}`}>
                            {week.map((date) => {
                                const label = format(date, 'd');
                                const optionId = generateOptionId(date);
                                const isActive = isSameDay(date, activeDate);
                                return (
                                    <td
                                        aria-label={format(date, 'do MMMM yyyy')}
                                        data-selected={isActive || undefined}
                                        id={optionId}
                                        key={date.toString()}
                                        onClick={() => onChange(date)}
                                        ref={(node) => {
                                            if (!focusDay || !isActive || !node) return;
                                            setTimeout(() => {
                                                node.focus({ preventScroll: true });
                                            }, 0);
                                            setFocusDay(false);
                                        }}
                                        role={isActive ? 'gridcell' : undefined}
                                        tabIndex={isActive ? 0 : -1}
                                    >
                                        {label}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
