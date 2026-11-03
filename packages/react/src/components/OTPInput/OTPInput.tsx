import './otp-input.scss';
import { SvgCircleFill } from '@ptrn/icons/CircleFill';
import { useState } from 'react';
import { useId } from '-/hooks/useId';
import { CommonProps, FieldControlProps } from '-/types/common';
import { handleKeyDown } from '-/utils/handleKeyDown';

export type OTPInputProps = CommonProps<'size'> &
    Omit<FieldControlProps, 'onChange' | 'value'> & {
        /**
         * The required length of the otp-input.
         *
         * @default 6
         * @maximum 10
         */
        length?: number;
        /**
         * When true, the input accepts both letters and numbers.
         *
         * @default false
         */
        alphanumeric?: boolean;
        /**
         * When true the input masks the entered characters.
         *
         * @default false
         */
        secure?: boolean;
        /**
         * The default value of the input.
         *
         * @remarks
         *   This prop is used to set the initial value of the OTP input fields when the component is first rendered. It
         *   should be a string containing characters that match the expected input type (numeric or alphanumeric) and
         *   should not exceed the specified length of the OTP input.
         */
        defaultValue?: string;
        /** Callback function that is called when the value of the OTP input has reached the complete length. */
        onChange?: (value: string) => void;
    };

/**
 * A row of input fields that are used to input a temporary secure pin code sent to the customer.
 *
 * For a more complete example with field usage, see the OTPInputField component.
 *
 * @example
 *     import { OTPInput } from '@ptrn/react/OTPInput';
 *
 *     () => {
 *         return (
 *             <OTPInput
 *                 name="2-auth"
 *                 length={6}
 *                 defaultValue="8675"
 *                 onChange={(value) => {
 *                     // add a debounced API call to verify the OTP here
 *                     console.log('OTP value:', value);
 *                 }}
 *                 alphanumeric={false}
 *             />
 *         );
 *     };
 *
 * @name OTPInput
 * @phase Stable
 */
export function OTPInput({
    defaultValue = '',
    onChange,
    name,
    id: idProp,
    length: requiredLength = 6,
    size = 'medium',
    invalid = false,
    alphanumeric = false,
    'aria-label': ariaLabel = 'OTP input',
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    disabled = false,
    readOnly = false,
    required = false,
    secure = false,
}: OTPInputProps) {
    const id = useId(idProp);
    const [values, setValuesState] = useState<string[]>(defaultValue?.split('') || []);

    const setValues = (newValues: string[] | ((prevValues: string[]) => string[])) => {
        const nextValues = typeof newValues === 'function' ? newValues(values) : newValues;
        setValuesState(nextValues);
        const nextValueString = nextValues.join('').trim();
        if (nextValueString.length === requiredLength) onChange?.(nextValueString);
    };

    const [inputs, setInputs] = useState<HTMLInputElement[]>([]);

    const onChangeInput = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const digitAdded = event.target.value;

        // The keydown filter cannot see every character: a virtual keyboard or an IME sends no readable key. The cell
        // is controlled, so ignoring the change puts its value back.
        if (digitAdded && !alphanumeric && !/^[0-9]$/.test(digitAdded)) return;

        setValues((prev) => {
            const newValues = [...prev];
            newValues[index] = digitAdded;
            return newValues;
        });

        if (digitAdded) inputs[index + 1]?.focus();
    };

    const ArrowUpArrowLeft = (digitIndex: number) => () => {
        // Focus the previous input and focus/select it if it exists

        const prevInput = inputs[Number(digitIndex) - 1];

        prevInput?.focus();
    };

    const ArrowDownArrowRight = (digitIndex: number) => () => {
        // Focus the next input and focus/select it if it exists
        const input = inputs[digitIndex];
        const nextInput = inputs[Number(digitIndex) + 1];

        // if the current input doesn't have a value, prevent focusing the next input and instead focus/select the current one
        if (!input.value) {
            input.focus();
            return;
        }

        nextInput?.focus();
    };

    const Backspace = (digitIndex: number) => () => {
        // If the current input has a value, just clear it and stay on this input
        if (inputs[digitIndex]?.value) {
            setValues((prev) => {
                const newValues = [...prev];
                newValues[digitIndex] = '';
                return newValues;
            });
            inputs[digitIndex]?.focus();
            return;
        }

        // If not the first input, move focus to the previous input
        if (digitIndex > 0) {
            setValues((prev) => {
                const newValues = [...prev];
                newValues[digitIndex - 1] = '';
                return newValues;
            });
            inputs[digitIndex - 1]?.focus();
        }
    };

    const canBeFocused = (index: number) => {
        // if the input is the first one, it can be focused
        if (index === 0) return true;

        // if the input currently has a value, it can be focused
        if (values[index]) return true;

        // if the next input has a value, this can be focused
        if (values[index + 1]) return true;

        // if the input is empty but it's the next one to be filled, it can be focused
        if (index === values.length) return true;

        return false;
    };

    const firstInputProps = {
        'aria-describedby': ariaDescribedBy || undefined,
        'aria-errormessage': ariaErrorMessage || undefined,
        'aria-invalid': invalid || undefined,
        'aria-label': ariaLabel,
        id,
        name,
    };

    return (
        <div
            aria-label={ariaLabel}
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            data-pttrn="otp-input"
            data-readonly={readOnly || undefined}
            data-secure={secure || undefined}
            data-size={size || 'medium'}
            role="group"
        >
            <span
                data-digits
                onMouseDownCapture={(event) => {
                    // if the click wasn't on an input (between inputs), ignore it
                    if ((event.target as HTMLElement).tagName !== 'INPUT') {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }}
                role="group"
            >
                {Array.from({ length: requiredLength }, (_, index) => (
                    <input
                        data-digit
                        key={index}
                        {...(index === 0
                            ? firstInputProps
                            : {
                                  name: `${name}-${index}`,
                              })}
                        aria-label={`${ariaLabel} digit ${index + 1}`}
                        autoComplete="off"
                        data-index={index}
                        data-main-input={true}
                        data-not-selectable={canBeFocused(index) ? undefined : true}
                        disabled={disabled || undefined}
                        inputMode={alphanumeric ? 'text' : 'numeric'}
                        maxLength={1}
                        onChange={onChangeInput(index)}
                        onFocus={(event) => {
                            requestAnimationFrame(() => (event.target as HTMLInputElement)?.select());
                        }}
                        onKeyDown={(event) => {
                            if (
                                // is a single character typed without ctrl/meta/alt, so shortcuts like paste get
                                // through. Shift is not exempt: Shift+A types "A", and some layouts type digits with it.
                                event.key.length === 1 &&
                                !event.ctrlKey &&
                                !event.metaKey &&
                                !event.altKey &&
                                // only accepts numbers
                                !alphanumeric &&
                                // is not a number 0-9
                                !/^[0-9]$/.test(event.key)
                            ) {
                                event.preventDefault();
                                return;
                            }

                            handleKeyDown(
                                {
                                    Backspace: Backspace(index),
                                    ArrowUp: ArrowUpArrowLeft(index),
                                    ArrowLeft: ArrowUpArrowLeft(index),
                                    ArrowDown: ArrowDownArrowRight(index),
                                    ArrowRight: ArrowDownArrowRight(index),
                                },
                                {
                                    preventDefault: true,
                                    stopPropagation: true,
                                },
                            )(event);
                        }}
                        onMouseDown={(event) => {
                            if (!canBeFocused(index)) {
                                inputs[values.length]?.focus();
                            }

                            if (canBeFocused(index)) return;

                            event.preventDefault();
                        }}
                        onPaste={(event) => {
                            // Codes are often copied with spaces or dashes ("123-456"); keep only the characters the
                            // input accepts, so a numeric input never takes a letter from the clipboard.
                            const pastedData = event.clipboardData
                                .getData('text')
                                .replace(alphanumeric ? /[^0-9a-z]/gi : /[^0-9]/g, '');
                            // add pasted data from this index onward into the inputs and send to onChange
                            setValues((prev) => {
                                const newValues = [...prev];
                                for (let i = 0; i < pastedData.length; i++) {
                                    if (index + i < requiredLength) {
                                        newValues[index + i] = pastedData[i];
                                    }
                                }
                                return newValues;
                            });
                            // focus the input after the last one that was pasted into
                            const lastPastedIndex = Math.min(index + pastedData.length, requiredLength - 1);
                            inputs[lastPastedIndex]?.focus();
                            event.preventDefault();
                        }}
                        readOnly={readOnly || undefined}
                        ref={(input) => {
                            if (input && !inputs.includes(input)) {
                                setInputs((prev) => {
                                    prev[index] = input;
                                    return [...prev];
                                });
                            }
                        }}
                        required={required || undefined}
                        tabIndex={canBeFocused(index) ? 0 : -1}
                        type={secure ? 'password' : 'text'}
                        value={values[index] || ''}
                    />
                ))}
            </span>
            {secure && (
                <span data-digits data-secure-dots>
                    {Array.from({ length: requiredLength }, (_, index) => (
                        <span data-dot key={index}>
                            {!!values[index]?.trim() && <SvgCircleFill />}
                        </span>
                    ))}
                </span>
            )}
        </div>
    );
}
