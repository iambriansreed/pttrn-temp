import './password.scss';
import { useState } from 'react';
import { Button } from '-/components/Button';
import { Input, InputProps } from '-/components/Input';
import { useId } from '-/hooks/useId';
import { FieldControlProps } from '-/types/common';

export type PasswordProps = FieldControlProps & Pick<InputProps, 'containerRef' | 'inputProps' | 'inputRef' | 'size'>;

/**
 * An input field that is specifically built with a show/hide toggle for entering security passwords.
 *
 * For a more complete example with field usage, see the PasswordField component.
 *
 * @example
 *     import { Password } from '@ptrn/react/Password';
 *
 *     () => {
 *         const [value, setValue] = useState<string | undefined>('');
 *
 *         return (
 *             <div>
 *                 <Field
 *                     controlId="example-password"
 *                     helperText="The password field allows you to enter a secure password."
 *                     label="Password"
 *                 >
 *                     <Password
 *                         aria-label="password"
 *                         id="example-password"
 *                         name="password"
 *                         onChange={(next) => setValue(next)}
 *                         value={value}
 *                     />
 *                 </Field>
 *             </div>
 *         );
 *     };
 *
 * @name Password
 * @phase Stable
 */
export function Password({
    inputProps,
    inputRef,
    name,
    onChange,
    required = false,
    containerRef,
    invalid = false,
    readOnly,
    disabled,
    id: idProp,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
    ...props
}: PasswordProps) {
    const id = useId(idProp);

    const [isShowingPassword, setIsShowingPassword] = useState(false);

    const togglePasswordVisibility = () => {
        if (disabled || readOnly) return;
        setIsShowingPassword((prev) => !prev);
    };

    return (
        <Input
            {...props}
            aria-describedby={ariaDescribedBy}
            aria-errormessage={ariaErrorMessage}
            aria-label={ariaLabel || undefined}
            autoComplete="off"
            containerRef={containerRef}
            data-pttrn-owner="password"
            id={id}
            inputProps={inputProps}
            inputRef={inputRef}
            invalid={invalid}
            name={name}
            onChange={onChange}
            onClick={(e) => {
                (e.currentTarget as HTMLElement)?.querySelector('input')?.focus();
            }}
            owner="password"
            required={required}
            showClearButton={false}
            trailing={
                !disabled &&
                !readOnly && (
                    <Button
                        data-toggle-visibility-button
                        label={isShowingPassword ? 'Hide' : 'Show'}
                        onClick={togglePasswordVisibility}
                        variant="tertiary"
                    />
                )
            }
            type={isShowingPassword ? 'text' : 'password'}
        />
    );
}
