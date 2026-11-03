import { CSSProperties, ElementType, ReactNode } from 'react';
import { ElementProps } from '-/types/common';
import { SizingPixels, numToSizingVar } from '-/utils/sizing';

export type FlexProps<As extends ElementType = ElementType> = {
    /**
     * The content of the Flex.
     *
     * @required
     */
    children?: ReactNode;
    /** The gap between the children. */
    gap?: SizingPixels | 'auto';
    /**
     * The element type to render as.
     *
     * @default div
     * @type ElementType
     */
    as?: As;
    /**
     * The align-items style to apply to the Flex.
     *
     * @default flex-start
     */
    align?: CSSProperties['alignItems'] | 'end' | 'start';
    /**
     * The justification style to apply to the Flex.
     *
     * @default flex-start
     */
    justify?: CSSProperties['justifyContent'];
    /** The flex-wrap style to apply to the Flex. */
    wrap?: CSSProperties['flexWrap'];
    /** The flex-direction style to apply to the Flex. */
    direction?: 'column-reverse' | 'column' | 'row-reverse' | 'row';
    /**
     * The padding to apply to the Flex: one spacing value, or an array of up to four in CSS shorthand order (top,
     * right, bottom, left).
     */
    padding?: SizingPixels | SizingPixels[];
    /** If true the Flex will take up the full width of its container. */
    full?: boolean;
};

/**
 * Utility component used within other components for layout purposes.
 *
 * @example
 *     import { Flex } from '@ptrn/react/Flex';
 *
 *     () => {
 *         return (
 *             <Flex gap="24" justify="center" style={{ width: '100%' }}>
 *                 <div>Alpha</div>
 *                 <div>Beta</div>
 *                 <div>Gamma</div>
 *             </Flex>
 *         );
 *     };
 *
 * @name Flex
 * @phase Utility
 */
export function Flex<As extends ElementType = ElementType>({
    children,
    gap,
    style,
    as,
    align = 'flex-start',
    justify = 'flex-start',
    wrap,
    direction = 'row',
    padding,
    full,
    ...props
}: ElementProps<FlexProps<As>, As>) {
    const As: ElementType = as || 'div';

    const alignItems = align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align;

    const paddingValue = getPaddingValue(padding);

    return (
        <As
            {...props}
            data-pttrn-utility="flex"
            style={{
                display: 'flex',
                flexDirection: direction,
                gap: numToSizingVar(gap),
                alignItems,
                justifyContent: justify || 'flex-start',
                flexWrap: wrap ? 'wrap' : 'nowrap',
                padding: paddingValue,
                width: full ? '100%' : undefined,
                ...style,
            }}
        >
            {children}
        </As>
    );
}

function getPaddingValue(padding?: SizingPixels | SizingPixels[]): string | undefined {
    if (!padding) return undefined;

    return (!Array.isArray(padding) ? [padding] : padding).map((p) => numToSizingVar(p)).join(' ');
}
