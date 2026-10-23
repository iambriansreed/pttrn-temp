import './radio-group.scss';
import { RadioProps } from '-/components/Radio';
import { RadioOption, RadioOptionProps } from '-/components/RadioOption';
import { useId } from '-/hooks/useId';
import { ElementProps, FieldControlProps } from '-/types/common';

export type RadioGroupOption = Pick<RadioOptionProps, 'checked' | 'description' | 'disabled' | 'label'> &
    Pick<RadioProps, 'value'>;

export type RadioGroupProps = Omit<FieldControlProps, 'readOnly'> & {
    /**
     * The options for the radios.
     *
     * @example
     *     [
     *         {
     *             value: '1',
     *             label: 'Option 1',
     *         },
     *         {
     *             value: '2',
     *             label: 'Option 2',
     *             description: 'Description here',
     *         },
     *         { value: '3', label: 'Option 3' },
     *     ];
     *
     * @type Array<RadioGroupOption>
     * @required
     */
    options: RadioGroupOption[];
};

/**
 * A group of radios that allows users to choose one or more items from a list or turn an feature on or off.
 *
 * For a more complete example with field usage, see the RadioGroupField component.
 *
 * @example
 *     import { RadioGroup } from '@ptrn/react/RadioGroup';
 *
 *     () => {
 *         const [selectedOption, setSelectedOption] = useState<string>('1');
 *
 *         return (
 *             <RadioGroup
 *                 name="example-name"
 *                 onChange={(nextValue) => setSelectedOption(nextValue)}
 *                 options={[
 *                     {
 *                         value: '1',
 *                         label: 'Option 1',
 *                         description: 'Description here',
 *                     },
 *                     { value: '2', label: 'Option 2' },
 *                     { value: '3', label: 'Option 3' },
 *                 ]}
 *                 value={selectedOption}
 *             />
 *         );
 *     };
 *
 * @name RadioGroup
 * @phase Stable
 */
export function RadioGroup({
    onChange,
    options = [],
    name,
    value,
    disabled = false,
    required,
    invalid = false,
    id: idProp,
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    ...props
}: ElementProps<RadioGroupProps, 'div'>) {
    const id = useId(idProp);

    return (
        <div
            {...props}
            aria-describedby={ariaDescribedBy || undefined}
            // ARIA puts aria-invalid on the radio group, not on a radio, so the error message is tied to the group.
            aria-errormessage={ariaErrorMessage || undefined}
            data-pttrn="radio-group"
            id={id}
            role="radiogroup"
        >
            {options.map(({ label, description, value: optionValue, ...option }) => {
                return (
                    <RadioOption
                        aria-describedby={ariaDescribedBy || undefined}
                        aria-errormessage={ariaErrorMessage || undefined}
                        checked={value === optionValue}
                        description={description}
                        disabled={disabled || option.disabled}
                        invalid={invalid || undefined}
                        key={optionValue}
                        label={label}
                        name={name}
                        onChange={(checked) => checked && onChange(optionValue)}
                        required={required}
                        value={optionValue}
                    />
                );
            })}
        </div>
    );
}
