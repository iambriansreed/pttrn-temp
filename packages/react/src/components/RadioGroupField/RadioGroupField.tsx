import { ComposedFieldProps, Fieldset, propsWithAria } from '-/components/Field';
import { RadioGroup, RadioGroupProps } from '-/components/RadioGroup';
import { useId } from '-/hooks/useId';

export type RadioGroupFieldProps = ComposedFieldProps<RadioGroupProps>;

/**
 * A field wrapper for the RadioGroup component.
 *
 * This component takes properties from the FormField and RadioGroup components.
 *
 * @name RadioGroupField
 * @phase Stable
 *
 * @generated
 */
export function RadioGroupField({
    label,
    helperText,
    labelTrailing,
    errorMessage,
    style,
    id: idProp,
    ...controlProps
}: RadioGroupFieldProps) {
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
            {/* An error marks the radio group invalid with aria-errormessage to the alert, and styles the radios. */}
            <RadioGroup
                {...propsWithAria({ id, controlProps, errorMessage, helperText })}
                invalid={controlProps.invalid || !!errorMessage}
            />
        </Fieldset>
    );
}
