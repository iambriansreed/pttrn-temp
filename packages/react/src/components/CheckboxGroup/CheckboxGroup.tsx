import './checkbox-group.scss';
import { CheckboxOption, CheckboxOptionProps } from '-/components/CheckboxOption';
import { useId } from '-/hooks/useId';
import { ElementProps, FieldControlProps } from '-/types/common';

const ALL_LABEL = 'All';

export type CheckboxGroupOption = Omit<CheckboxOptionProps, 'name' | 'onChange'>;

export type CheckboxGroupProps = Omit<FieldControlProps<string[]>, 'readOnly'> & {
    /**
     * The options for the checkboxes.
     *
     * @example
     *     [
     *         { label: 'Option 1', value: 'option1' },
     *         { label: 'Option 2', value: 'option2' },
     *         { label: 'Option 3', value: 'option3' },
     *     ];
     *
     * @type Array<CheckboxGroupOption>
     * @required
     */
    options: CheckboxGroupOption[];
    /**
     * Whether to show a select all checkbox at the top of the list.
     *
     * @default false
     */
    selectAll?: boolean;
    /** The props for the select all checkbox. */
    selectAllProps?: Pick<CheckboxOptionProps, 'aria-label' | 'description' | 'label'>;
};

/**
 * A group of checkboxes that allows users to choose one or more items from a list or turn an feature on or off.
 *
 * For a more complete example with field usage, see the CheckboxGroupField component.
 *
 * @example
 *     import { CheckboxGroup } from '@ptrn/react/CheckboxGroup';
 *
 *     () => {
 *         const [value, setValue] = useState<string[]>([]);
 *
 *         return (
 *             <CheckboxGroup
 *                 aria-label="Example Checkbox Group"
 *                 name="example-checkbox-group"
 *                 options={[
 *                     { label: 'Option 1', value: 'option1' },
 *                     { label: 'Option 2', value: 'option2' },
 *                     { label: 'Option 3', value: 'option3' },
 *                 ]}
 *                 value={value}
 *                 onChange={(nextValue: string[]) => {
 *                     setValue(nextValue);
 *                 }}
 *             />
 *         );
 *     };
 *
 * @name CheckboxGroup
 * @phase Stable
 */
export function CheckboxGroup({
    onChange,
    options = [],
    name,
    value = [],
    selectAll,
    selectAllProps,
    disabled = false,
    invalid = false,
    id: idProp,
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    required,
    ...props
}: ElementProps<CheckboxGroupProps, 'div'>) {
    const id = useId(idProp);
    const availableOptions = options.filter((o) => !o.disabled);

    return (
        <div
            {...props}
            aria-describedby={ariaDescribedBy || undefined}
            data-pttrn="checkbox-group"
            id={id}
            role="group"
        >
            {selectAll && (
                <CheckboxOption
                    aria-label={ALL_LABEL}
                    label={ALL_LABEL}
                    {...selectAllProps}
                    aria-errormessage={ariaErrorMessage || undefined}
                    checked={!!value.length && value.length === availableOptions.length}
                    data-testid="selectAll-Checkbox"
                    disabled={disabled}
                    indeterminate={!!value.length && value.length < availableOptions.length}
                    invalid={invalid || undefined}
                    name={name}
                    onChange={(checked) => onChange(checked ? availableOptions.map((o) => o.value) : [])}
                    value="all"
                />
            )}
            {options.map(({ label, description, value: optionValue, disabled: optionDisabled }) => (
                <CheckboxOption
                    aria-errormessage={ariaErrorMessage || undefined}
                    aria-label={label}
                    checked={value.includes(optionValue)}
                    description={description}
                    disabled={disabled || optionDisabled}
                    invalid={invalid || undefined}
                    key={optionValue}
                    label={label}
                    name={name}
                    onChange={(checked) => {
                        onChange(checked ? [...value, optionValue] : value.filter((v) => v !== optionValue));
                    }}
                    required={required}
                    value={optionValue}
                />
            ))}
        </div>
    );
}
