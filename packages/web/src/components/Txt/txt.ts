import { LitElement, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { html, unsafeStatic } from 'lit/static-html.js';
import { define } from '../../utils/define';
import { skeletonText } from '../../utils/skeleton-text';
import { slotHasContent } from '../../utils/slot';
import { txtFont, type TxtVariant } from '../../utils/txt-variants';
import styles from './txt.scss';

/** The elements `as` can name: text-level and text-block elements. Anything else renders a span. */
const TAGS = new Set([
    'abbr',
    'address',
    'b',
    'blockquote',
    'caption',
    'cite',
    'code',
    'dd',
    'del',
    'div',
    'dt',
    'em',
    'figcaption',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'i',
    'ins',
    'kbd',
    'legend',
    'li',
    'mark',
    'p',
    'pre',
    'q',
    's',
    'samp',
    'small',
    'span',
    'strong',
    'sub',
    'sup',
    'time',
    'u',
    'var',
]);

/**
 * A text component that applies the correct font styles based on the variant and size.
 *
 * React to Web Component: `variant` and `inherit` are attributes of the same name, `skeletonLines` is `skeleton-lines`,
 * `as` names the element to render (a heading, a paragraph; a span by default), and `children` is the default slot, so
 * text and elements such as a `<code>` inside a heading render as they are.
 *
 * The element renders inside the shadow root, so a heading keeps its level for assistive technology. The host itself
 * takes no box: it lays out like the element it renders.
 *
 * @element pttrn-txt
 * @slot - The text, or elements such as a `<code>`. Without content, the skeleton shows when `skeleton-lines` is set.
 */
export class PttrnTxt extends LitElement {
    static properties = {
        as: { type: String },
        variant: { type: String },
        skeletonLines: { type: Number, attribute: 'skeleton-lines' },
        inherit: { type: Boolean },
        _hasContent: { state: true },
    };

    static styles = styles;

    /**
     * The element to render the text as, such as `h2` or `p`. Text-level and block text elements only; others render a
     * span.
     */
    declare as: string;
    /** The type style. */
    declare variant: TxtVariant;
    /** The number of skeleton lines to show while there is no content. 0 shows nothing. */
    declare skeletonLines: number;
    /** Leaves the font to the parent instead of setting the variant's. */
    declare inherit: boolean;
    declare _hasContent: boolean;

    constructor() {
        super();
        this.as = 'span';
        this.variant = 'body-base';
        this.skeletonLines = 0;
        this.inherit = false;
        this._hasContent = false;
    }

    private _onSlotChange(event: Event) {
        this._hasContent = slotHasContent(event.target as HTMLSlotElement);
    }

    render() {
        const tag = unsafeStatic(TAGS.has(this.as) ? this.as : 'span');
        const style = {
            // A word wider than its container breaks instead of overflowing it, as a large display size on a phone.
            'overflow-wrap': 'break-word',
            font: this.inherit ? undefined : txtFont(this.variant),
        };
        // The element stays in place while empty (hidden, as React renders nothing), so the slot keeps watching for
        // content.
        return html`<${tag} data-pttrn="txt" ?hidden=${!this._hasContent} style=${styleMap(style)}
            ><slot @slotchange=${this._onSlotChange}></slot></${tag}
        >${!this._hasContent && this.skeletonLines > 0 ? skeletonText(this.skeletonLines, this.variant) : nothing}`;
    }
}

define('pttrn-txt', PttrnTxt);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-txt': PttrnTxt;
    }
}
