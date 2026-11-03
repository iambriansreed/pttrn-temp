import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { define } from '../../utils/define';
import { TooltipController, tooltipTemplate } from '../../utils/tooltip-controller';
import styles from './list-item.scss';

/**
 * A hybrid interactive component that is used frequently to organize content and offers a wide range of control and
 * navigation in most experiences.
 *
 * The row has a leading element, a label (with optional sub text) and a trailing element. What it is follows its
 * attributes, as the React component follows its props:
 *
 * - Static by default: a plain row.
 * - With `href`, a link.
 * - With `clickable`, a button: listen for `click`, which Enter and Space fire too.
 * - With a `role` of your own (`option`, `menuitem`), the element itself is that item: it takes focus when `clickable`,
 *   and Enter and Space fire `click` on it.
 *
 * `disabled` or `readonly` (or `aria-disabled="true"`, `aria-readonly="true"`) marks the row and stops its clicks, so
 * no `click` listener runs. A label too long for the row is cut with an ellipsis and shows whole in a tooltip on
 * hover.
 *
 * React to Web Component mapping:
 *
 * - `label` → `label`; `subText` → `sub-text`
 * - `leading`, `trailing` → the `leading` and `trailing` slots
 * - `href` → `href` (and `target`)
 * - `onClick` → `clickable` and a `click` listener; `as="button"` is `clickable` too
 * - `disabled`, `readOnly`, `aria-disabled`, `aria-readonly` → `disabled`, `readonly`, or the aria attributes
 * - `role`, `aria-selected` → on the element
 * - `active` → `active`; `width` → `width`
 * - `as="label"` has no counterpart: a label in the shadow root cannot reach a slotted control, which handles its own
 *   clicks.
 *
 * @element pttrn-list-item
 * @slot leading - An icon, image or avatar before the label.
 * @slot trailing - An icon or control after the label.
 * @csspart item - The row: a link, a button or a plain element.
 */
export class PttrnListItem extends LitElement {
    static properties = {
        label: { type: String },
        subText: { type: String, attribute: 'sub-text' },
        href: { type: String },
        target: { type: String },
        clickable: { type: Boolean, reflect: true },
        disabled: { type: Boolean, reflect: true },
        readonly: { type: Boolean, reflect: true },
        active: { type: Boolean, reflect: true },
        width: { type: String, reflect: true },
        _hasLeading: { state: true },
        _hasTrailing: { state: true },
        _hostRole: { state: true },
        _truncated: { state: true },
    };

    static styles = styles;

    /** The text of the row. Without it nothing renders. */
    declare label: string;
    /** A second line under the label. */
    declare subText: string;
    /** Makes the row a link to this URL. */
    declare href: string | undefined;
    /** Where a link opens, as on `<a>`. */
    declare target: string | undefined;
    /** Makes the row a button; listen for `click`. */
    declare clickable: boolean;
    /** Marks the row disabled and stops its clicks. */
    declare disabled: boolean;
    /** Marks the row read-only and stops its clicks. */
    declare readonly: boolean;
    /** Highlights the row as if hovered, for the active option of a list driven from the keyboard. */
    declare active: boolean;
    /** `fill` stretches the row across its container; `hug` fits its content. */
    declare width: 'fill' | 'hug';
    declare _hasLeading: boolean;
    declare _hasTrailing: boolean;
    /** Whether the element carries a role of its own, which makes it the item. */
    declare _hostRole: boolean;
    /** Whether the label was cut short when last hovered, which renders the tooltip. */
    declare _truncated: boolean;

    /** Whether the element set its own tabindex, so it removes only that one. */
    private _ownTabIndex = false;
    private readonly _observer = new MutationObserver(() => this._readHostAttributes());
    private readonly _tooltip = new TooltipController(this, {
        popover: () => this.renderRoot.querySelector<HTMLElement>('[data-pttrn="tooltip"]'),
    });

    constructor() {
        super();
        this.label = '';
        this.subText = '';
        this.href = undefined;
        this.target = undefined;
        this.clickable = false;
        this.disabled = false;
        this.readonly = false;
        this.active = false;
        this.width = 'fill';
        this._hasLeading = false;
        this._hasTrailing = false;
        this._hostRole = false;
        this._truncated = false;
        // Registered first, so a disabled or read-only row stops the click before any listener of the page sees it.
        this.addEventListener('click', (event) => {
            if (this._isDisabled || this._isReadOnly) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        });
        this.addEventListener('keydown', (event) => this._onKeyDown(event));
    }

    connectedCallback() {
        super.connectedCallback();
        this._observer.observe(this, {
            attributes: true,
            attributeFilter: ['role', 'aria-disabled', 'aria-readonly', 'aria-label'],
        });
        this._readHostAttributes();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._observer.disconnect();
    }

    private get _isDisabled() {
        return this.disabled || this.getAttribute('aria-disabled') === 'true';
    }

    private get _isReadOnly() {
        return this.readonly || this.getAttribute('aria-readonly') === 'true';
    }

    /** Whether the row acts: a link, or a button that is neither disabled nor read-only. */
    private get _actionable() {
        return (!!this.href || this.clickable) && !this._isDisabled && !this._isReadOnly;
    }

    private _readHostAttributes() {
        this._hostRole = this.hasAttribute('role');
        this.requestUpdate();
    }

    protected updated() {
        // With a role of its own the element is the item, so it takes focus itself when it acts.
        const focusable = this._hostRole && this._actionable;
        if (focusable && !this.hasAttribute('tabindex')) {
            this.tabIndex = 0;
            this._ownTabIndex = true;
        } else if (!focusable && this._ownTabIndex) {
            this.removeAttribute('tabindex');
            this._ownTabIndex = false;
        }
    }

    /** A host with a role is not a native button, so Enter and Space need handling, as React does for role button. */
    private _onKeyDown(event: KeyboardEvent) {
        if (!this._hostRole || !this._actionable || event.target !== this) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.click();
        }
    }

    /** Shows the whole label in a tooltip while the pointer is on it, when it is cut short. */
    private async _onTextOver(event: MouseEvent) {
        const text = event.currentTarget as HTMLElement;
        this._truncated = text.scrollWidth > text.clientWidth;
        if (!this._truncated) return;
        await this.updateComplete;
        this._tooltip.attach(text);
        this._tooltip.show();
    }

    private _onSlotChange(event: Event, key: '_hasLeading' | '_hasTrailing') {
        this[key] = (event.target as HTMLSlotElement).assignedNodes().length > 0;
    }

    private _content() {
        return html`<span data-leading ?hidden=${!this._hasLeading}
                ><slot name="leading" @slotchange=${(e: Event) => this._onSlotChange(e, '_hasLeading')}></slot></span
            ><span data-item-label
                ><span data-text @mouseover=${this._onTextOver} @mouseleave=${() => this._tooltip.hide()}
                    >${this.label}</span
                >${this.subText ? html`<span data-sub-text>${this.subText}</span>` : nothing}</span
            ><span data-trailing ?hidden=${!this._hasTrailing}
                ><slot name="trailing" @slotchange=${(e: Event) => this._onSlotChange(e, '_hasTrailing')}></slot></span
            >${this._truncated ? html`<span aria-hidden="true">${tooltipTemplate(this.label)}</span>` : nothing}`;
    }

    render() {
        if (!this.label) return nothing;

        const disabled = this._isDisabled;
        const readonly = this._isReadOnly;
        const actionable = this._actionable;
        // Without a role of its own the element is not the item, so the name it is given goes to the link or button.
        const ariaLabel = this._hostRole ? undefined : (this.getAttribute('aria-label') ?? undefined);
        const width = this.width === 'hug' ? 'hug' : undefined;

        if (this.href && !this._hostRole) {
            return html`<a
                aria-label=${ifDefined(ariaLabel)}
                data-pttrn="list-item"
                data-width=${ifDefined(width)}
                href=${this.href}
                part="item"
                tabindex=${actionable ? 0 : -1}
                target=${ifDefined(this.target)}
                ?data-action=${actionable}
                ?data-active=${this.active}
                ?data-disabled=${disabled}
                ?data-readonly=${readonly}
                >${this._content()}</a
            >`;
        }

        if (this.clickable && !this._hostRole) {
            return html`<button
                aria-label=${ifDefined(ariaLabel)}
                data-pttrn="list-item"
                data-width=${ifDefined(width)}
                part="item"
                tabindex=${actionable ? 0 : -1}
                type="button"
                ?data-action=${actionable}
                ?data-active=${this.active}
                ?data-disabled=${disabled}
                ?data-readonly=${readonly}
                ?disabled=${disabled}
            >
                ${this._content()}
            </button>`;
        }

        return html`<div
            data-pttrn="list-item"
            data-width=${ifDefined(width)}
            part="item"
            tabindex=${ifDefined(this._hostRole ? undefined : -1)}
            ?data-action=${actionable}
            ?data-active=${this.active}
            ?data-disabled=${disabled}
            ?data-readonly=${readonly}
        >
            ${this._content()}
        </div>`;
    }
}

define('pttrn-list-item', PttrnListItem);

declare global {
    interface HTMLElementTagNameMap {
        'pttrn-list-item': PttrnListItem;
    }
}
