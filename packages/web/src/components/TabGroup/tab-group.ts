import { PropertyDeclarations, html } from 'lit';
import { define } from '../../utils/define';
import { PttrnTabListBase } from '../SegmentedControl/tab-list';
import './tab-group-item';
import styles from './tab-group.scss';

/**
 * Navigation tool that organizes content across different screens and views.
 *
 * A row of tabs, one selected at a time. Selecting one sets `value` and fires `pttrn-change`. Each
 * `pttrn-tab-group-item` is the tab itself, so give it `aria-controls` to point at the panel it shows. With fewer than
 * two items nothing renders.
 *
 * React to Web Component mapping:
 *
 * - `options` → `pttrn-tab-group-item` children (`value`, `label`, `disabled`, `badge`; `icon` and `iconSelected` are the
 *   `icon` and `icon-selected` slots)
 * - `value` → `value`
 * - `onChange` → the `pttrn-change` event
 * - `label` → `label`
 * - `size` → `size`
 * - `width` → `width`
 * - `showTrail` → `show-trail`
 *
 * @element pttrn-tab-group
 * @slot - `pttrn-tab-group-item` elements.
 */
export class PttrnTabGroup extends PttrnTabListBase {
    static properties: PropertyDeclarations = {
        showTrail: { type: Boolean, attribute: 'show-trail', reflect: true },
    };

    static styles = styles;

    /** With `width="hug"`, extends the underline across the full width. Not applicable with `width="fill"`. */
    declare showTrail: boolean;

    constructor() {
        super();
        this.showTrail = false;
    }

    protected get itemTag() {
        return 'pttrn-tab-group-item';
    }

    protected syncItems() {
        super.syncItems();
        const trail = this.showTrail && this.width !== 'fill';
        for (const item of this.items) item.toggleAttribute('data-trail', trail);
    }

    render() {
        // React renders nothing for fewer than two options; the slot stays so the list notices new items.
        if (this.items.length < 2) return html`<slot hidden @slotchange=${() => this.requestUpdate()}></slot>`;
        return this.renderList();
    }
}

define('pttrn-tab-group', PttrnTabGroup);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-tab-group': PttrnTabGroup;
    }
}
