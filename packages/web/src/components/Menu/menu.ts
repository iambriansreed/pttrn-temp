import { LitElement, html } from 'lit';
import { define } from '../../utils/define';
import styles from './menu.scss';

/**
 * A container housing a simple list of options presented to the customer to select one option at a time.
 *
 * The element is the panel: put `pttrn-list-item` and `pttrn-divider` elements in it. It takes no role of its own; when
 * the items follow a pattern, give the element that role (`role="menu"` with `role="menuitem"` items, `role="listbox"`
 * with `role="option"` items) and name it with `label`.
 *
 * React to Web Component mapping:
 *
 * - `children` → the default slot
 * - `label` → `label` (the element's `aria-label`)
 * - `role` → `role` on the element
 * - `width` → `width` (any CSS width)
 * - `as` → no counterpart: give the element the role the other tag would have (`role="navigation"` for `nav`)
 *
 * @element pttrn-menu
 * @slot - `pttrn-list-item` and `pttrn-divider` elements.
 */
export class PttrnMenu extends LitElement {
    static properties = {
        label: { type: String },
        width: { type: String },
    };

    static styles = styles;

    /** Names the menu for assistive technology; needed with `role="menu"` or `role="listbox"`. */
    declare label: string;
    /** The width of the panel, as a CSS length. Defaults to 332px, never wider than its container. */
    declare width: string;

    /** The attributes the element set itself, so it removes only its own. */
    private _ownLabel = false;
    private _ownWidth = false;

    constructor() {
        super();
        this.label = '';
        this.width = '';
    }

    protected updated() {
        if (this.label) {
            this.setAttribute('aria-label', this.label);
            this._ownLabel = true;
        } else if (this._ownLabel) {
            this.removeAttribute('aria-label');
            this._ownLabel = false;
        }
        if (this.width) {
            this.style.width = this.width;
            this._ownWidth = true;
        } else if (this._ownWidth) {
            this.style.removeProperty('width');
            this._ownWidth = false;
        }
    }

    render() {
        return html`<slot></slot>`;
    }
}

define('pttrn-menu', PttrnMenu);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-menu': PttrnMenu;
    }
}
