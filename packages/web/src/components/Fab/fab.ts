import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { define } from '../../utils/define';
import { TooltipController } from '../../utils/tooltip';
import styles from './fab.scss';

export type FabSize = 'medium' | 'x-large';
export type FabVariant = 'neutral' | 'primary' | 'secondary';
export type FabPlacement = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

/**
 * A button that highlights a primary action that is elevated above the body content of a page; normally fixed to the
 * bottom right of a screen.
 *
 * React prop to Web Component mapping:
 *
 * - `label`, `tooltip`, `size`, `variant`, `placement`, `container` → attributes of the same name.
 * - `icon` → `slot="icon"`; `iconOnly` → `icon-only` (ignored without an icon), which rounds the button.
 * - `as="a"` → `href` (and `target`): the element renders a link.
 * - The aria-label prop → the aria-label attribute on the element, passed to the inner button.
 * - `onClick` → the native `click` event.
 *
 * The element itself is the positioned box: it sits in a corner of its nearest positioned ancestor
 * (`container="local"`) or of the viewport (`container="page"`).
 *
 * @element pttrn-fab
 * @slot icon - The icon, decorative (aria-hidden). Shown before the label, or alone with `icon-only`.
 * @csspart button - The inner `<button>` (or `<a>` with `href`).
 */
export class PttrnFab extends LitElement {
    static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

    static properties = {
        label: { type: String },
        size: { type: String, reflect: true },
        variant: { type: String, reflect: true },
        placement: { type: String, reflect: true },
        container: { type: String, reflect: true },
        iconOnly: { type: Boolean, attribute: 'icon-only', reflect: true },
        tooltip: { type: String },
        href: { type: String },
        target: { type: String },
        accessibleLabel: { type: String, attribute: 'aria-label' },
        _hasIcon: { state: true },
    };

    static styles = styles;

    /** The visible label, and the accessible name unless aria-label gives one. */
    declare label: string;
    /** The size of the button. */
    declare size: FabSize;
    /** The style variant of the button. */
    declare variant: FabVariant;
    /** The corner the button sits in. */
    declare placement: FabPlacement;
    /** `local` places it in its nearest positioned ancestor; `page` fixes it to the viewport. */
    declare container: 'local' | 'page';
    /** Hides the label and rounds the button; the label then names it and shows in a tooltip. */
    declare iconOnly: boolean;
    /** The tooltip text shown on hover and focus. It describes a labelled button. */
    declare tooltip: string;
    /** Renders a link (`<a href>`) instead of a `<button>`, the React `as="a"`. */
    declare href: string | undefined;
    /** The link target, with `href`. */
    declare target: string | undefined;
    /** The accessible name, from the aria-label attribute. */
    declare accessibleLabel: string | undefined;
    declare _hasIcon: boolean;

    private readonly _tooltip = new TooltipController(this);

    constructor() {
        super();
        this.label = '';
        this.size = 'medium';
        this.variant = 'primary';
        this.placement = 'bottom-right';
        this.container = 'local';
        this.iconOnly = false;
        this.tooltip = '';
        this.href = undefined;
        this.target = undefined;
        this.accessibleLabel = undefined;
        this._hasIcon = false;
    }

    private _onIconSlotChange(event: Event) {
        this._hasIcon = (event.target as HTMLSlotElement).assignedElements().length > 0;
    }

    render() {
        const iconOnly = this.iconOnly && this._hasIcon;
        const tooltip = this.tooltip || (iconOnly ? this.label : '');
        // An icon-only Fab is named by its tooltip (the label), as a Button is. With a visible label the tooltip describes
        // the Fab, so the name stays the text people see.
        const labelledBy = tooltip && iconOnly && !this.accessibleLabel ? this._tooltip.id : undefined;
        const describedBy = tooltip && !iconOnly ? this._tooltip.id : undefined;
        const events = tooltip ? this._tooltip : undefined;

        const content = html`
            <span aria-hidden="true" data-fab-icon ?hidden=${!this._hasIcon}>
                <slot name="icon" @slotchange=${this._onIconSlotChange}></slot>
            </span>
            ${iconOnly ? nothing : html`<span data-fab-label>${this.label}</span>`}
        `;

        const control = this.href
            ? html`<a
                  aria-describedby=${ifDefined(describedBy)}
                  aria-label=${ifDefined(this.accessibleLabel || this.label || undefined)}
                  aria-labelledby=${ifDefined(labelledBy)}
                  data-pttrn="fab"
                  data-round=${ifDefined(iconOnly ? '' : undefined)}
                  data-size=${this.size}
                  data-variant=${this.variant}
                  href=${this.href}
                  part="button"
                  target=${ifDefined(this.target)}
                  @blur=${events?.hide}
                  @focus=${events?.show}
                  @mouseleave=${events?.hide}
                  @mouseover=${events?.show}
                  >${content}</a
              >`
            : html`<button
                  aria-describedby=${ifDefined(describedBy)}
                  aria-label=${ifDefined(this.accessibleLabel || this.label || undefined)}
                  aria-labelledby=${ifDefined(labelledBy)}
                  data-pttrn="fab"
                  data-round=${ifDefined(iconOnly ? '' : undefined)}
                  data-size=${this.size}
                  data-variant=${this.variant}
                  part="button"
                  type="button"
                  @blur=${events?.hide}
                  @focus=${events?.show}
                  @mouseleave=${events?.hide}
                  @mouseover=${events?.show}
              >
                  ${content}
              </button>`;

        return html`${control}${this._tooltip.render(tooltip)}`;
    }
}

define('pttrn-fab', PttrnFab);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-fab': PttrnFab;
    }
}
