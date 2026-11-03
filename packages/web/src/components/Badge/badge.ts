import { LitElement, html, nothing } from 'lit';
import { define } from '../../utils/define';
import { slotHasContent } from '../../utils/slot';
import styles from './badge.scss';


/**
 * Visual indicator for new items within a parent page represented with a numerical count of new items.
 *
 * React to Web Component: `count`, `size` and `color` are attributes of the same name, `surfaceBorder` is
 * `surface-border`, and `children` is the default slot. With slotted content the badge is attached to its top right
 * corner; without a count only the slotted content renders.
 *
 * Assistive technology reads the number alone, so the element the badge is attached to says what it counts in its own
 * label, for example "Messages, 5 unread".
 *
 * @element pttrn-badge
 * @slot - The element the badge is attached to, such as a button or an avatar. Optional.
 */
export class PttrnBadge extends LitElement {
    static properties = {
        count: { type: Number },
        size: { type: String },
        color: { type: String },
        surfaceBorder: { type: Boolean, attribute: 'surface-border' },
        _attached: { state: true },
    };

    static styles = styles;

    /**
     * The count the badge shows, as a whole number. Above 99 it shows "99+". Without a count only the slotted content
     * renders.
     */
    declare count: number | undefined;
    /** The size of the badge. */
    declare size: 'small' | 'x-small';
    /** The color of the badge. */
    declare color: 'primary' | 'secondary';
    /** Adds a border in the surface color, which separates the badge from what it sits on. */
    declare surfaceBorder: boolean;
    declare _attached: boolean;

    constructor() {
        super();
        this.count = undefined;
        this.size = 'small';
        this.color = 'primary';
        this.surfaceBorder = false;
        this._attached = false;
    }

    private _onSlotChange(event: Event) {
        this._attached = slotHasContent(event.target as HTMLSlotElement);
    }

    render() {
        // A whole number, read the way React's `tryIntParse` reads it; anything else means no count and no badge. The
        // slot stays in place either way, so its content is not reassigned when the count comes and goes.
        const count = this.count === undefined || this.count === null ? NaN : parseInt(String(this.count), 10);
        const hasCount = !Number.isNaN(count);
        const attached = hasCount && this._attached;

        return html`<span data-wrapper ?data-attachment-wrapper=${attached}
            ><slot @slotchange=${this._onSlotChange}></slot>${
                hasCount
                    ? html`<sup
                          ?data-attachment=${attached}
                          data-color=${this.color}
                          data-pttrn="badge"
                          data-size=${this.size}
                          ?data-surface-border=${this.surfaceBorder}
                          >${count > 99 ? '99+' : count}</sup
                      >`
                    : nothing
            }</span
        >`;
    }
}

define('pttrn-badge', PttrnBadge);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-badge': PttrnBadge;
    }
}
