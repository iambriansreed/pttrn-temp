import { useCallback, useEffect, useRef } from 'react';
import { bound } from '-/utils/bound';
import { handleKeyDown } from '-/utils/handleKeyDown';

export const MINUTE_BOUNDS = { min: 0, max: 59 } as const;
export const HOUR_BOUNDS = { min: 1, max: 12 } as const;

export const NUMBER_PLACEHOLDER = '--' as const;

export type TimePickerType = 'hours' | 'meridiem' | 'minutes';

export type TimePickerSegmentProps<T extends string> = {
    disabled?: boolean;
    name: string;
    readOnly?: boolean;
    value?: T;
    type: TimePickerType;
    onChange: (value: T | null) => void;
    setRef?: (element: HTMLElement | null) => void;
};

/**
 * TimePickerSegment component displays an individual segment of a time picker (hours, minutes, or meridiem).
 *
 * @name TimePickerSegment
 * @parent TimePicker
 */
export function TimePickerSegment<T extends string>({
    disabled,
    name,
    readOnly,
    value: valueProp,
    type: kind,
    onChange,
    setRef,
}: TimePickerSegmentProps<T>) {
    const ref = useRef<HTMLElement | null>(null);

    const selectAll = (element: HTMLElement | null = ref.current) => {
        if (!element) return;
        setTimeout(() => {
            window.getSelection()?.selectAllChildren(element);
        }, 10);
    };

    const valueToContent = useCallback(
        (value: number | string | undefined) => {
            if (kind === 'meridiem') return value?.toString() || 'AM';
            if (typeof value === 'undefined') return NUMBER_PLACEHOLDER;
            const boundedValue = bound({
                num: value,
                rollover: true,
                ...(kind === 'hours' ? HOUR_BOUNDS : MINUTE_BOUNDS),
            });
            return boundedValue.toString().padStart(2, '0');
        },
        [kind],
    );

    useEffect(() => {
        if (ref.current) ref.current.textContent = valueToContent(valueProp);
    }, [valueProp, valueToContent]);

    const handleBlur = () => {
        window.getSelection()?.removeAllRanges();
    };

    const handleIncrement = useCallback(
        (increment: number) => {
            const currentValue = ref.current?.textContent;

            if (kind === 'meridiem') {
                const nextMeridiem = currentValue === 'AM' ? 'PM' : 'AM';
                onChange(nextMeridiem as T);
                return;
            }
            const nextValue = bound({
                num: Number(currentValue) + increment,
                rollover: true,
                ...(kind === 'minutes' ? MINUTE_BOUNDS : HOUR_BOUNDS),
            })
                .toString()
                .padStart(2, '0');

            onChange(nextValue as T);
            if (ref.current) ref.current.textContent = nextValue;
        },
        [kind, onChange],
    );

    const nextSibling = () => getNextSibling(ref.current, '[data-input]');

    const previousSibling = () => getPreviousSibling(ref.current, '[data-input]');

    const handleInputKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            // Prevent default behavior for all keys - we handle them manually
            if (
                handleKeyDown({
                    ArrowRight: () => {
                        nextSibling()?.focus();
                        event.preventDefault();
                    },
                    ArrowLeft: () => {
                        previousSibling()?.focus();
                        event.preventDefault();
                    },
                    ArrowUp: () => {
                        handleIncrement(1);
                        event.preventDefault();
                    },
                    ArrowDown: () => {
                        handleIncrement(-1);
                        event.preventDefault();
                    },
                    // The segment is contenteditable: without preventDefault, Enter inserts a line break and Backspace
                    // edits the text React renders (or, at the start of the segment, the node before it).
                    Enter: () => {
                        ref.current?.blur();
                        event.preventDefault();
                    },
                    Escape: () => ref.current?.blur(),
                    Backspace: () => {
                        onChange(null);
                        event.preventDefault();
                    },
                    Tab: () => {
                        // do nothing
                    },
                })(event)
            )
                return;

            event.preventDefault();

            // if hours only allow digits and if digit is found only once in VALID_HOURS then set the value and move to next element
            if (kind === 'meridiem') {
                const inputValue = event.key.toUpperCase();

                if (inputValue === 'A' || inputValue === 'P') {
                    onChange(`${inputValue}M` as T);
                    nextSibling()?.focus();
                    selectAll();
                    return;
                }

                return;
            }

            // only handle digits past this point, ignore everything else
            if (!/^\d$/.test(event.key)) return;

            let nextNumber = Number(event.key);
            const currentValue = ref.current?.textContent;

            const addToExisting =
                (kind === 'hours' && currentValue === '01' && nextNumber < 3) ||
                (kind === 'minutes' && Number(currentValue) < 6);

            if (addToExisting) nextNumber = Number(`${currentValue}${nextNumber}`);
            else if (nextNumber === 0) return; // ignore leading zero

            nextNumber = bound({
                num: nextNumber,
                ...(kind === 'minutes' ? MINUTE_BOUNDS : HOUR_BOUNDS),
            });

            const nextValue = nextNumber.toString().padStart(2, '0');

            onChange(nextValue as T);
            if (ref.current) ref.current.textContent = nextValue;

            const moveToNext = (kind === 'hours' && nextNumber > 2) || (kind === 'minutes' && nextNumber > 5);

            if (moveToNext) {
                nextSibling()?.focus();
                selectAll(nextSibling());
            } else {
                selectAll();
            }

            return;
        },
        [kind, handleIncrement, onChange],
    );

    const valueText = valueProp ? valueToContent(valueProp) : 'Empty';

    return (
        <span
            aria-disabled={!!disabled}
            aria-label={kind}
            aria-readonly={readOnly}
            aria-valuemax={kind === 'hours' ? 12 : kind === 'minutes' ? 59 : undefined}
            aria-valuemin={kind === 'hours' ? 1 : kind === 'minutes' ? 0 : undefined}
            aria-valuetext={valueText}
            contentEditable={!readOnly && !disabled}
            data-input
            data-type={kind}
            data-value={valueProp || undefined}
            id={`${name}`}
            inputMode={kind === 'meridiem' ? 'text' : 'numeric'}
            onBlur={handleBlur}
            onClick={() => {
                if (disabled || readOnly) return;
                //selectAll();
            }}
            onFocus={() => {
                if (disabled || readOnly) return;
                //selectAll();
            }}
            onKeyDown={handleInputKeyDown}
            ref={(element) => {
                if (!element) return;
                ref.current = element;
                element.textContent = valueToContent(valueProp);
                setRef?.(element);
            }}
            role="spinbutton"
            spellCheck="false"
            tabIndex={disabled || readOnly ? -1 : 0}
        />
    );
}

function getNextSibling(elem: HTMLElement | null, selector: string): HTMLElement | null {
    // Get the next sibling element
    let sibling = elem?.nextElementSibling;
    // If the sibling matches our selector, use it
    // If not, jump to the next sibling and continue the loop
    while (sibling) {
        if (sibling.matches(selector)) return sibling as HTMLElement | null;
        sibling = sibling.nextElementSibling;
    }
    return null;
}

function getPreviousSibling(elem: HTMLElement | null, selector: string): HTMLElement | null {
    // Get the previous sibling element
    let sibling = elem?.previousElementSibling;
    // If the sibling matches our selector, use it
    // If not, jump to the previous sibling and continue the loop
    while (sibling) {
        if (sibling.matches(selector)) return sibling as HTMLElement | null;
        sibling = sibling.previousElementSibling;
    }
    return null;
}
