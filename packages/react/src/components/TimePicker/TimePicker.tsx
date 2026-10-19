import './time-picker.scss';
import { SvgSchedule } from '@ptrn/icons/Schedule';
import { FocusTrap } from 'focus-trap-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { TimePickerListbox } from './Listbox';
import { TimePickerSegment } from './Segment';
import {
    HOUR_OPTIONS,
    MINUTE_OPTIONS,
    MERIDIEM_OPTIONS,
    Meridiem,
    partsToStringValue,
    stringValueToParts,
} from './utils';
import { Button } from '-/components/Button';
import { InputProps } from '-/components/Input';
import { Menu } from '-/components/Menu';
import { Portal } from '-/components/Portal';
import { useFloating } from '-/hooks/useFloating';
import { useId } from '-/hooks/useId';
import { useOutsideClick } from '-/hooks/useOutsideClick';
import { ElementProps, FieldControlProps } from '-/types/common';
import { handleKeyDown } from '-/utils/handleKeyDown';

export type TimePickerProps = FieldControlProps & Pick<InputProps, 'size'>;

/**
 * An input field that allows a customer to manually type in a specific time or triggers a time picker combobox to
 * select a date.
 *
 * For a more complete example with field usage, see the TimePickerField component.
 *
 * @example
 *     import { TimePicker } from '-/components/TimePicker';
 *
 *     () => {
 *         const [value, onChange] = useState<string | undefined>('');
 *
 *         return (
 *             <div style={{ width: 320 }}>
 *                 <Field
 *                     controlId="destination-time"
 *                     helperText="The time picker allows you to select a time."
 *                     label="Time"
 *                 >
 *                     <TimePicker id="destination-time" name="time" onChange={onChange} value={value} />
 *                 </Field>
 *             </div>
 *         );
 *     };
 *
 * @name TimePicker
 * @phase Stable
 */
export function TimePicker({
    value,
    disabled,
    id: idProp,
    invalid = false,
    readOnly,
    name,
    size,
    onChange: onChangeProp,
    'aria-label': ariaLabel = 'Time picker',
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    ...props
}: ElementProps<TimePickerProps, 'div'>) {
    const id = useId(idProp);

    const menuId = `${id}-time-picker-menu`;

    const { hours, minutes, meridiem } = useMemo(() => stringValueToParts(value || '00:00'), [value]);

    const setValue = useCallback(
        (
            params: Partial<{
                hours?: string;
                minutes?: string;
                meridiem?: Meridiem;
            }>,
        ) => {
            const nextValue = { hours, minutes, meridiem, ...params };
            onChangeProp(
                partsToStringValue(nextValue.hours?.toString(), nextValue.minutes?.toString(), nextValue.meridiem),
            );
        },
        [hours, minutes, meridiem, onChangeProp],
    );

    const [open, setOpenState] = useState(false);

    const { floatingStyles, elements } = useFloating({
        strategy: 'fixed',
        refWidth: false,
        offsetOptions: 4,
        hide: !open,
    });

    const setOpen = useCallback(
        (nextOpen: boolean) => {
            setOpenState(nextOpen);

            if (!elements.reference || !buttonRef.current) return;

            // Focus the button when closing the menu
            if (!nextOpen && open) buttonRef.current.focus();

            // Focus the hours listbox when opening the menu
            if (nextOpen && !open)
                elements.reference.querySelector<HTMLElement>('[data-scroll-column="hours"]')?.focus();
        },
        [elements?.reference, open],
    );

    // The toggle is a span, so it guards disabled and read-only itself and answers Enter and Space like a button.
    const toggleOpen = () => {
        if (disabled || readOnly) return;
        setOpen(!open);
    };

    const { hourOptions, minuteOptions, meridiemOptions } = useMemo(
        () => ({
            hourOptions: HOUR_OPTIONS.map((h) => ({
                id: `${id}-hours-${h}`,
                value: h,
                label: h.toString().padStart(2, '0'),
            })),
            minuteOptions: MINUTE_OPTIONS.map((m) => ({
                id: `${id}-minutes-${m}`,
                value: m,
                label: m.toString().padStart(2, '0'),
            })),
            meridiemOptions: MERIDIEM_OPTIONS.map((m) => ({
                id: `${id}-meridiem-${m}`,
                value: m,
                label: m,
            })),
        }),
        [id],
    );

    const listBoxRefs = useRef<{
        hours?: HTMLElement | null;
        minutes?: HTMLElement | null;
        meridiem?: HTMLElement | null;
    } | null>(null);
    const buttonRef = useRef<HTMLElement | null>(null);

    // A press on the toggle is not an outside click, or it would close the popup and the click reopen it.
    useOutsideClick({
        elements: [elements.floating, buttonRef.current],
        callback: () => setOpen(false),
        disabled: !open,
    });

    const [firstField, setFirstField] = useState<HTMLElement | null>(null);

    return (
        <>
            <div
                {...props}
                aria-describedby={ariaErrorMessage || ariaDescribedBy || undefined}
                aria-label={ariaLabel || undefined}
                data-disabled={disabled || undefined}
                data-invalid={invalid || undefined}
                data-name={name || undefined}
                data-open={open || undefined}
                data-pttrn="time-picker"
                data-readonly={readOnly || undefined}
                data-size={size || undefined}
                data-value={value || undefined}
                onClickCapture={() => {
                    if (disabled || readOnly) return;
                    elements.reference?.querySelector<HTMLElement>('[tabIndex]')?.focus();
                }}
                onKeyDownCapture={handleKeyDown({ Escape: () => setOpen(false) })}
                ref={(node) => {
                    elements.setReference(node);
                }}
                role="group"
                tabIndex={-1}
            >
                <input
                    aria-hidden
                    data-sr-only
                    id={id}
                    name={name}
                    onChange={(e) => onChangeProp(e.target.value)}
                    onFocus={() => firstField?.focus()}
                    tabIndex={-1}
                    value={value}
                />
                <TimePickerSegment
                    disabled={disabled}
                    name={`${name}-hours`}
                    onChange={(next) => setValue({ hours: next || undefined })}
                    readOnly={readOnly}
                    setRef={setFirstField}
                    type="hours"
                    value={hours}
                />
                <span aria-hidden="true">:</span>
                <TimePickerSegment
                    disabled={disabled}
                    name={`${name}-minutes`}
                    onChange={(next) => setValue({ minutes: next || undefined })}
                    readOnly={readOnly}
                    type="minutes"
                    value={minutes}
                />
                <TimePickerSegment
                    disabled={disabled}
                    name={`${name}-meridiem`}
                    onChange={(next) => setValue({ meridiem: next || 'AM' })}
                    readOnly={readOnly}
                    type="meridiem"
                    value={meridiem}
                />
                <Button
                    aria-controls={open ? menuId : undefined}
                    aria-disabled={disabled || readOnly || undefined}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    as="span"
                    disabled={disabled || readOnly}
                    icon={<SvgSchedule />}
                    iconOnly
                    innerRef={(node) => {
                        buttonRef.current = node;
                    }}
                    label={`${open ? 'Close' : 'Open'} Time Picker`}
                    onClick={toggleOpen}
                    onKeyDown={handleKeyDown({ Enter: toggleOpen, Space: toggleOpen }, { preventDefault: true })}
                    role="combobox"
                    tabIndex={disabled || readOnly ? -1 : 0}
                    variant="tertiary"
                />
            </div>
            {open && (
                <Portal>
                    <Menu
                        aria-modal="true"
                        id={menuId}
                        innerRef={(node) => {
                            if (!node) return;
                            elements.setFloating(node as HTMLElement);
                        }}
                        label="Select time"
                        onKeyDown={handleKeyDown({ Escape: () => setOpen(false) })}
                        owner="time-picker"
                        role="dialog"
                        style={floatingStyles}
                        width="fit-content"
                    >
                        <FocusTrap
                            focusTrapOptions={{
                                fallbackFocus: () => listBoxRefs.current!.hours!,
                                clickOutsideDeactivates: true,
                            }}
                        >
                            <div
                                data-scroll-values
                                ref={(node) => {
                                    listBoxRefs.current = {
                                        hours: node?.querySelector('[data-scroll-column="hours"]') as HTMLElement,
                                        minutes: node?.querySelector('[data-scroll-column="minutes"]') as HTMLElement,
                                        meridiem: node?.querySelector('[data-scroll-column="meridiem"]') as HTMLElement,
                                    };
                                    const activeHour =
                                        listBoxRefs.current.hours?.querySelector<HTMLElement>('[data-active]');
                                    const activeMinute =
                                        listBoxRefs.current.minutes?.querySelector<HTMLElement>('[data-active]');
                                    const activeMeridiem =
                                        listBoxRefs.current.meridiem?.querySelector<HTMLElement>('[data-active]');
                                    activeHour?.scrollIntoView({ block: 'nearest' });
                                    activeMinute?.scrollIntoView({ block: 'nearest' });
                                    activeMeridiem?.scrollIntoView({ block: 'nearest' });
                                    activeHour?.focus();
                                }}
                            >
                                <TimePickerListbox
                                    onSelect={(next) => {
                                        setValue({ hours: next });
                                        setTimeout(() => listBoxRefs.current?.minutes?.focus(), 10);
                                    }}
                                    options={hourOptions}
                                    selectedValue={hours}
                                    type="hours"
                                />
                                <TimePickerListbox
                                    onSelect={(next) => {
                                        setValue({ minutes: next });
                                        setTimeout(() => listBoxRefs.current?.meridiem?.focus(), 10);
                                    }}
                                    options={minuteOptions}
                                    selectedValue={minutes}
                                    type="minutes"
                                />
                                <TimePickerListbox
                                    onSelect={(next) => {
                                        setValue({ meridiem: next as Meridiem });
                                        setOpen(false);
                                        setTimeout(() => buttonRef.current?.focus(), 10);
                                    }}
                                    options={meridiemOptions}
                                    selectedValue={meridiem}
                                    type="meridiem"
                                />
                            </div>
                        </FocusTrap>
                    </Menu>
                </Portal>
            )}
        </>
    );
}
