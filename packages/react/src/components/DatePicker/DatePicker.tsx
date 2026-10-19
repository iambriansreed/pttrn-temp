import './date-picker.scss';
import { SvgEvent } from '@ptrn/icons/Event';
import { format, startOfToday } from 'date-fns';
import { useMemo, useState } from 'react';
import { Button } from '-/components/Button';
import { Calendar, parseDate } from '-/components/Calendar';
import { Input, InputProps } from '-/components/Input';
import { useFloating } from '-/hooks/useFloating';
import { useOutsideClick } from '-/hooks/useOutsideClick';
import { FieldControlProps } from '-/types/common';

export type DatePickerProps = Omit<FieldControlProps, 'aria-label' | 'onChange' | 'value'> &
    Pick<InputProps, 'size'> & {
        /**
         * If the calendar should close when a date is selected.
         *
         * @default true
         */
        closeCalendarOnChange?: boolean;
        /**
         * The placeholder text for the date input field.
         *
         * @default mm/dd/yyyy
         */
        placeholder?: string;
        /**
         * The currently selected date formatted as 'MM/dd/yyyy'.
         *
         * @type string
         */
        value?: string;
        /** Fires when the date changes with the new date */
        onChange: (next: string) => void;
        /**
         * The aria-label attribute for the date input field.
         *
         * @default Enter or choose date
         */
        'aria-label'?: string;
    };

/**
 * An input that allows a customer to manually type in a specific date or triggers a the Calendar component to select a
 * date.
 *
 * For a more complete example with field usage, see the DatePickerField component.
 *
 * @example
 *     import { DatePicker } from '-/components/DatePicker';
 *
 *     () => {
 *         const [fieldDate, setFieldDate] = useState<string>();
 *
 *         return (
 *             <div style={{ width: 320 }}>
 *                 <Field controlId="date1" helperText="The date picker allows you to select a date." label="Date">
 *                     <DatePicker id="date1" name="date1" onChange={setFieldDate} required value={fieldDate} />
 *                 </Field>
 *             </div>
 *         );
 *     };
 *
 * @name DatePicker
 * @phase Stable
 */
export function DatePicker({
    value,
    onChange,
    disabled,
    readOnly,
    closeCalendarOnChange = true,
    name,
    placeholder,
    invalid,
    required = false,
    size,
    id,
    'aria-label': ariaLabel = 'Enter or choose date',
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
}: DatePickerProps) {
    const [calendarVisible, setCalendarVisible] = useState(false);

    const { elements, floatingStyles } = useFloating({
        placement: 'bottom-start',
        strategy: 'absolute',
        offsetOptions: 4,
        refWidth: false,
    });

    // The field (with its toggle) counts as inside: the toggle's own click closes the calendar.
    useOutsideClick({
        elements: [elements.floating, elements.reference],
        callback: () => setCalendarVisible(false),
        disabled: !calendarVisible,
    });

    const calendarId = `${id}-calendar`;

    const activeDate = useMemo(() => parseDate(value) || startOfToday(), [value]);

    return (
        <div
            data-pttrn="date-picker"
            ref={(node) => {
                elements.setReference(node);
            }}
        >
            <Input
                aria-describedby={ariaDescribedBy || undefined}
                aria-errormessage={ariaErrorMessage || undefined}
                aria-label={ariaLabel}
                disabled={disabled || undefined}
                id={id}
                invalid={invalid || undefined}
                name={name}
                onChange={onChange}
                placeholder={placeholder || 'mm/dd/yyyy'}
                readOnly={readOnly}
                required={required}
                showClearButton={false}
                size={size}
                trailing={
                    !disabled &&
                    !readOnly && (
                        <Button
                            icon={<SvgEvent />}
                            iconOnly
                            label="Toggle calendar"
                            onClick={() => setCalendarVisible((prev) => !prev)}
                            variant="tertiary"
                        />
                    )
                }
                value={typeof value === 'string' ? value : ''}
            />
            {calendarVisible && (
                <div
                    aria-label="Choose Date"
                    aria-modal="true"
                    data-pttrn="calendar-popup"
                    ref={(node) => elements.setFloating(node)}
                    role="dialog"
                    style={{ ...floatingStyles }}
                >
                    <Calendar
                        focusTrap
                        id={calendarId}
                        onChange={(next) => {
                            if (closeCalendarOnChange) setCalendarVisible(false);
                            onChange(format(next, 'MM/dd/yyyy'));
                        }}
                        value={activeDate}
                    />
                </div>
            )}
        </div>
    );
}
