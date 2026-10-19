import './chip.scss';
import { ReactNode, isValidElement } from 'react';
import { Badge, BadgeProps } from '-/components/Badge';

export type BadgeItem = Pick<BadgeProps, 'count' | 'size' | 'surfaceBorder'>;

export type ChipProps = {
    /**
     * Is the chip disabled.
     *
     * @default false
     */
    disabled?: boolean;
    /**
     * Is the chip elevated or flat. If flat the drop shadow is removed.
     *
     * @default false
     */
    flat?: boolean;
    /**
     * The label of the chip.
     *
     * @example
     *     Hello I am Chip
     *
     * @required
     */
    label: string;
    /** The function to call when the chip is clicked. */
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    /**
     * Visual indication of whether the chip is currently selected.
     *
     * @default false
     */
    selected?: boolean;
    /**
     * The leading icon of the chip.
     *
     * @type PttrnIcon
     */
    leadingIcon?: ReactNode;
    /**
     * The trailing icon of the chip.
     *
     * You can only have one of the trailing options, trailingIcon **or** trailingBadge. If both are present the
     * trailingIcon will be visible.
     *
     * @type PttrnIcon
     */
    trailingIcon?: ReactNode;
    /**
     * The trailing Badge for use in the ChipFilter.
     *
     * If a trailingIcon is provided the Badge will **not** be visible.
     */
    trailingBadge?: BadgeItem;
};

/**
 * Dynamically generated options that are suggested to the user as responses or prompts.
 *
 * @example
 *     import { Chip } from '@ptrn/react/Chip';
 *
 *     <Chip label="Label" onClick={() => sendSnackbar('Chip clicked!')}>
 *         Example Chip
 *     </Chip>;
 *
 * @name Chip
 * @phase Stable
 */
export function Chip({
    flat = false,
    disabled = false,
    label,
    selected,
    leadingIcon,
    onClick,
    trailingIcon,
    trailingBadge,
}: ChipProps) {
    return (
        <button
            // A chip whose selection is managed is a toggle; one without the prop is a plain action.
            aria-pressed={selected === undefined ? undefined : selected}
            data-disabled={disabled || undefined}
            data-flat={flat || undefined}
            data-pttrn="chip"
            data-selected={selected || undefined}
            data-touch-target-parent
            disabled={disabled}
            onClick={disabled ? undefined : onClick}
            type="button"
        >
            {isValidElement(leadingIcon) && (
                <span aria-hidden="true" data-chip-icon>
                    {leadingIcon}
                </span>
            )}
            <span>{label}</span>
            {isValidElement(trailingIcon) && (
                <span aria-hidden="true" data-chip-icon>
                    {trailingIcon}
                </span>
            )}
            {trailingBadge && !trailingIcon && (
                <Badge
                    count={trailingBadge.count}
                    size={trailingBadge.size}
                    surfaceBorder={trailingBadge.surfaceBorder}
                />
            )}
            <span data-touch-target />
        </button>
    );
}
