import { LitElement, html, nothing } from 'lit';
import { TooltipController } from '../../internal/tooltip';
import { define } from '../../utils/define';
import styles from './tag.scss';

/**
 * A non-interactive visual indicators to draw attention or categorization of a component.
 *
 * React to Web Component: `label`, `size`, `color` and `variant` are attributes of the same name, and other attributes
 * (an `id`, a `title`) stay on the element.
 *
 * The label is cut to one line; when it is cut, hovering it shows the whole label in a tooltip, which also names it for
 * assistive technology. A tag never acts, so it is not a button or a link, and color alone must not carry meaning the
 * label does not.
 *
 * @element pttrn-tag
 */
export class PttrnTag extends LitElement {
    static properties = {
        label: { type: String },
        size: { type: String },
        color: { type: String },
        variant: { type: String },
        _truncated: { state: true },
    };

    static styles = styles;

    /** The text of the tag. Named like React's prop; the tag has no other content. */
    declare label: string;
    /** The size of the tag. */
    declare size: 'small' | 'x-small';
    /** The color of the tag, one of the USWDS theme color families. */
    declare color:
        'accent-cool' | 'accent-warm' | 'base' | 'error' | 'info' | 'primary' | 'secondary' | 'success' | 'warning';
    /** The shape of the tag: flat corners, a pill, or a corner folded under. */
    declare variant: 'corner-wrap' | 'flat' | 'pill';
    declare _truncated: boolean;

    private readonly _tooltip = new TooltipController(this, () => this._label());
    private _resizeObserver?: ResizeObserver;

    constructor() {
        super();
        this.label = '';
        this.size = 'small';
        this.color = 'base';
        this.variant = 'flat';
        this._truncated = false;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._resizeObserver?.disconnect();
        this._resizeObserver = undefined;
    }

    private _label() {
        return this.shadowRoot?.querySelector<HTMLElement>('[data-truncated]');
    }

    /** Whether the label is cut, checked after every render and whenever the label's box changes size. */
    private _measure = () => {
        const label = this._label();
        this._truncated = !!label && label.scrollWidth > label.clientWidth;
        if (!this._truncated) this._tooltip.hide();
    };

    protected updated() {
        const label = this._label();
        if (label && !this._resizeObserver) {
            this._resizeObserver = new ResizeObserver(this._measure);
            this._resizeObserver.observe(label);
        }
        this._measure();
    }

    private _show = () => {
        if (this._truncated) this._tooltip.show();
    };

    render() {
        // A removed attribute leaves the property null; it still means the default.
        const variant = this.variant || 'flat';
        const truncated = this._truncated;
        return html`<span
                data-color=${this.color || 'base'}
                data-pttrn="tag"
                data-size=${this.size || 'small'}
                data-variant=${variant}
                >${
                    this.label
                        ? html`<span
                              aria-labelledby=${truncated ? this._tooltip.id : nothing}
                              data-truncated
                              role=${truncated ? 'note' : nothing}
                              @blur=${this._tooltip.hide}
                              @focus=${this._show}
                              @mouseleave=${this._tooltip.hide}
                              @mouseover=${this._show}
                              >${this.label}</span
                          >`
                        : nothing
                }${variant === 'corner-wrap' ? html`<div data-triangle></div>` : nothing}</span
            >${truncated ? this._tooltip.render(this.label) : nothing}`;
    }
}

define('pttrn-tag', PttrnTag);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-tag': PttrnTag;
    }
}
