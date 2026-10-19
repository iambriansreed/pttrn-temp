import './switch.scss';
import { ChangeEvent } from 'react';
import { CommonProps } from '-/types/common';

export type SwitchProps = CommonProps<'aria-label' | 'disabled' | 'id' | 'name'> & {
    /**
     * Marks the control as checked.
     *
     * @default false
     */
    checked?: boolean;
    /**
     * The function to call when the control is checked or unchecked.
     *
     * @type (checked, Event) => void
     * @required
     */
    onChange: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
    /** The value of the switch. */
    value: string;
};

/**
 * A control element that allows users to toggle between two states, typically representing on/off and inherits
 * immediate reaction in each state. This is the base element and if used directly you must wrap it with a label. This
 * will more often be used in the SwitchOption component.
 *
 * @example
 *     import { Switch } from '@ptrn/react/Switch';
 *
 *     () => {
 *         const [isChecked, setIsChecked] = useState<boolean>(false);
 *
 *         return (
 *             <Switch
 *                 aria-label="Example aria-label"
 *                 name="example-name"
 *                 onChange={setIsChecked}
 *                 checked={isChecked}
 *             />
 *         );
 *     };
 *
 * @element
 *
 * @name Switch
 * @phase Stable
 */
export function Switch({ checked = false, disabled = false, ...props }: SwitchProps) {
    return (
        <span data-pttrn="switch">
            <input
                {...props}
                aria-disabled={disabled || undefined}
                checked={!!checked}
                disabled={disabled || undefined}
                onChange={(event) => props.onChange(!!event.target.checked, event)}
                role="switch"
                type="checkbox"
            />
            <span aria-hidden />
        </span>
    );
}
