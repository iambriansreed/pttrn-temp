import { LitElement, html, nothing } from 'lit';
import '../Button/button';
import type { ButtonSize } from '../Button/button';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import styles from './empty-state.scss';

/**
 * A design pattern component that indicates to users that system has no content to display.
 *
 * React prop to Web Component mapping:
 *
 * - `children` (the illustration) → the default slot.
 * - `header`, `body` → attributes of the same name; `bodyAlign` → `body-align`.
 * - `callToAction` → `action-label` and `action-size`, which show a primary pttrn-button, and the `pttrn-action` event it
 *   fires.
 *
 * @fires {CustomEvent<null>} pttrn-action - The call-to-action button was activated.
 * @element pttrn-empty-state
 * @slot - The illustration or icon above the text. Decorative: give an image an empty alt.
 * @csspart text - The header and body.
 */
export class PttrnEmptyState extends LitElement {
    static properties = {
        header: { type: String },
        body: { type: String },
        bodyAlign: { type: String, attribute: 'body-align', reflect: true },
        actionLabel: { type: String, attribute: 'action-label' },
        actionSize: { type: String, attribute: 'action-size' },
    };

    static styles = styles;

    /** The header, styled as a small heading (not a heading element, so the page outline does not change). */
    declare header: string;
    /** The body text. */
    declare body: string;
    /** The text alignment of the header and body. */
    declare bodyAlign: 'center' | 'left';
    /** The label of the call-to-action button, which fires `pttrn-action`. Without it there is no button. */
    declare actionLabel: string;
    /** The size of the call-to-action button. */
    declare actionSize: ButtonSize;

    constructor() {
        super();
        this.header = '';
        this.body = '';
        this.bodyAlign = 'center';
        this.actionLabel = '';
        this.actionSize = 'medium';
    }

    render() {
        return html`<div data-pttrn="empty-state">
            <slot></slot>
            <div data-body-align=${this.bodyAlign === 'left' ? 'left' : 'center'} data-text part="text">
                ${this.header ? html`<span data-header>${this.header}</span>` : nothing}
                ${this.body ? html`<span data-body>${this.body}</span>` : nothing}
            </div>
            ${
                this.actionLabel
                    ? html`<pttrn-button
                          label=${this.actionLabel}
                          size=${this.actionSize || 'medium'}
                          variant="primary"
                          @click=${() => emit(this, 'pttrn-action', null)}
                      ></pttrn-button>`
                    : nothing
            }
        </div>`;
    }
}

define('pttrn-empty-state', PttrnEmptyState);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-empty-state': PttrnEmptyState;
    }
}
