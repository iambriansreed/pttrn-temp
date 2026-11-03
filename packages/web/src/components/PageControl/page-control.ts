import { LitElement, html, nothing } from 'lit';
import { define } from '../../utils/define';
import styles from './page-control.scss';

type DotSize = 'medium' | 'small' | 'x-small';

const MAX_DOT_COUNT = 5;

/** One dot per page up to five; past five, a window of five around the current page, smaller toward the edges. */
function getDots(currentIndex: number, totalPages: number) {
    if (totalPages <= MAX_DOT_COUNT) {
        return Array.from({ length: totalPages }, (_, i) => ({ size: 'medium' as DotSize, pageIndex: i }));
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

/**
 * A visual indicator that displays a series of dots representing the number of pages or elements within a moving
 * carousel or flow. The active page is often differentiated with a usage of a high contrasting color.
 *
 * It is read as one image named "Page N of M"; the dots are presentational. With fewer than two pages, or a current
 * page out of range, nothing renders.
 *
 * React to Web Component mapping:
 *
 * - `currentPage` → `current-page`
 * - `numPages` → `num-pages`
 * - `variant` → `variant`
 *
 * @element pttrn-page-control
 */
export class PttrnPageControl extends LitElement {
    static properties = {
        currentPage: { type: Number, attribute: 'current-page' },
        numPages: { type: Number, attribute: 'num-pages' },
        variant: { type: String, reflect: true },
    };

    static styles = styles;

    /** The current page, counted from 1. */
    declare currentPage: number;
    /** The total number of pages. */
    declare numPages: number;
    /** `flat`, or `floating` with a shadow. */
    declare variant: 'flat' | 'floating';

    constructor() {
        super();
        this.currentPage = 1;
        this.numPages = 0;
        this.variant = 'flat';
    }

    render() {
        const numPages = Number(this.numPages);
        const current = Number(this.currentPage);
        if (!(numPages >= 2) || !(current >= 1) || current > numPages) return nothing;

        return html`<span
            aria-label=${`Page ${current} of ${numPages}`}
            data-pttrn="page-control"
            data-variant=${this.variant || 'flat'}
            role="img"
        >
            ${getDots(current - 1, numPages).map(
                ({ pageIndex, size }) =>
                    html`<span
                        aria-hidden="true"
                        data-active=${pageIndex + 1 === current || nothing}
                        data-dot=${pageIndex}
                        data-size=${size}
                        role="presentation"
                    ></span>`,
            )}
        </span>`;
    }
}

define('pttrn-page-control', PttrnPageControl);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-page-control': PttrnPageControl;
    }
}
