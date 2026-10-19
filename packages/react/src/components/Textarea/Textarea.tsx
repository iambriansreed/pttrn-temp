import './textarea.scss';
import { ChangeEvent, useRef } from 'react';
import { CommonProps, FieldControlProps, SetRef } from '-/types/common';
import { cssWithVars } from '-/utils/cwv';

export type TextareaProps = CommonProps<'size'> &
    FieldControlProps<string, ChangeEvent<HTMLTextAreaElement>> & {
        /** The ref of the field. */
        innerRef?: SetRef<HTMLTextAreaElement>;
        /** The placeholder of the field. */
        placeholder?: string;
        /**
         * The maximum number of characters that the field will accept.
         *
         * @minimum 1
         */
        maxLength?: number;
        /**
         * The minimum number of rows that the textarea will show.
         *
         * @default 4
         * @minimum 3
         * @maximum 10
         */
        minRows?: number;
        /**
         * The maximum number of rows that the textarea will show.
         *
         * When set the textarea will automatically adjust its height to fit the content up to this limit.
         *
         * @default 10
         * @minimum 3
         * @maximum 10
         */
        maxRows?: number;
    };

/**
 * A component that allows users to input large amounts of text that could span multiple lines.
 *
 * This component gives you a textarea HTML element that automatically adjusts its height to match the length of the
 * content within maximum and minimum rows. maxLength is enforced by the element itself.
 *
 * For a more complete example with field usage, see the TextareaField component.
 *
 * @example
 *     import { Textarea } from '-/components/Textarea';
 *
 *     () => {
 *         const [value, setValue] = useState<string | undefined>('');
 *
 *         return (
 *             <div style={{ width: 320 }}>
 *                 <Field controlId="example-textarea" helperText="This is an example textarea field." label="Textarea">
 *                     <Textarea id="example-textarea" name="example-name" onChange={setValue} value={value} />
 *                 </Field>
 *             </div>
 *         );
 *     };
 *
 * @element
 *
 * @name Textarea
 * @phase Stable
 */
export function Textarea({
    invalid = false,
    onChange,
    size = 'medium',
    value = '',
    name,
    innerRef,
    placeholder,
    id,
    minRows = 4,
    maxRows = 10,
    required = false,
    readOnly,
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    ...otherProps
}: TextareaProps) {
    const onInput = () => {
        const target = textareaElement.current;
        if (!target) return;
        // we know the textarea was resized, so we don't want to auto-size it
        if (target.style.height) return;
        (target.nextSibling as HTMLElement).innerText = `${target.value}\n`;
    };

    const textareaElement = useRef<HTMLTextAreaElement | null>(null);

    return (
        <div
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            data-pttrn="textarea"
            data-read-only={readOnly || undefined}
            data-size={size}
            style={cssWithVars({
                '--min-rows': minRows,
                '--max-rows': maxRows,
            })}
        >
            <textarea
                {...otherProps}
                aria-describedby={ariaDescribedBy || undefined}
                aria-errormessage={ariaErrorMessage || undefined}
                aria-invalid={invalid || undefined}
                aria-label={ariaLabel || undefined}
                disabled={disabled}
                id={id}
                name={name}
                onBlur={(event) => {
                    const target = event.target as HTMLTextAreaElement;
                    target.scrollTop = 0;
                }}
                onChange={(event) => onChange(event.target.value, event)}
                onInput={onInput}
                placeholder={placeholder}
                readOnly={readOnly}
                ref={(node) => {
                    innerRef?.(node);
                    textareaElement.current = node;
                    onInput();
                }}
                required={required || undefined}
                value={value}
                wrap="hard"
            />
            <div aria-hidden data-replicated-value />
        </div>
    );
}
