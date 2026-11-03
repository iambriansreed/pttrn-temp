import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { define } from '../../utils/define';
import styles from './chip.scss';

/**
 * Dynamically generated options that are suggested to the user as responses or prompts.
 *
 * React prop to Web Component mapping:
 *
 * - `label`, `disabled`, `flat`, `selected` → attributes of the same name.
 * - `selected={false}` (a toggle that is off) → `toggle` without `selected`. A chip with `toggle` or `selected` carries
 *   aria-pressed; one with neither is a plain action, as a chip without the prop is in React.
 * - `leadingIcon` / `trailingIcon` → `slot="leading-icon"` / `slot="trailing-icon"`.
 * - `trailingBadge` → `badge-count`, `badge-size` and `badge-surface-border`; hidden while there is a trailing icon.
 * - `onClick` → the native `click` event; a disabled chip stops it.
 *
 * @element pttrn-chip
 * @slot leading-icon - An icon before the label, decorative (aria-hidden).
 * @slot trailing-icon - An icon after the label, decorative (aria-hidden). It replaces the badge.
 * @csspart chip - The inner `<button>`.
 */
export class PttrnChip extends LitElement {
    static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

    static properties = {
        label: { type: String },
        disabled: { type: Boolean, reflect: true },
        flat: { type: Boolean, reflect: true },
        selected: { type: Boolean, reflect: true },
        toggle: { type: Boolean, reflect: true },
        badgeCount: { type: Number, attribute: 'badge-count' },
        badgeSize: { type: String, attribute: 'badge-size' },
        badgeSurfaceBorder: { type: Boolean, attribute: 'badge-surface-border' },
        _hasLeading: { state: true },
        _hasTrailing: { state: true },
    };

    static styles = styles;

    /** The label of the chip, and its accessible name. */
    declare label: string;
    /** Disables the chip. It leaves the tab order and does not fire `click`. */
    declare disabled: boolean;
    /** Removes the drop shadow. */
    declare flat: boolean;
    /** Shows the chip as selected, and as pressed to assistive technology. */
    declare selected: boolean;
    /** Makes the chip a toggle: it carries aria-pressed (from `selected`) even while not selected. */
    declare toggle: boolean;
    /** A count shown in a badge after the label. Above 99 it shows 99+. */
    declare badgeCount: number | undefined;
    /** The size of the badge. */
    declare badgeSize: 'small' | 'x-small';
    /** Gives the badge a border in the surface color. */
    declare badgeSurfaceBorder: boolean;
    declare _hasLeading: boolean;
    declare _hasTrailing: boolean;

    constructor() {
        super();
        this.label = '';
        this.disabled = false;
        this.flat = false;
        this.selected = false;
        this.toggle = false;
        this.badgeCount = undefined;
        this.badgeSize = 'small';
        this.badgeSurfaceBorder = false;
        this._hasLeading = false;
        this._hasTrailing = false;
        // Registered first, so a disabled chip stops the event before any listener a consumer adds.
        this.addEventListener('click', (event) => {
            if (!this.disabled) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        });
    }

    private _onSlotChange(event: Event, key: '_hasLeading' | '_hasTrailing') {
        this[key] = (event.target as HTMLSlotElement).assignedElements().length > 0;
    }

    private _badge() {
        const count = this.badgeCount;
        if (count === undefined || count === null || Number.isNaN(count) || this._hasTrailing) return nothing;
        return html`<sup
            data-badge
            data-color="primary"
            data-size=${this.badgeSize}
            data-surface-border=${ifDefined(this.badgeSurfaceBorder ? '' : undefined)}
            >${Math.trunc(count) > 99 ? '99+' : Math.trunc(count)}</sup
        >`;
    }

    render() {
        const pressed = this.toggle || this.selected ? String(this.selected) : undefined;
        return html`<button
            aria-pressed=${ifDefined(pressed)}
            data-disabled=${ifDefined(this.disabled ? '' : undefined)}
            data-flat=${ifDefined(this.flat ? '' : undefined)}
            data-pttrn="chip"
            data-selected=${ifDefined(this.selected ? '' : undefined)}
            data-touch-target-parent
            part="chip"
            type="button"
            ?disabled=${this.disabled}
        >
            <span aria-hidden="true" data-chip-icon ?hidden=${!this._hasLeading}>
                <slot name="leading-icon" @slotchange=${(e: Event) => this._onSlotChange(e, '_hasLeading')}></slot>
            </span>
            <span>${this.label}</span>
            <span aria-hidden="true" data-chip-icon ?hidden=${!this._hasTrailing}>
                <slot name="trailing-icon" @slotchange=${(e: Event) => this._onSlotChange(e, '_hasTrailing')}></slot>
            </span>
            ${this._badge()}
            <span data-touch-target></span>
        </button>`;
    }
}

define('pttrn-chip', PttrnChip);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-chip': PttrnChip;
    }
}
