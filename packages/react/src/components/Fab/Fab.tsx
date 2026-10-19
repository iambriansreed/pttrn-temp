import './fab.scss';
import { AriaAttributes, ElementType, isValidElement } from 'react';
import { ButtonProps } from '-/components/Button';
import { Tooltip, TooltipTriggerProps } from '-/components/Tooltip';
import { ElementProps } from '-/types/common';

export type FabSize = 'medium' | 'x-large';

export type FabVariant = 'neutral' | 'primary' | 'secondary';

export type FabProps<As extends ElementType = ElementType> = Pick<
    ButtonProps<As>,
    'aria-label' | 'as' | 'icon' | 'iconOnly' | 'innerRef' | 'onClick' | 'tooltip'
> &
    Required<Pick<ButtonProps<As>, 'label'>> & {
        /**
         * The size of the button.
         *
         * @default medium
         */
        size?: FabSize;
        /**
         * The style variant of the button.
         *
         * @default primary
         */
        variant?: FabVariant;
        /**
         * The placement of the button on the container.
         *
         * @default bottom-right
         */
        placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
        /**
         * The container to render the button in.
         *
         * @default local
         */
        container?: 'local' | 'page';
    };

/**
 * A button that highlights a primary action that is elevated above the body content of a page; normally fixed to the
 * bottom right of a screen.
 *
 * @example
 *     import { Fab } from '-/components/Fab';
 *
 *     () => {
 *         return (
 *             <div style={{ width: '100%', height: 100 }}>
 *                 <Fab icon={<SvgBolt />} label="Example label" placement="bottom-right" variant="neutral" />
 *             </div>
 *         );
 *     };
 *
 * @name Fab
 * @phase Stable
 */
export function Fab<As extends ElementType = ElementType>(props: AriaAttributes & ElementProps<FabProps<As>, As>) {
    const {
        'aria-label': ariaLabel,
        size = 'medium',
        variant = 'primary',
        iconOnly: iconOnlyProp = false,
        as: As = 'button',
        placement = 'bottom-right',
        container = 'local',
        label,
        icon,
        tooltip,
        innerRef,
        ...otherProps
    } = props;

    // ignore iconOnly=true if there is no icon
    const iconOnly = iconOnlyProp === true && !!icon;

    // An icon-only Fab is named by its tooltip (the label), as a Button is. With a visible label, the tooltip describes the
    // Fab instead, so the name stays the text people can see and say.
    const button = ({ 'aria-labelledby': tooltipId, ...triggerProps }: TooltipTriggerProps) => (
        <As
            {...otherProps}
            {...triggerProps}
            aria-describedby={!iconOnly ? tooltipId : undefined}
            aria-label={ariaLabel || label}
            aria-labelledby={iconOnly && !ariaLabel ? tooltipId : undefined}
            data-container={container}
            data-placement={placement}
            data-position={container === 'page' ? 'fixed' : 'absolute'}
            data-pttrn="fab"
            data-round={iconOnly || undefined}
            data-size={size}
            data-variant={variant}
            onBlur={(e) => {
                triggerProps.onBlur?.();
                otherProps.onBlur?.(e);
            }}
            onFocus={(e) => {
                triggerProps.onFocus?.();
                otherProps.onFocus?.(e);
            }}
            onMouseLeave={(e) => {
                triggerProps.onMouseLeave?.();
                otherProps.onMouseLeave?.(e);
            }}
            onMouseOver={(e) => {
                triggerProps.onMouseOver?.();
                otherProps.onMouseOver?.(e);
            }}
            ref={innerRef}
        >
            {!!icon && isValidElement(icon) && (
                <span aria-hidden={true} data-fab-icon>
                    {icon}
                </span>
            )}
            {!iconOnly && <span data-fab-label>{label}</span>}
        </As>
    );

    if (tooltip || iconOnly)
        return (
            <Tooltip label={tooltip || label} placement="top">
                {button}
            </Tooltip>
        );

    return button({});
}
