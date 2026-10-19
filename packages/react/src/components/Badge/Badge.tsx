import './badge.scss';
import { ReactNode } from 'react';

import { tryIntParse } from '-/utils/tryIntPsrse';

export type BadgeProps = {
    /**
     * The count the badge shows. Above 99 it shows '99+'. Without a count only the children render.
     *
     * @example
     *     5;
     *
     * @type number
     */
    count?: number;
    /**
     * The size of the badge.
     *
     * @default small
     */
    size?: 'small' | 'x-small';
    /**
     * The color variant of the badge.
     *
     * @default primary
     */
    color?: 'primary' | 'secondary';
    /**
     * Whether the badge should have a border that matches the surface color.
     *
     * @default false
     */
    surfaceBorder?: boolean;
    /**
     * The context for which the badge is applied.
     *
     * Could be a button, link, or any other element that the badge is associated with.
     *
     * @type
     */
    children?: ReactNode;
};

/**
 * Visual indicator for new items within a parent page represented with a numerical count of new items.
 *
 * @example
 *     import { Badge } from '@ptrn/react/Badge';
 *
 *     <Badge count={5} size="small" color="primary" surfaceBorder={true} />;
 *
 * @exampleDescription This example shows a badge with a count of 5, size small, and primary variant.
 *
 * @name Badge
 * @phase Stable
 */
export function Badge({ count: countProp, size = 'small', surfaceBorder, children, color = 'primary' }: BadgeProps) {
    const count: number | null = tryIntParse(countProp);

    if (count === null) return children || null;

    const badge = (
        <sup
            data-attachment={!!children || undefined}
            data-color={color}
            data-pttrn="badge"
            data-size={size}
            data-surface-border={surfaceBorder || undefined}
        >
            {typeof count === 'number' && count > 99 ? '99+' : count}
        </sup>
    );

    if (children) {
        return (
            <span data-attachment-wrapper>
                {children}
                {badge}
            </span>
        );
    }

    return badge;
}
