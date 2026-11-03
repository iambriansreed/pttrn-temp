import { LitElement, html, nothing } from 'lit';
import { define } from '../../utils/define';
import { skeletonText } from '../../utils/skeleton-text';
import { slotHasContent } from '../../utils/slot';
import type { TxtVariant } from '../../utils/txt-variants';
import styles from './skeleton-text.scss';

/**
 * A visual placeholder for an text while it is in a loading state.
 *
 * React to Web Component: `variant` and `lines` are attributes of the same name, and `children` is the default slot:
 * while it is empty the placeholder shows, and once content is slotted in it shows instead.
 *
 * The placeholder is a busy status labelled "Loading", one bar per line in the variant's size and line height, the last
 * one shorter. Its pulse stops under reduced motion.
 *
 * @element pttrn-skeleton-text
 * @slot - The loaded text. While it is empty, the placeholder shows.
 */
export class PttrnSkeletonText extends LitElement {
    static properties = {
        variant: { type: String },
        lines: { type: Number },
        _hasContent: { state: true },
    };

    static styles = styles;

    /** The Txt variant of the text being loaded, which sizes the lines. */
    declare variant: TxtVariant;
    /** The number of lines. Fewer than one still shows one. */
    declare lines: number;
    declare _hasContent: boolean;

    constructor() {
        super();
        this.variant = 'body-base';
        this.lines = 3;
        this._hasContent = false;
    }

    private _onSlotChange(event: Event) {
        this._hasContent = slotHasContent(event.target as HTMLSlotElement);
    }

    render() {
        // A removed attribute leaves the property null; it still means the default.
        const placeholder = this._hasContent ? nothing : skeletonText(this.lines ?? 3, this.variant);
        return html`${placeholder}<slot @slotchange=${this._onSlotChange}></slot>`;
    }
}

define('pttrn-skeleton-text', PttrnSkeletonText);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-skeleton-text': PttrnSkeletonText;
    }
}
