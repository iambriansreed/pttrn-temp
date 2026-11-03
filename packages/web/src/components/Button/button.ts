import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { define } from '../../utils/define';
import { TooltipController } from '../../utils/tooltip';
import styles from './button.scss';

export type ButtonSize = 'large' | 'medium' | 'small' | 'x-small';
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

/**
 * A clickable component that allows users to perform an action, make a choice or trigger a change in state.
 *
 * React prop to Web Component mapping:
 *
 * - `label` → `label` attribute; text in the default slot wins, as string `children` do in React.
 * - `icon` → `slot="icon"`; `iconOnly` → `icon-only` (ignored without an icon).
 * - `as="a"` → `href` (and `target`): the element renders a link that keeps role button and has no `type`.
 * - `size`, `variant`, `destructive`, `width`, `disabled`, `tooltip` → attributes of the same name.
 * - The aria-label prop → the aria-label attribute on the element, passed to the inner button.
 * - `onClick` → the native `click` event; a disabled button stops it.
 * - Form submission (a React `type="submit"` button) → `type="submit"` or `type="reset"`, which act on the button's form.
 *
 * @element pttrn-button
 * @slot - The label. Text here is the label and the accessible name; other content replaces the label text.
 * @slot icon - The icon, decorative (aria-hidden). Shown before the label, or alone with `icon-only`.
 * @csspart button - The inner `<button>` (or `<a>` with `href`).
 */
export class PttrnButton extends LitElement {
    static formAssociated = true;

    static shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

    static properties = {
        label: { type: String },
        size: { type: String, reflect: true },
        variant: { type: String, reflect: true },
        destructive: { type: Boolean, reflect: true },
        width: { type: String, reflect: true },
        disabled: { type: Boolean, reflect: true },
        iconOnly: { type: Boolean, attribute: 'icon-only', reflect: true },
        tooltip: { type: String },
        href: { type: String },
        target: { type: String },
        type: { type: String },
        accessibleLabel: { type: String, attribute: 'aria-label' },
        _hasIcon: { state: true },
        _slotText: { state: true },
        _hasContent: { state: true },
    };

    static styles = styles;

    /** The label of the button. Text in the default slot takes its place. */
    declare label: string;
    /** The size of the button. */
    declare size: ButtonSize;
    /** The color variant of the button. */
    declare variant: ButtonVariant;
    /** The function of the button is destructive. */
    declare destructive: boolean;
    /** `fill` stretches the button to the width of its container; `hug` fits the content. */
    declare width: 'fill' | 'hug';
    /** Disables the button. It leaves the tab order and does not fire `click`. */
    declare disabled: boolean;
    /** Hides the label and shows only the icon; the label then names the button and shows in a tooltip. */
    declare iconOnly: boolean;
    /** The tooltip text shown on hover and focus. It describes a labelled button and names an icon-only one. */
    declare tooltip: string;
    /** Renders a link (`<a href>`) with role button instead of a `<button>`, the React `as="a"`. */
    declare href: string | undefined;
    /** The link target, with `href`. */
    declare target: string | undefined;
    /** `submit` or `reset` acts on the form the element is in; `button` (the default) does nothing on its own. */
    declare type: 'button' | 'reset' | 'submit';
    /** The accessible name, from the aria-label attribute. Overrides the label, even on an icon-only button. */
    declare accessibleLabel: string | undefined;
    declare _hasIcon: boolean;
    declare _slotText: string;
    declare _hasContent: boolean;

    private readonly _internals: ElementInternals;
    private readonly _tooltip = new TooltipController(this);

    constructor() {
        super();
        this.label = '';
        this.size = 'medium';
        this.variant = 'primary';
        this.destructive = false;
        this.width = 'hug';
        this.disabled = false;
        this.iconOnly = false;
        this.tooltip = '';
        this.href = undefined;
        this.target = undefined;
        this.type = 'button';
        this.accessibleLabel = undefined;
        this._hasIcon = false;
        this._slotText = '';
        this._hasContent = false;
        this._internals = this.attachInternals();
        // Registered first, so a disabled button stops the event before any listener a consumer adds.
        this.addEventListener('click', (event) => this._onClick(event));
    }

    private _onClick(event: Event) {
        if (this.disabled) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        const form = this._internals.form;
        if (!form || this.href) return;
        if (this.type === 'submit') form.requestSubmit();
        if (this.type === 'reset') form.reset();
    }

    private _onIconSlotChange(event: Event) {
        this._hasIcon = (event.target as HTMLSlotElement).assignedElements().length > 0;
    }

    private _onLabelSlotChange(event: Event) {
        const nodes = (event.target as HTMLSlotElement).assignedNodes();
        const onlyText = nodes.every((node) => node.nodeType === Node.TEXT_NODE);
        const text = nodes
            .map((node) => node.textContent ?? '')
            .join('')
            .trim();
        this._hasContent = !onlyText || !!text;
        this._slotText = onlyText ? text : '';
    }

    render() {
        const iconOnly = this.iconOnly && this._hasIcon;
        const label = this._slotText || this.label;
        const tooltip = this.tooltip || (iconOnly ? label : '');
        // The tooltip names an icon-only button unless aria-label does, and describes a button with a visible label.
        const labelledBy = tooltip && iconOnly && !this.accessibleLabel ? this._tooltip.id : undefined;
        const describedBy = tooltip && !iconOnly ? this._tooltip.id : undefined;
        const tooltipEvents = tooltip ? this._tooltip : undefined;

        const content = html`
            <span aria-hidden="true" data-button-icon ?hidden=${!this._hasIcon}>
                <slot name="icon" @slotchange=${this._onIconSlotChange}></slot>
            </span>
            <span data-button-label ?hidden=${iconOnly}>
                <slot @slotchange=${this._onLabelSlotChange}></slot>${this._hasContent ? nothing : this.label}
            </span>
            <span aria-hidden="true" data-touch-target></span>
        `;

        const control = this.href
            ? html`<a
                  aria-describedby=${ifDefined(describedBy)}
                  aria-disabled=${ifDefined(this.disabled ? 'true' : undefined)}
                  aria-label=${ifDefined(this.accessibleLabel || label || undefined)}
                  aria-labelledby=${ifDefined(labelledBy)}
                  data-destructive=${ifDefined(this.destructive ? '' : undefined)}
                  data-disabled=${ifDefined(this.disabled ? '' : undefined)}
                  data-has-label=${ifDefined(iconOnly ? undefined : '')}
                  data-pttrn="button"
                  data-size=${this.size}
                  data-touch-target-parent
                  data-variant=${this.variant}
                  data-width=${this.width}
                  href=${ifDefined(this.disabled ? undefined : this.href)}
                  part="button"
                  role="button"
                  target=${ifDefined(this.target)}
                  @blur=${tooltipEvents?.hide}
                  @focus=${tooltipEvents?.show}
                  @mouseleave=${tooltipEvents?.hide}
                  @mouseover=${tooltipEvents?.show}
                  >${content}</a
              >`
            : html`<button
                  aria-describedby=${ifDefined(describedBy)}
                  aria-label=${ifDefined(this.accessibleLabel || label || undefined)}
                  aria-labelledby=${ifDefined(labelledBy)}
                  data-destructive=${ifDefined(this.destructive ? '' : undefined)}
                  data-disabled=${ifDefined(this.disabled ? '' : undefined)}
                  data-has-label=${ifDefined(iconOnly ? undefined : '')}
                  data-pttrn="button"
                  data-size=${this.size}
                  data-touch-target-parent
                  data-variant=${this.variant}
                  data-width=${this.width}
                  part="button"
                  type="button"
                  ?disabled=${this.disabled}
                  @blur=${tooltipEvents?.hide}
                  @focus=${tooltipEvents?.show}
                  @mouseleave=${tooltipEvents?.hide}
                  @mouseover=${tooltipEvents?.show}
              >
                  ${content}
              </button>`;

        return html`${control}${this._tooltip.render(tooltip)}`;
    }
}

define('pttrn-button', PttrnButton);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-button': PttrnButton;
    }
}
