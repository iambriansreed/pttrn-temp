import { LitElement, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { define } from '../../utils/define';
import { slotHasContent } from '../../utils/slot';
import styles from './skeleton.scss';

/** A length attribute: a plain number is pixels, as a number prop is in React; anything else is a CSS length. */
const toLength = (value: number | string) => (/^\d+(\.\d+)?$/.test(String(value).trim()) ? `${value}px` : `${value}`);

/**
 * A visual placeholder for an element while it is in a loading state.
 *
 * The data for your components might not be immediately available. You can improve the perceived responsiveness of the
 * page by using skeletons. It feels like things are happening immediately, then the information is incrementally
 * displayed on the screen.
 *
 * React to Web Component: `variant`, `width` and `height` are attributes of the same name (a plain number is pixels),
 * and `children` is the default slot: while it is empty the placeholder shows, and once content is slotted in it shows
 * instead. The React `SkeletonCircular`, `SkeletonPhoto` and the other shortcuts are `variant` values here.
 *
 * The placeholder is a busy status labelled "Loading", and its pulse stops under reduced motion.
 *
 * @element pttrn-skeleton
 * @slot - The loaded content. While it is empty, the placeholder shows.
 */
export class PttrnSkeleton extends LitElement {
    static properties = {
        variant: { type: String },
        width: { type: String },
        height: { type: String },
        _hasContent: { state: true },
    };

    static styles = styles;

    /** The shape that best hints the content being loaded. */
    declare variant: 'circular' | 'photo' | 'profile' | 'rectangular' | 'thumbnail';
    /** The width of the placeholder: a number of pixels or a CSS length. Ignored by `profile` and `thumbnail`. */
    declare width: number | string;
    /** The height of the placeholder: a number of pixels or a CSS length. Ignored by `profile` and `thumbnail`. */
    declare height: number | string;
    declare _hasContent: boolean;

    constructor() {
        super();
        this.variant = 'rectangular';
        this.width = 100;
        this.height = 100;
        this._hasContent = false;
    }

    private _onSlotChange(event: Event) {
        this._hasContent = slotHasContent(event.target as HTMLSlotElement);
    }

    render() {
        // A removed attribute leaves the property null; it still means the default.
        const placeholder = html`<div
            aria-busy="true"
            aria-label="Loading"
            data-animated
            data-pttrn="skeleton"
            data-variant=${this.variant || 'rectangular'}
            role="status"
            style=${styleMap({ '--height': toLength(this.height ?? 100), '--width': toLength(this.width ?? 100) })}
        ></div>`;
        return html`${this._hasContent ? nothing : placeholder}<slot @slotchange=${this._onSlotChange}></slot>`;
    }
}

define('pttrn-skeleton', PttrnSkeleton);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-skeleton': PttrnSkeleton;
    }
}
