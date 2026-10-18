import { ReactNode } from 'react';

import { cssWithVars } from '-/utils/cwv';
import { TXT_STYLES, TxtVariant } from '-/utils/txtVariants';

export type SkeletonTextProps = {
    /**
     * The variant of the text being loaded.
     *
     * @default body-base
     */
    variant?: TxtVariant;
    /**
     * The number of lines showing.
     *
     * @default 3
     * @minimum 1
     */
    lines?: number;
    /**
     * The content of the skeleton.
     *
     * When the value is undefined, null or false the skeleton will appear.
     *
     * If the value is provided, the skeleton will not appear and the content will be displayed instead.
     */
    children?: ReactNode | null;
};

/**
 * A visual placeholder for an text while it is in a loading state.
 *
 * @example
 *     import { SkeletonText } from '@ptrn/react/SkeletonText';
 *
 *     <SkeletonText textLines={1} textVariant="body-base">
 *         <Txt as="p" variant="body-base">
 *             {'This is the loaded text content that was previously loading.'}
 *         </Txt>
 *     </SkeletonText>;
 *
 * @exampleDescription This example shows a skeleton loading state for some text but can be used for any element.
 *
 * @name SkeletonText
 * @phase Stable
 */
export function SkeletonText({ lines = 3, variant = 'body-base', children = null }: SkeletonTextProps) {
    return children !== null && children !== undefined && children !== false ? (
        children
    ) : (
        <div
            aria-busy="true"
            aria-label="Loading"
            data-pttrn="skeleton-text"
            role="status"
            style={cssWithVars({
                '--text-height': TXT_STYLES[variant].size,
                '--text-margin': `calc(${TXT_STYLES[variant].lineHeight} - ${TXT_STYLES[variant].size})`,
            })}
        >
            {[...Array(Math.max(1, lines || 0))].map((_, index) => (
                <div data-line key={index} />
            ))}
        </div>
    );
}
