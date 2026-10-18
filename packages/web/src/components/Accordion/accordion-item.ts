import arrowDown from '@ptrn/icons/KeyboardArrowDown.svg';
import arrowUp from '@ptrn/icons/KeyboardArrowUp.svg';
import { LitElement, html, nothing } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { define } from '../../utils/define';
import { emit } from '../../utils/emit';
import { uniqueId } from '../../utils/id';
import styles from './accordion-item.scss';

export type AccordionToggleDetail = { open: boolean };

/**
 * One collapsible panel of a `ptrn-accordion`.
 *
 * @fires ptrn-toggle - After the user opens or closes the panel. `detail.open` is the new state.
 * @element ptrn-accordion-item
 * @slot - The panel content.
 * @slot leading - Shown before the heading.
 * @slot trailing - Shown after the heading, before the arrow.
 */
export class PtrnAccordionItem extends LitElement {
    static properties = {
        heading: { type: String },
        subtitle: { type: String },
        open: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        _hasLeading: { state: true },
        _hasTrailing: { state: true },
    };

    static styles = styles;

    /** The title of the panel. Named `heading` because `title` is the native tooltip attribute. */
    declare heading: string;
    /** A second line under the heading. */
    declare subtitle: string;
    /** Whether the panel is open. Ignored while `disabled`. */
    declare open: boolean;
    /** Prevents the panel from being toggled. */
    declare disabled: boolean;
    declare _hasLeading: boolean;
    declare _hasTrailing: boolean;

    private readonly _headerId = uniqueId('ptrn-accordion-header');
    private readonly _contentId = uniqueId('ptrn-accordion-content');

    constructor() {
        super();
        this.heading = '';
        this.subtitle = '';
        this.open = false;
        this.disabled = false;
        this._hasLeading = false;
        this._hasTrailing = false;
    }

    private _toggle() {
        if (this.disabled) return;
        this.open = !this.open;
        emit<AccordionToggleDetail>(this, 'ptrn-toggle', { open: this.open });
    }

    private _onSlotChange(event: Event, key: '_hasLeading' | '_hasTrailing') {
        this[key] = (event.target as HTMLSlotElement).assignedNodes().length > 0;
    }

    render() {
        const isOpen = this.open && !this.disabled;
        return html`
            <section data-pttrn="accordion-item" ?data-disabled=${this.disabled}>
                <button
                    aria-controls=${this._contentId}
                    aria-expanded=${isOpen}
                    data-header
                    id=${this._headerId}
                    type="button"
                    ?disabled=${this.disabled}
                    @click=${this._toggle}
                >
                    <span data-leading ?hidden=${!this._hasLeading}>
                        <slot name="leading" @slotchange=${(e: Event) => this._onSlotChange(e, '_hasLeading')}></slot>
                    </span>
                    <span data-title-subtitle>
                        <span data-title>${this.heading}</span>
                        ${this.subtitle ? html`<span data-subtitle>${this.subtitle}</span>` : nothing}
                    </span>
                    <span data-trailing ?hidden=${!this._hasTrailing}>
                        <slot name="trailing" @slotchange=${(e: Event) => this._onSlotChange(e, '_hasTrailing')}></slot>
                    </span>
                    <span data-arrow>${unsafeSVG(isOpen ? arrowUp : arrowDown)}</span>
                </button>
                <div data-content id=${this._contentId} ?hidden=${!isOpen}>
                    <slot></slot>
                </div>
                <span data-divider></span>
            </section>
        `;
    }
}

define('ptrn-accordion-item', PtrnAccordionItem);

declare global {
    interface HTMLElementTagNameMap {
        'ptrn-accordion-item': PtrnAccordionItem;
    }
}
