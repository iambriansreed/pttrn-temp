import { LitElement, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { define } from '../../utils/define';
import styles from './chip-group.scss';

/**
 * A component that manages the layout of a group of chips.
 *
 * React prop to Web Component mapping:
 *
 * - `items` → child `pttrn-chip` elements, each with its own attributes and listeners.
 * - `overflow` → `overflow` attribute.
 *
 * @element pttrn-chip-group
 * @slot - `pttrn-chip` elements.
 */
export class PttrnChipGroup extends LitElement {
    static properties = {
        overflow: { type: String, reflect: true },
        _empty: { state: true },
    };

    static styles = styles;

    /** `wrap` puts the chips on as many lines as they need; `scroll` keeps one line that scrolls sideways. */
    declare overflow: 'scroll' | 'wrap';
    declare _empty: boolean;

    constructor() {
        super();
        this.overflow = 'wrap';
        this._empty = true;
    }

    private _onSlotChange(event: Event) {
        this._empty = (event.target as HTMLSlotElement).assignedElements().length === 0;
    }

    render() {
        return html`<div
            data-empty=${ifDefined(this._empty ? '' : undefined)}
            data-pttrn="chip-group"
            data-scroll=${ifDefined(this.overflow === 'scroll' ? '' : undefined)}
        >
            <slot @slotchange=${this._onSlotChange}></slot>
        </div>`;
    }
}

define('pttrn-chip-group', PttrnChipGroup);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-chip-group': PttrnChipGroup;
    }
}
