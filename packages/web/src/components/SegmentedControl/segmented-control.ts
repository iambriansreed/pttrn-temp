import { PropertyDeclarations } from 'lit';
import { define } from '../../utils/define';
import { PttrnTabListBase } from './tab-list';
import './segmented-control-item';
import styles from './segmented-control.scss';

/**
 * Navigation tool that organizes content across different screens and views.
 *
 * A compact row of segments, one selected at a time. Selecting one sets `value` and fires `pttrn-change`.
 *
 * React to Web Component mapping:
 *
 * - `options` → `pttrn-segmented-control-item` children (`value`, `label`, `disabled`; `icon` and `iconSelected` are the
 *   `icon` and `icon-selected` slots)
 * - `value` → `value`
 * - `onChange` → the `pttrn-change` event
 * - `label` → `label`
 * - `size` → `size`
 * - `width` → `width`
 * - `iconsOnly` → `icons-only`
 *
 * @element pttrn-segmented-control
 * @slot - `pttrn-segmented-control-item` elements.
 */
export class PttrnSegmentedControl extends PttrnTabListBase {
    static properties: PropertyDeclarations = {
        iconsOnly: { type: Boolean, attribute: 'icons-only', reflect: true },
    };

    static styles = styles;

    /**
     * Hides the labels and shows each as a tooltip instead. Ignored unless every item has an icon (the `icon` slot) and
     * a label.
     */
    declare iconsOnly: boolean;

    constructor() {
        super();
        this.iconsOnly = false;
    }

    protected get itemTag() {
        return 'pttrn-segmented-control-item';
    }

    protected syncItems() {
        super.syncItems();
        const items = this.items;
        const iconsOnly = this.iconsOnly && items.every((item) => item.hasIcon && !!item.label);
        for (const item of items) item.toggleAttribute('data-icons-only', iconsOnly);
    }
}

define('pttrn-segmented-control', PttrnSegmentedControl);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-segmented-control': PttrnSegmentedControl;
    }
}
