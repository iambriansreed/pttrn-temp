import { CheckboxGroup, CheckboxGroupProps } from '-/components/CheckboxGroup';
import { Fieldset, propsWithAria, ComposedFieldProps } from '-/components/Field';
import { useId } from '-/hooks/useId';

export type CheckboxGroupFieldProps = ComposedFieldProps<CheckboxGroupProps>;

/**
 * A field wrapper for the CheckboxGroup component.
 *
 * This component takes properties from the FormField and CheckboxGroup components.
 *
 * @name CheckboxGroupField
 * @phase Stable
 *
 * @generated
 */
export function CheckboxGroupField({
    label,
    helperText,
    labelTrailing,
    errorMessage,
    style,
    id: idProp,
    ...controlProps
}: CheckboxGroupFieldProps) {
    const id = useId(idProp);
    return (
        <Fieldset
            controlId={id}
            errorMessage={errorMessage}
            helperText={helperText}
            label={label}
            labelTrailing={labelTrailing}
            required={controlProps.required}
            style={style}
        >
            {/* An error marks every checkbox invalid, so each one carries aria-errormessage to the alert. */}
            <CheckboxGroup
                {...propsWithAria({ controlProps, id, errorMessage, helperText })}
                invalid={controlProps.invalid || !!errorMessage}
            />
        </Fieldset>
    );
}
