import { ElementType } from 'react';

import { SkeletonText } from '-/components/SkeletonText';
import { ElementProps } from '-/types/common';
import { TxtVariant, txtFont } from '-/utils/txtVariants';

export type TxtProps<As extends ElementType = ElementType> = {
    /**
     * The element type to render as.
     *
     * @default span
     * @type ElementType
     */
    as?: As;
    /**
     * The content to render.
     *
     * @type string
     * @required
     */
    children: unknown;
    /**
     * The variant to use.
     *
     * @default body-base
     */
    variant?: TxtVariant;
    /** The id of the element. */
    id?: string;
    /**
     * The number of lines to display for skeleton text.
     *
     * If not provided, it defaults to 0, meaning no skeleton lines will be shown.
     *
     * @default 0
     */
    skeletonLines?: number;
    /**
     * Inherit style and not set font style.
     *
     * @default false
     */
    inherit?: boolean;
};

/**
 * A text component that applies the correct font styles based on the variant and size. variant
 *
 * @example
 *     import { Txt } from '@ptrn/react/Txt';
 *
 *     <Txt>Example Txt</Txt>;
 *
 * @name Txt
 * @phase Stable
 */
export function Txt<As extends ElementType = ElementType>({
    children,
    as,
    variant = 'body-base',
    style: styleProp,
    skeletonLines = 0,
    inherit,
    ...containerProps
}: ElementProps<TxtProps<As>, As>) {
    const content = children?.toString();

    if (!content) return skeletonLines ? <SkeletonText lines={skeletonLines} variant={variant} /> : null;

    const As: ElementType = as || 'span';

    return (
        <As
            {...containerProps}
            data-pttrn="txt"
            style={{
                // A word wider than its container breaks instead of overflowing it, as a large display size on a phone.
                overflowWrap: 'break-word',
                ...styleProp,
                font: inherit ? undefined : txtFont(variant),
            }}
        >
            {content}
        </As>
    );
}
