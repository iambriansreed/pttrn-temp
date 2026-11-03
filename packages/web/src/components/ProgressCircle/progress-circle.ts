import { LitElement, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { define } from '../../utils/define';
import { uniqueId } from '../../utils/id';
import { txtFont } from '../../utils/txt-variants';
import styles from './progress-circle.scss';

const LABEL_VARIANTS: Record<string, string> = { small: 'labels-small', medium: 'labels-base', large: 'labels-large' };

/** The spinning ring, as React's ProgressCircleSVG draws it: two gradient half arcs and a round cap. */
function ring(id: string, strokeWidth = 10) {
    const width = 100;
    const radius = width - strokeWidth;
    return html`<svg data-animated fill="none" viewBox="0 0 ${width * 2} ${width * 2}">
        <defs>
            <linearGradient id="${id}-second-half">
                <stop offset="50%" stop-color="currentColor" stop-opacity="0" />
                <stop offset="100%" stop-color="currentColor" stop-opacity="0.375" />
            </linearGradient>
            <linearGradient id="${id}-first-half">
                <stop offset="0%" stop-color="currentColor" stop-opacity="1" />
                <stop offset="100%" stop-color="currentColor" stop-opacity="0.375" />
            </linearGradient>
        </defs>
        <g stroke-width=${strokeWidth * 2}>
            <path
                d="M ${strokeWidth} ${width} A ${radius} ${radius} 0 0 1 ${width + radius} ${width}"
                stroke="url(#${id}-second-half)"
            />
            <path
                d="M ${width + radius} ${width} A ${radius} ${radius} 0 0 1 ${strokeWidth} ${width}"
                stroke="url(#${id}-first-half)"
            />
            <path
                d="M ${strokeWidth} ${width} A ${radius} ${radius} 0 0 1 ${strokeWidth} ${width - 2}"
                stroke="currentColor"
                stroke-linecap="round"
            />
        </g>
    </svg>`;
}

/**
 * Rotating circle or pill that indicates the status or state of completion for a process that’s part of a user flow.
 *
 * React to Web Component: `label` and `size` are attributes of the same name, and `labelPosition` is `label-position`.
 *
 * The element is a progressbar with no value, so it reads as indeterminate, named by its label ("Loading ..." when none
 * is given: say what is loading). Mark the region it stands in for as aria-busy while it shows. The ring spins once
 * every 1.5s, and stops under reduced motion.
 *
 * @element pttrn-progress-circle
 */
export class PttrnProgressCircle extends LitElement {
    static properties = {
        label: { type: String },
        size: { type: String },
        labelPosition: { type: String, attribute: 'label-position' },
    };

    static styles = styles;

    /** Says what is loading. Without one the progressbar is named "Loading ...". */
    declare label: string;
    /** The size of the ring and its label. */
    declare size: 'large' | 'medium' | 'small';
    /** Where the label sits, relative to the ring. Below it by default. */
    declare labelPosition: 'bottom' | 'left' | 'right' | 'top' | undefined;

    private readonly _id = uniqueId('pttrn-progress-circle');

    constructor() {
        super();
        this.label = '';
        this.size = 'medium';
        this.labelPosition = undefined;
    }

    render() {
        const size = this.size || 'medium';
        const font = txtFont(LABEL_VARIANTS[size] ?? 'labels-base');
        return html`<div
            aria-labelledby="${this._id}-label"
            data-label-position=${this.labelPosition || nothing}
            data-pttrn="progress-circle"
            data-size=${size}
            role="progressbar"
        >
            ${ring(this._id)}
            <span data-pttrn="txt" id="${this._id}-label" style=${styleMap({ 'overflow-wrap': 'break-word', font })}
                >${this.label || 'Loading ...'}</span
            >
        </div>`;
    }
}

define('pttrn-progress-circle', PttrnProgressCircle);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-progress-circle': PttrnProgressCircle;
    }
}
