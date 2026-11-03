import './badge-dot.scss';
import { ReactNode } from 'react';
import { cssWithVars } from '-/utils/cwv';

export type BadgeDotSize = 6 | 8 | 10 | 12;

const OUTLINE_WIDTHS: Record<BadgeDotSize, number> = {
    6: 1,
    8: 2,
    10: 2,
    12: 2,
};

export type BadgeDotProps = {
    /**
     * The color variant of the badge-dot.
     *
     * @default primary
     */
    color?: 'primary' | 'secondary';
    /**
     * The context for which the badge-dot is applied.
     *
     * Could be a button, link, or any other element that the badge-dot is associated with.
     */
    children?: ReactNode;
    /**
     * The size of the badge-dot.
     *
     * @default 6
     */
    size?: BadgeDotSize;
    /**
     * Whether the badge-dot should have an outline.
     *
     * @default false
     */
    outline?: boolean;
};

/**
 * A non-numeric badge used to indicate something new or its current status.
 *
 * @example
 *     import { BadgeDot } from '@ptrn/react/BadgeDot';
 *
 *     <BadgeDot color="secondary" size={12} outline={true}>
 *         <Button label="Messages" />
 *     </BadgeDot>;
 *
 * @exampleDescription This example attaches a size 12, secondary badge-dot with an outline to a button.
 *
 * @name BadgeDot
 * @phase Stable
 */
export function BadgeDot({ children, color = 'primary', size: sizeProp = 6, outline = false }: BadgeDotProps) {
    const size = sizeProp in OUTLINE_WIDTHS ? sizeProp : 6;

    const badgeDot = (
        <sup
            data-attachment={!!children || undefined}
            data-color={color}
            data-outline={outline || undefined}
            data-pttrn="badge-dot"
            style={cssWithVars({
                '--size': `${size}px`,
                '--outline-width': `${OUTLINE_WIDTHS[size]}px`,
            })}
        />
    );

    if (children) {
        return (
            <span data-attachment-wrapper>
                {children}
                {badgeDot}
            </span>
        );
    }

    return badgeDot;
}
