import './page-control.scss';

const MAX_DOT_COUNT = 5 as const;

export type PageControlProps = {
    /**
     * The current page (NOT zero-based).
     *
     * @example
     *     1;
     *
     * @minimum 1
     * @required
     */
    currentPage: number;
    /**
     * The total number of pages.
     *
     * @example
     *     5;
     *
     * @minimum 1
     * @required
     */
    numPages: number;
    /**
     * The variant of the page-control.
     *
     * @default flat
     */
    variant?: 'flat' | 'floating';
};

export type DotSize = 'medium' | 'small' | 'x-small';

/**
 * A visual indicator that displays a series of dots representing the number of pages or elements within a moving
 * carousel or flow. The active page is often differentiated with a usage of a high contrasting color.
 *
 * @example
 *     import { PageControl } from '@ptrn/react/PageControl';
 *
 *     <PageControl currentPage={1} numPages={3} />;
 *
 * @name PageControl
 * @phase Stable
 */
export function PageControl({ currentPage: currentProp, numPages: numPagesProp, variant = 'flat' }: PageControlProps) {
    const numPages = Number(numPagesProp);
    const current = Number(currentProp);

    if (numPages < 2 || current < 1 || current > numPages) return null;

    return (
        <span
            aria-label={`Page ${current} of ${numPages}`}
            data-pttrn="page-control"
            data-variant={variant || undefined}
            role="img"
        >
            {getDots(current - 1, numPages).map(({ pageIndex, size }, index) => (
                <span
                    aria-hidden="true"
                    data-active={pageIndex + 1 === current || undefined}
                    data-dot={pageIndex}
                    data-size={size}
                    key={index + 1}
                    role="presentation"
                />
            ))}
        </span>
    );
}

function getDots(currentIndex: number, totalPages: number) {
    if (totalPages <= MAX_DOT_COUNT) {
        return Array.from({ length: totalPages }, (_, i) => ({
            size: 'medium' as DotSize,
            pageIndex: i,
        }));
    }
    const start = Math.max(0, Math.min(currentIndex - 2, totalPages - MAX_DOT_COUNT));
    return Array.from({ length: MAX_DOT_COUNT }, (_, i) => {
        const pageIndex = start + i;
        let size: DotSize = 'medium';

        if (i === 0 && pageIndex > 0) size = 'x-small';
        if (i === 1 && pageIndex > 1) size = 'small';
        if (i === 3 && pageIndex < totalPages - 2) size = 'small';
        if (i === 4 && pageIndex < totalPages - 1) size = 'x-small';

        return { pageIndex, size };
    });
}
