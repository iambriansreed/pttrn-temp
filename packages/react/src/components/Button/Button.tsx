import './button.scss';
import { AriaAttributes, ElementType, ReactElement, ReactNode, isValidElement } from 'react';
import { Tooltip, TooltipTriggerProps } from '-/components/Tooltip';
import { ButtonSize, CommonProps, ElementProps, SetRef } from '-/types/common';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

export type ButtonProps<As extends ElementType = ElementType> = CommonProps<'aria-label' | 'disabled' | 'owner'> & {
    /**
     * The label of the button.
     *
     * @required
     */
    label: string;
    /**
     * The icon of the button.
     *
     * @type PttrnIcon
     */
    icon?: ReactNode;
    /**
     * When true the button label is hidden and only the icon is shown. When label isn't showing it is used in a tooltip
     * and as the aria-label prop.
     *
     * Ignored if `icon` is not provided.
     *
     * @default false
     */
    iconOnly?: boolean;
    /**
     * The element type to render as.
     *
     * @default button
     * @type ElementType
     */
    as?: As;
    /**
     * The function of the button is destructive.
     *
     * @default false
     */
    destructive?: boolean;
    /**
     * The size of the button.
     *
     * @default medium
     */
    size?: ButtonSize;
    /**
     * The color variant of the button.
     *
     * @default primary
     */
    variant?: ButtonVariant;
    /**
     * Determines how the button uses horizontal space.
     *
     * If set to 'fill', options expand to fill the container's width.
     *
     * If set to 'hug', options only take up as much space as the content requires.
     *
     * @default hug
     */
    width?: 'fill' | 'hug';
    /**
     * If `string` is passed, it will be used as the label.
     *
     * If `ReactNode` is passed, it will override the default button content. (Not recommended)
     */
    children?: ReactNode;
    /** The tool tip text that appears when hovered. */
    tooltip?: string;
    /** The function to call when the button is clicked. */
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    /** A ref to the Button element. */
    innerRef?: SetRef<HTMLButtonElement>;
};

/**
 * A clickable component that allows users to perform an action, make a choice or trigger a change in state.
 *
 * @example
 *     import { Button } from '@ptrn/react/Button';
 *     import { SvgPerson } from '@ptrn/icons/Person';
 *
 *     () => {
 *         return (
 *             <div>
 *                 <p>Standard usage</p>
 *                 <Button label="Click Me" onClick={() => action('Button clicked')} icon={<SvgPerson />} />
 *                 <p style={{ marginTop: '20px' }}>Custom usage</p>
 *                 <Button
 *                     aria-label="Hello world example"
 *                     label="Custom Icon"
 *                     onClick={() => action('Button clicked')}
 *                     variant="secondary"
 *                     tooltip="Hello world"
 *                 >
 *                     <svg
 *                         focusable="false"
 *                         aria-hidden="true"
 *                         xmlns="http://www.w3.org/2000/svg"
 *                         viewBox="0 0 24 24"
 *                         fill="currentColor"
 *                     >
 *                         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"></path>
 *                     </svg>
 *                 </Button>
 *             </div>
 *         );
 *     };
 *
 * @name Button
 * @phase Stable
 */
export function Button<As extends ElementType = ElementType>(
    props: AriaAttributes & ElementProps<ButtonProps<As>, As>,
): ReactElement {
    const {
        size = 'medium',
        variant = 'primary',
        destructive = false,
        width = 'hug',
        as: As = 'button',
        disabled = false,
        label: labelProp,
        icon,
        iconOnly: iconOnlyProp = false,
        tooltip: tooltipProp,
        children,
        innerRef,
        owner,
        role,
        'aria-label': ariaLabel,
        ...containerProps
    } = props;
    const label = typeof children === 'string' ? children : labelProp || '';

    // ignore iconOnly if there is no icon
    const iconOnly = iconOnlyProp === true && !!icon;

    // if tooltip text is not provided and iconOnly is true, tooltip text should be label
    const tooltip = tooltipProp || (iconOnly ? label : undefined);

    const button = (triggerProps: TooltipTriggerProps) => (
        <As
            type={As === 'button' ? 'button' : undefined}
            {...containerProps}
            {...triggerProps}
            aria-label={ariaLabel || label}
            data-destructive={destructive || undefined}
            data-pttrn="button"
            data-pttrn-owner={owner || undefined}
            data-size={size}
            data-touch-target-parent
            data-variant={variant}
            data-width={width}
            disabled={disabled || undefined}
            onBlur={(e) => {
                triggerProps.onBlur?.();
                containerProps.onBlur?.(e);
            }}
            onFocus={(e) => {
                triggerProps.onFocus?.();
                containerProps.onFocus?.(e);
            }}
            onMouseLeave={(e) => {
                triggerProps.onMouseLeave?.();
                containerProps.onMouseLeave?.(e);
            }}
            onMouseOver={(e) => {
                triggerProps.onMouseOver?.();
                containerProps.onMouseOver?.(e);
            }}
            ref={innerRef}
            role={role || (As !== 'button' ? 'button' : undefined)}
        >
            {children && typeof children !== 'string' ? (
                children
            ) : (
                <>
                    {!!icon && isValidElement(icon) && (
                        <span aria-hidden={true} data-button-icon>
                            {icon}
                        </span>
                    )}
                    {!iconOnly && <span data-button-label>{label}</span>}
                </>
            )}
            <span aria-hidden={true} data-touch-target />
        </As>
    );

    if (tooltip)
        return (
            <Tooltip label={tooltip} placement="top">
                {button}
            </Tooltip>
        );

    return button({});
}
