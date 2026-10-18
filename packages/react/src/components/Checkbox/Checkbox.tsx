import './checkbox.scss';
import { ChangeEvent, useEffect, useRef } from 'react';
import { ElementProps, FieldControlProps } from '-/types/common';

export type CheckboxProps = Omit<FieldControlProps, 'onChange' | 'readOnly' | 'value'> & {
    /**
     * If the checkbox is partially checked or
     * [indeterminate](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#indeterminate_state_checkboxes).
     *
     * This will override the `checked` prop.
     *
     * @default false
     */
    indeterminate?: boolean;
    /**
     * Marks the checkbox as checked.
     *
     * @default false
     */
    checked?: boolean;
    /**
     * The function to call when the checkbox is checked or unchecked.
     *
     * @required
     */
    onChange: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
    /** The value of the checkbox. */
    value: string;
};

/**
 * A control that allows users to choose one or more items from a list or turn an feature on or off. This is the base
 * element and if used directly you must wrap it with a label. This will more often be used in the CheckboxOption or
 * CheckboxGroup component.
 *
 * @example
 *     import { Checkbox } from '@ptrn/react/Checkbox';
 *
 *     () => {
 *         const [checked, setChecked] = useState(false);
 *
 *         return (
 *             <label
 *                 htmlFor="sample-checkbox"
 *                 style={{ display: 'flex', alignItems: 'center', gap: 'var(--usa-spacing-1)' }}
 *             >
 *                 <Checkbox
 *                     aria-label="Sample"
 *                     checked={checked}
 *                     id="sample-checkbox"
 *                     name="sample-checkbox"
 *                     onChange={(nextChecked) => setChecked(nextChecked)}
 *                     value="sample"
 *                 />
 *                 Checkbox Label
 *             </label>
 *         );
 *     };
 *
 * @element
 *
 * @name Checkbox
 * @phase Stable
 */
export function Checkbox({
    checked: checkedProp = false,
    indeterminate: indeterminateProp = false,
    invalid,
    disabled,
    required,
    ...props
}: ElementProps<CheckboxProps, 'input'>) {
    const checked = !!checkedProp;
    const indeterminate = !!indeterminateProp;

    const inputRef = useRef<HTMLInputElement>();

    useEffect(() => {
        if (!inputRef.current) return;
        inputRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
        <span data-pttrn="checkbox">
            <input
                {...props}
                aria-describedby={props['aria-describedby'] || undefined}
                aria-errormessage={props['aria-errormessage'] || undefined}
                aria-invalid={invalid || undefined}
                checked={checked}
                data-indeterminate={indeterminate || undefined}
                disabled={disabled || undefined}
                onChange={(event) => props.onChange(!!event.target.checked, event)}
                ref={(node) => {
                    if (!node) return;
                    inputRef.current = node;
                    node.indeterminate = indeterminate;
                }}
                required={required || undefined}
                type="checkbox"
            />
            <span aria-hidden>
                {checked && !indeterminate && (
                    <svg data-checked fill="none" viewBox="0 0 14 11" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M5.485 10.182a1 1 0 0 1-1.414 0l-3.03-3.03a1 1 0 0 1 0-1.415l.14-.141a1 1 0 0 1 1.415 0l2.182 2.182 6.626-6.627a1 1 0 0 1 1.414 0l.142.142a1 1 0 0 1 0 1.414l-7.475 7.475Z"
                            fill="currentColor"
                        />
                    </svg>
                )}
                {indeterminate && (
                    <svg data-indeterminate fill="none" viewBox="0 0 12 4" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M1.44444 3.11089C0.892158 3.11089 0.444443 2.66318 0.444443 2.11089V1.88867C0.444443 1.33639 0.892158 0.888672 1.44444 0.888672H10.5556C11.1078 0.888672 11.5556 1.33639 11.5556 1.88867V2.11089C11.5556 2.66318 11.1078 3.11089 10.5556 3.11089H1.44444Z"
                            fill="currentColor"
                        />
                    </svg>
                )}
            </span>
        </span>
    );
}
