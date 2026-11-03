import { LitElement, html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { define } from '../../utils/define';
import { slotHasContent } from '../../utils/slot';
import styles from './badge-dot.scss';

export type BadgeDotSize = 6 | 8 | 10 | 12;

const OUTLINE_WIDTHS: Record<BadgeDotSize, number> = {
    6: 1,
    8: 2,
    10: 2,
    12: 2,
};

/**
 * A non-numeric badge used to indicate something new or its current status.
 *
 * React to Web Component: `color`, `size` and `outline` are attributes of the same name, and `children` is the default
 * slot. With slotted content the dot is attached to its top right corner; without, it renders on its own.
 *
 * The dot is decorative: say what it means in text next to it, for example in the label of the element it is attached
 * to.
 *
 * @element pttrn-badge-dot
 * @slot - The element the dot is attached to, such as a button or an avatar. Optional.
 */
export class PttrnBadgeDot extends LitElement {
    static properties = {
        color: { type: String },
        size: { type: Number },
        outline: { type: Boolean },
        _attached: { state: true },
    };

    static styles = styles;

    /** The color of the dot. */
    declare color: 'primary' | 'secondary';
    /** The diameter of the dot in pixels: 6, 8, 10 or 12. Any other value falls back to 6. */
    declare size: 6 | 8 | 10 | 12;
    /** Adds an outline in the surface color, which separates the dot from what it sits on. */
    declare outline: boolean;
    declare _attached: boolean;

    constructor() {
        super();
        this.color = 'primary';
        this.size = 6;
        this.outline = false;
        this._attached = false;
    }

    private _onSlotChange(event: Event) {
        this._attached = slotHasContent(event.target as HTMLSlotElement);
    }

    render() {
        const size: BadgeDotSize = this.size in OUTLINE_WIDTHS ? this.size : 6;
        return html`<span data-wrapper ?data-attachment-wrapper=${this._attached}
            ><slot @slotchange=${this._onSlotChange}></slot
            ><sup
                ?data-attachment=${this._attached}
                data-color=${this.color}
                ?data-outline=${this.outline}
                data-pttrn="badge-dot"
                style=${styleMap({ '--size': `${size}px`, '--outline-width': `${OUTLINE_WIDTHS[size]}px` })}
            ></sup
        ></span>`;
    }
}

define('pttrn-badge-dot', PttrnBadgeDot);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-badge-dot': PttrnBadgeDot;
    }
}
