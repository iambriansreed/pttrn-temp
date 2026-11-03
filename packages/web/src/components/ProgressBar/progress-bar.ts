import { LitElement, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { define } from '../../utils/define';
import { uniqueId } from '../../utils/id';
import styles from './progress-bar.scss';

/**
 * A progress bar is a horizontal visual indicator that let’s the user know the progression of a task or operation
 * occurring in the background.
 *
 * React to Web Component: `completion`, `size`, `align` and `label` are attributes of the same name, and `successColor`
 * and `successHidden` are `success-color` and `success-hidden`.
 *
 * A native progress element, named by the label, carries the value for assistive technology (role progressbar, 0 to
 * 100, busy until complete); the bar drawn under it is hidden from assistive technology.
 *
 * @element pttrn-progress-bar
 */
export class PttrnProgressBar extends LitElement {
    static properties = {
        completion: { type: Number },
        size: { type: String },
        align: { type: String },
        label: { type: String },
        successColor: { type: Boolean, attribute: 'success-color' },
        successHidden: { type: Boolean, attribute: 'success-hidden' },
    };

    static styles = styles;

    /** How far the task has come, from 0 to 100. It is rounded, and kept between 0 and 100. */
    declare completion: number;
    /** The height of the bar. */
    declare size: 'large' | 'small';
    /** Where the label sits under the bar. */
    declare align: 'center' | 'left';
    /** Names the progress for assistive technology and shows under the bar. Say what is progressing. */
    declare label: string;
    /** Shows a complete bar in the success color. A narrow use case: see the guidelines. */
    declare successColor: boolean;
    /** Renders nothing once the bar is complete. A narrow use case: see the guidelines. */
    declare successHidden: boolean;

    private readonly _id = uniqueId('pttrn-progress-bar');

    constructor() {
        super();
        this.completion = 0;
        this.size = 'large';
        this.align = 'center';
        this.label = '';
        this.successColor = false;
        this.successHidden = false;
    }

    render() {
        const completion = Math.max(0, Math.min(100, Math.round(Number(this.completion) || 0)));
        if (this.successHidden && completion === 100) return nothing;

        return html`<div
            data-align=${this.align}
            data-pttrn="progress-bar"
            data-size=${this.size}
            data-success=${this.successColor && completion === 100 ? 'color' : nothing}
        >
            <progress
                aria-busy=${completion < 100 ? 'true' : 'false'}
                aria-valuemax="100"
                aria-valuemin="0"
                aria-valuenow=${completion}
                id=${this._id}
                max="100"
                .value=${completion}
                value=${completion}
            >
                ${completion}%
            </progress>
            <div aria-hidden="true" data-bar style=${styleMap({ '--width': `${completion}%` })}></div>
            <label for=${this._id}>${this.label}</label>
        </div>`;
    }
}

define('pttrn-progress-bar', PttrnProgressBar);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-progress-bar': PttrnProgressBar;
    }
}
